from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"


class Post(models.Model):
    FEELING_CHOICES = [
        ('happy', '😊 Vui vẻ'),
        ('sad', '😢 Buồn'),
        ('angry', '😠 Giận dữ'),
        ('surprised', '😮 Ngạc nhiên'),
        ('excited', '😆 Hứng thú'),
        ('love', '😍 Yêu thích'),
    ]
    
    title = models.CharField(max_length=255)
    content = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    image = models.TextField(null=True, blank=True)
    feeling = models.CharField(max_length=20, choices=FEELING_CHOICES, null=True, blank=True)
    views = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Comment by {self.author} on {self.post}"
    
    class Meta:
        ordering = ['-created_at']