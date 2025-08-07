import uuid
from django.db import models

class UserProfile(models.Model):
    id = models.CharField(primary_key=True, max_length=100)  # Auth0 ID
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50)
    skills = models.JSONField(default=list)
    experience = models.CharField(max_length=20)
    resume = models.FileField(upload_to='resumes/', null=True, blank=True)

    def __str__(self):
        return self.name


class Job(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    external_id = models.CharField(max_length=100, null=True, blank=True, unique=True)
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    posted = models.DateField()
    match_score = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    tags = models.JSONField(default=list)
    salary = models.CharField(max_length=50)
    benefits = models.JSONField(default=list)
    matched_skills = models.JSONField(null=True, blank=True, default=list)
    missing_skills = models.JSONField(null=True, blank=True, default=list)
    explanation = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.title} at {self.company}"
