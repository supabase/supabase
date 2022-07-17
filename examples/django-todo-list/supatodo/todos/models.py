from django.db import models

# Create your models here.

class Todo(models.Model):
    name = models.CharField(max_length=30)
    description = models.TextField()
    created_at = models.DateTimeField()
    photo = models.FileField(
        upload_to='photos',
        default=None,
    )
