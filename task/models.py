from django.db import models
from django.contrib.auth.models import AbstractUser

# Create your models here.
class User(AbstractUser):
    pass

class Task(models.Model):
   title = models.CharField(max_length=100)
   description = models.TextField()
   status = models.BooleanField(default=False)
   created_at = models.DateTimeField(auto_now_add=True)
   user = models.ForeignKey("User", on_delete=models.CASCADE)
   
   def __str__(self):
       return f"title:{self.title} description:{self.description} status:{self.status} created-at:{self.created_at} {self.user}"