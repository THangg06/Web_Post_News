from __future__ import annotations

import logging
import re
from functools import lru_cache
from pathlib import Path
from typing import Iterable, Sequence

import joblib
import numpy as np
import pandas as pd
from django.conf import settings

logger = logging.getLogger(__name__)

ENGINEERED_FEATURE_NAMES = (
    "text_length",
    "word_count",
    "exclamation_count",
    "question_count",
    "uppercase_ratio",
)


def _models_dir() -> Path:
    return Path(settings.BASE_DIR) / "models"


def clean_text(text: object) -> str:
    if pd.isna(text):
        return ""
    value = str(text).lower()
    value = re.sub(r"http\S+|www\S+|https\S+", " ", value)
    value = re.sub(r"@[A-Za-z0-9_]+", " ", value)
    value = re.sub(r"#[A-Za-z0-9_]+", " ", value)
    value = re.sub(r"[^a-z\s]", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def extract_engineered_features(texts: Sequence[object]) -> np.ndarray:
    rows: list[list[float]] = []
    for raw_text in texts:
        value = "" if pd.isna(raw_text) else str(raw_text)
        word_count = len(value.split())
        upper_alpha = sum(1 for ch in value if ch.isalpha() and ch.isupper())
        alpha_count = sum(1 for ch in value if ch.isalpha())
        uppercase_ratio = (upper_alpha / alpha_count) if alpha_count else 0.0
        rows.append(
            [
                float(len(value)),
                float(word_count),
                float(value.count("!")),
                float(value.count("?")),
                float(uppercase_ratio),
            ]
        )
    return np.asarray(rows, dtype=np.float32)


@lru_cache(maxsize=1)
def _load_runtime_assets():
    try:
        import torch
        from transformers import AutoModel, AutoTokenizer
    except Exception as exc:  # pragma: no cover - import error should be surfaced clearly in runtime logs
        raise RuntimeError("Unable to import RoBERTa runtime dependencies.") from exc

    models_dir = _models_dir()
    tfidf_path = models_dir / "tfidf_vectorizer.joblib"
    scaler_path = models_dir / "roberta_scaler.joblib"
    xgb_path = models_dir / "xgboost_model.joblib"

    if not tfidf_path.exists():
        raise FileNotFoundError(f"Missing TF-IDF vectorizer: {tfidf_path}")
    if not scaler_path.exists():
        raise FileNotFoundError(f"Missing RoBERTa scaler: {scaler_path}")
    if not xgb_path.exists():
        raise FileNotFoundError(f"Missing XGBoost model: {xgb_path}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    tokenizer = AutoTokenizer.from_pretrained("roberta-base")
    roberta_model = AutoModel.from_pretrained("roberta-base")
    roberta_model.to(device)
    roberta_model.eval()

    tfidf_vectorizer = joblib.load(tfidf_path)
    roberta_scaler = joblib.load(scaler_path)
    xgb_model = joblib.load(xgb_path)

    return {
        "torch": torch,
        "device": device,
        "tokenizer": tokenizer,
        "roberta_model": roberta_model,
        "tfidf_vectorizer": tfidf_vectorizer,
        "roberta_scaler": roberta_scaler,
        "xgb_model": xgb_model,
    }


def _extract_embeddings(texts: Sequence[object], batch_size: int = 16) -> np.ndarray:
    assets = _load_runtime_assets()
    torch = assets["torch"]
    tokenizer = assets["tokenizer"]
    roberta_model = assets["roberta_model"]
    device = assets["device"]

    raw_texts = ["" if pd.isna(text) else str(text) for text in texts]
    if not raw_texts:
        return np.empty((0, 768), dtype=np.float32)

    batches: list[np.ndarray] = []
    for start in range(0, len(raw_texts), batch_size):
        batch_texts = raw_texts[start : start + batch_size]
        inputs = tokenizer(batch_texts, return_tensors="pt", padding=True, truncation=True, max_length=128)
        inputs = {key: value.to(device) for key, value in inputs.items()}
        with torch.no_grad():
            outputs = roberta_model(**inputs)
        batches.append(outputs.last_hidden_state[:, 0, :].cpu().numpy())

    return np.vstack(batches)


def _prediction_text(post: object) -> str:
    title = str(getattr(post, "title", "") or "").strip()
    if title:
        return title
    return str(getattr(post, "content", "") or "").strip()


def build_feature_matrix(texts: Sequence[object]) -> np.ndarray:
    assets = _load_runtime_assets()
    tfidf_vectorizer = assets["tfidf_vectorizer"]
    roberta_scaler = assets["roberta_scaler"]

    raw_texts = ["" if pd.isna(text) else str(text) for text in texts]
    cleaned_texts = [clean_text(text) for text in raw_texts]

    tfidf_matrix = tfidf_vectorizer.transform(cleaned_texts).toarray()
    roberta_embeddings = _extract_embeddings(raw_texts)
    roberta_scaled = roberta_scaler.transform(roberta_embeddings)
    engineered_features = extract_engineered_features(raw_texts)
    return np.hstack([tfidf_matrix, roberta_scaled, engineered_features])


def predict_texts(texts: Sequence[object]) -> list[dict[str, object]]:
    raw_texts = ["" if pd.isna(text) else str(text) for text in texts]
    if not raw_texts:
        return []

    assets = _load_runtime_assets()
    xgb_model = assets["xgb_model"]

    feature_matrix = build_feature_matrix(raw_texts)
    fake_probabilities = xgb_model.predict_proba(feature_matrix)[:, 1]
    predicted_labels = (fake_probabilities >= 0.5).astype(int)

    predictions: list[dict[str, object]] = []
    for label, probability in zip(predicted_labels, fake_probabilities):
        is_fake = int(label) == 1
        predictions.append(
            {
                "predicted_label": int(label),
                "predicted_tag": "fake" if is_fake else "real",
                "predicted_tag_vi": "nghi fake" if is_fake else "real",
                "fake_probability": float(probability),
            }
        )
    return predictions


def attach_predictions(posts: Iterable[object]) -> list[object]:
    post_list = list(posts)
    predictions = predict_texts([_prediction_text(post) for post in post_list])
    for post, prediction in zip(post_list, predictions):
        setattr(post, "_ml_prediction", prediction)
    return post_list


def predict_post(post_text: object) -> dict[str, object]:
    return predict_texts([post_text])[0]