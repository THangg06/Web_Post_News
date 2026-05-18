from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Post, Category, Comment
from .serializers import PostSerializer, CategorySerializer, CommentSerializer
import logging

logger = logging.getLogger(__name__)


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

    def get_queryset(self):
        queryset = Post.objects.all().order_by('-created_at')

        author_id = (self.request.query_params.get('author_id') or '').strip()
        if author_id:
            queryset = queryset.filter(author_id=author_id)

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

    def perform_create(self, serializer):
        logger.info(f"POST request received")
        logger.info(f"request.user: {self.request.user}")
        logger.info(f"request.user.is_authenticated: {self.request.user.is_authenticated}")
        logger.info(f"request.auth: {self.request.auth}")
        
        author = self.request.user if self.request.user.is_authenticated else User.objects.first()
        if author is None:
            author = User.objects.create_user(username='anonymous', password='anonymous123')
        logger.info(f"Setting author to: {author}")
        serializer.save(author=author)

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

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        category_id = request.query_params.get('category_id')
        if category_id:
            posts = Post.objects.filter(category_id=category_id).order_by('-created_at')
            serializer = self.get_serializer(posts, many=True)
            return Response(serializer.data)
        return Response({'error': 'category_id required'}, status=status.HTTP_400_BAD_REQUEST)