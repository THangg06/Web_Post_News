from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CategoryViewSet, CommentViewSet, hello, admin_dashboard, admin_user_detail
from .auth_views import register_user, login_user, logout_user, get_current_user, update_profile, change_password, forgot_password

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = [
    path('', include(router.urls)),
    path('hello/', hello),
    path('admin/dashboard/', admin_dashboard),
    path('admin/users/<int:user_id>/', admin_user_detail),
    path('auth/register/', register_user),
    path('auth/login/', login_user),
    path('auth/logout/', logout_user),
    path('auth/me/', get_current_user),
    path('auth/profile/update/', update_profile),
    path('auth/password/change/', change_password),
    path('auth/password/forgot/', forgot_password),
]