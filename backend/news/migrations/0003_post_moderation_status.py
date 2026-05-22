from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('news', '0002_alter_category_id_alter_comment_id_alter_post_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='post',
            name='status',
            field=models.CharField(choices=[('published', 'Published'), ('hidden', 'Hidden'), ('blocked', 'Blocked')], default='published', max_length=20),
        ),
        migrations.AddField(
            model_name='post',
            name='moderation_note',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.AddField(
            model_name='post',
            name='moderated_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='post',
            name='moderated_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='moderated_posts', to=settings.AUTH_USER_MODEL),
        ),
    ]