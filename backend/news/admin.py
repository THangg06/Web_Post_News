from django.contrib import admin, messages
from django.utils.translation import gettext_lazy as _
import logging

from .models import Post, Category, Comment

logger = logging.getLogger(__name__)


class PredictedTagFilter(admin.SimpleListFilter):
    title = _('Predicted Tag')
    parameter_name = 'predicted_tag'

    def lookups(self, request, model_admin):
        return (
            ('fake', _('Fake / nghi fake')),
            ('real', _('Real')),
        )

    def queryset(self, request, queryset):
        value = self.value()
        if value is None:
            return queryset

        # Evaluate queryset and attach predictions, then filter by tag
        posts = list(queryset)
        try:
            from .predictor import attach_predictions

            attach_predictions(posts)
            ids = [p.id for p, pred in zip(posts, [getattr(p, '_ml_prediction', {}) for p in posts]) if getattr(p, '_ml_prediction', {}).get('predicted_tag') == value]
            return queryset.filter(id__in=ids)
        except Exception:
            logger.exception('Failed to compute predictions for admin filter')
            return queryset


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'status', 'views', 'predicted_tag_display', 'fake_probability_display', 'created_at']
    search_fields = ['title', 'content', 'author__username']
    list_filter = ['category', 'status', 'created_at', PredictedTagFilter]
    readonly_fields = ['views', 'created_at', 'updated_at', 'moderated_by', 'moderated_at']
    actions = ['recompute_predictions']

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        posts = list(qs)
        try:
            from .predictor import attach_predictions

            attach_predictions(posts)
        except Exception:
            logger.exception('Failed to attach ML predictions in admin')
        return qs

    def _get_prediction(self, obj):
        # Prefer persisted fields when available
        if getattr(obj, 'predicted_tag', None) is not None or getattr(obj, 'fake_probability', None) is not None:
            return {
                'predicted_tag': getattr(obj, 'predicted_tag', None),
                'predicted_tag_vi': getattr(obj, 'predicted_tag_vi', None),
                'predicted_label': getattr(obj, 'predicted_label', None),
                'fake_probability': getattr(obj, 'fake_probability', None),
            }

        pred = getattr(obj, '_ml_prediction', None)
        if pred is None:
            try:
                from .predictor import predict_post

                pred = predict_post(obj.title or obj.content)
                setattr(obj, '_ml_prediction', pred)
            except Exception:
                logger.exception('Failed to compute prediction for Post id=%s', getattr(obj, 'id', None))
                return None
        return pred

    def predicted_tag_display(self, obj):
        pred = self._get_prediction(obj)
        if not pred:
            return 'N/A'
        return pred.get('predicted_tag', 'N/A')

    predicted_tag_display.short_description = _('Predicted')

    def fake_probability_display(self, obj):
        pred = self._get_prediction(obj)
        if not pred:
            return 'N/A'
        prob = pred.get('fake_probability')
        if prob is None:
            return 'N/A'
        return f"{prob:.0%}"

    fake_probability_display.short_description = _('Fake %')

    def recompute_predictions(self, request, queryset):
        posts = list(queryset)
        try:
            from .predictor import attach_predictions
            attach_predictions(posts)
            # persist predictions to DB for faster filtering/queries
            for post in posts:
                pred = getattr(post, '_ml_prediction', None)
                if not pred:
                    continue
                try:
                    post.predicted_label = pred.get('predicted_label')
                    post.predicted_tag = pred.get('predicted_tag')
                    post.predicted_tag_vi = pred.get('predicted_tag_vi')
                    post.fake_probability = pred.get('fake_probability')
                    post.save(update_fields=['predicted_label', 'predicted_tag', 'predicted_tag_vi', 'fake_probability'])
                except Exception:
                    logger.exception('Failed to save prediction for Post id=%s', getattr(post, 'id', None))

            self.message_user(request, _('Recomputed and saved predictions for %(count)d posts.') % {'count': len(posts)}, level=messages.SUCCESS)
        except Exception:
            logger.exception('Failed to recompute predictions for selected posts')
            self.message_user(request, _('Failed to recompute predictions.'), level=messages.ERROR)

    recompute_predictions.short_description = _('Recompute ML predictions for selected posts')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'post', 'created_at']
    search_fields = ['content', 'author__username']
    readonly_fields = ['created_at']
