from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from datetime import datetime, time
from .models import Post, Category, Comment
from .serializers import PostSerializer, CategorySerializer, CommentSerializer
import logging

logger = logging.getLogger(__name__)


class IsStaffOrSuperuser(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))


@api_view(['GET'])
def hello(request):
    return Response({"message": "Hello React"})


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        post_id = self.request.query_params.get('post_id')
        if post_id:
            return Comment.objects.filter(post_id=post_id)
        return Comment.objects.all()

    def perform_create(self, serializer):
        author = self.request.user if self.request.user.is_authenticated else User.objects.first()
        if author is None:
            author = User.objects.create_user(username='anonymous', password='anonymous123')
        serializer.save(author=author)


class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer
    permission_classes = [AllowAny]

    def _is_admin_user(self, user):
        return bool(user and user.is_authenticated and (user.is_staff or user.is_superuser))

    def get_queryset(self):
        queryset = Post.objects.select_related('author', 'category', 'moderated_by').all().order_by('-created_at')
        user = self.request.user

        if not self._is_admin_user(user):
            queryset = queryset.filter(status=Post.STATUS_PUBLISHED)

        author_id = (self.request.query_params.get('author_id') or '').strip()
        if author_id:
            queryset = queryset.filter(author_id=author_id)
            if not (user.is_authenticated and (user.is_staff or str(user.id) == author_id)):
                queryset = queryset.filter(status=Post.STATUS_PUBLISHED)

        category_id = (self.request.query_params.get('category_id') or '').strip()
        if category_id and category_id.lower() != 'all':
            queryset = queryset.filter(category_id=category_id)

        search = (self.request.query_params.get('search') or '').strip()
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(content__icontains=search)
                | Q(author__username__icontains=search)
                | Q(author__first_name__icontains=search)
                | Q(author__last_name__icontains=search)
            )

        latest_only = (self.request.query_params.get('latest') or '').lower()
        if latest_only in ('1', 'true', 'yes'):
            limit = self.request.query_params.get('limit')
            if limit:
                try:
                    limit_value = int(limit)
                    if limit_value > 0:
                        queryset = queryset[:limit_value]
                except ValueError:
                    pass

        return queryset

    def retrieve(self, request, *args, **kwargs):
        post = Post.objects.select_related('author', 'category', 'moderated_by').filter(pk=kwargs.get('pk')).first()
        if post is None:
            raise NotFound()

        is_owner = request.user.is_authenticated and request.user.id == post.author_id
        is_admin = self._is_admin_user(request.user)
        if post.status != Post.STATUS_PUBLISHED and not (is_owner or is_admin):
            raise NotFound()

        serializer = self.get_serializer(post)
        return Response(serializer.data)

    def perform_create(self, serializer):
        logger.info(f"POST request received")
        logger.info(f"request.user: {self.request.user}")
        logger.info(f"request.user.is_authenticated: {self.request.user.is_authenticated}")
        logger.info(f"request.auth: {self.request.auth}")

        author = None
        if self.request.user.is_authenticated:
            author = self.request.user
        else:
            client_user = serializer.validated_data.get('client_user') or {}
            client_user_id = client_user.get('id')
            client_username = (client_user.get('username') or client_user.get('email') or '').strip()

            if client_user_id:
                author = User.objects.filter(id=client_user_id).first()

            if author is None and client_username:
                author = User.objects.filter(username=client_username).first() or User.objects.filter(email=client_username).first()

        if author is None:
            author = User.objects.first()
        if author is None:
            author = User.objects.create_user(username='anonymous', password='anonymous123')
        logger.info(f"Setting author to: {author}")
        serializer.save(author=author)

    def _moderate_post(self, request, status_value, pk=None):
        post = self.get_object()
        post.status = status_value
        post.moderation_note = (request.data.get('note') or '').strip()
        post.moderated_by = request.user
        post.moderated_at = timezone.now()
        post.save(update_fields=['status', 'moderation_note', 'moderated_by', 'moderated_at', 'updated_at'])
        return Response(self.get_serializer(post).data)

    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        post = self.get_object()
        if not request.user.is_authenticated:
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        if request.user in post.likes.all():
            post.likes.remove(request.user)
            return Response({'status': 'unliked'})
        else:
            post.likes.add(request.user)
            return Response({'status': 'liked'})

    @action(detail=True, methods=['get'])
    def increment_views(self, request, pk=None):
        post = self.get_object()
        post.views += 1
        post.save()
        return Response({'views': post.views})

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def hide(self, request, pk=None):
        return self._moderate_post(request, Post.STATUS_HIDDEN, pk=pk)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def block(self, request, pk=None):
        return self._moderate_post(request, Post.STATUS_BLOCKED, pk=pk)

    @action(detail=True, methods=['post'], permission_classes=[IsStaffOrSuperuser])
    def publish(self, request, pk=None):
        return self._moderate_post(request, Post.STATUS_PUBLISHED, pk=pk)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category_id = request.query_params.get('category_id')
        if category_id:
            posts = Post.objects.filter(category_id=category_id).order_by('-created_at')
            serializer = self.get_serializer(posts, many=True)
            return Response(serializer.data)
        return Response({'error': 'category_id required'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsStaffOrSuperuser])
def admin_dashboard(request):
    posts = Post.objects.select_related('author', 'category', 'moderated_by').order_by('-created_at')

    author_id = (request.query_params.get('author_id') or '').strip()
    post_status = (request.query_params.get('status') or '').strip().lower()
    search = (request.query_params.get('search') or '').strip()
    from_date = (request.query_params.get('from') or '').strip()
    to_date = (request.query_params.get('to') or '').strip()
    user_search = (request.query_params.get('user_search') or '').strip()

    if author_id:
        posts = posts.filter(author_id=author_id)

    if post_status and post_status != 'all' and post_status in dict(Post.STATUS_CHOICES):
        posts = posts.filter(status=post_status)

    if search:
        posts = posts.filter(
            Q(title__icontains=search)
            | Q(content__icontains=search)
            | Q(author__username__icontains=search)
            | Q(author__first_name__icontains=search)
            | Q(author__last_name__icontains=search)
        )

    def _parse_bound(value, end_of_day=False):
        if not value:
            return None
        parsed_datetime = parse_datetime(value)
        if parsed_datetime is not None:
            return parsed_datetime
        parsed_date = parse_date(value)
        if parsed_date is None:
            return None
        bound_time = time.max if end_of_day else time.min
        return timezone.make_aware(datetime.combine(parsed_date, bound_time))

    from_bound = _parse_bound(from_date, end_of_day=False)
    to_bound = _parse_bound(to_date, end_of_day=True)

    if from_bound:
        posts = posts.filter(created_at__gte=from_bound)
    if to_bound:
        posts = posts.filter(created_at__lte=to_bound)

    users = User.objects.order_by('-date_joined')
    if user_search:
        users = users.filter(
            Q(username__icontains=user_search)
            | Q(email__icontains=user_search)
            | Q(first_name__icontains=user_search)
            | Q(last_name__icontains=user_search)
        )

    recent_users = users[:12]
    all_users = users

    stats = {
        'total_users': User.objects.count(),
        'active_users': User.objects.filter(is_active=True).count(),
        'admin_users': User.objects.filter(is_staff=True).count(),
        'total_posts': Post.objects.count(),
        'published_posts': Post.objects.filter(status=Post.STATUS_PUBLISHED).count(),
        'hidden_posts': Post.objects.filter(status=Post.STATUS_HIDDEN).count(),
        'blocked_posts': Post.objects.filter(status=Post.STATUS_BLOCKED).count(),
        'total_comments': Comment.objects.count(),
    }

    post_serializer = PostSerializer(posts, many=True, context={'request': request})

    return Response({
        'stats': stats,
        'recent_users': [
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'date_joined': user.date_joined,
            }
            for user in recent_users
        ],
        'users': [
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'is_superuser': user.is_superuser,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
            }
            for user in all_users
        ],
        'posts': post_serializer.data,
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsStaffOrSuperuser])
def admin_user_detail(request, user_id):
    user = User.objects.filter(pk=user_id).first()
    if user is None:
        return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'role': 'admin' if user.is_superuser else 'staff' if user.is_staff else 'user',
            'date_joined': user.date_joined,
        })

    role = (request.data.get('role') or '').strip().lower()
    is_active = request.data.get('is_active')

    if role:
        if role == 'superuser':
            user.is_staff = True
            user.is_superuser = True
        elif role == 'staff':
            user.is_staff = True
            user.is_superuser = False
        else:
            user.is_staff = False
            user.is_superuser = False

    if is_active is not None:
        user.is_active = bool(is_active)

    user.save()

    return Response({
        'message': 'User updated successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'is_active': user.is_active,
            'role': 'admin' if user.is_superuser else 'staff' if user.is_staff else 'user',
        }
    })