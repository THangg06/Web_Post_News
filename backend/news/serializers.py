from rest_framework import serializers
from .models import Post, Category, Comment
from django.contrib.auth.models import User


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'avatar', 'is_staff', 'is_superuser', 'role']

    def get_avatar(self, obj):
        return "/default-avatar.svg"

    def get_role(self, obj):
        return 'admin' if obj.is_staff or obj.is_superuser else 'user'


class CommentSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'post', 'author', 'content', 'created_at']
        read_only_fields = ['created_at']


class PostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    moderated_by = UserSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    category_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    author_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    client_user = serializers.DictField(write_only=True, required=False)
    comments = CommentSerializer(many=True, read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            'id', 'title', 'content', 'category', 'category_id', 'category_name', 'author', 'author_name', 'client_user',
            'image', 'feeling', 'status', 'moderation_note', 'moderated_by', 'moderated_at', 'views', 'created_at', 'updated_at',
            'likes_count', 'is_liked', 'comments'
        ]
        read_only_fields = ['id', 'status', 'moderation_note', 'moderated_by', 'moderated_at', 'views', 'created_at', 'updated_at']

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def create(self, validated_data):
        category_name = validated_data.pop('category_name', None)
        validated_data.pop('author_name', None)
        validated_data.pop('client_user', None)
        if category_name and not validated_data.get('category'):
            category, _ = Category.objects.get_or_create(name=category_name)
            validated_data['category'] = category
        return super().create(validated_data)
