const AUTH_KEY = "pbl7_user";

export function getCurrentUser() {
  const rawValue = localStorage.getItem(AUTH_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

export function setCurrentUser(user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  localStorage.removeItem(AUTH_KEY);
}
