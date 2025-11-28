from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        RECRUITER = "recruiter", "Recruiter"
        CANDIDATE = "candidate", "Candidate"

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CANDIDATE,
    )

    # Profil candidat
    city = models.CharField(max_length=100, blank=True)
    preferred_techs = models.CharField(max_length=255, blank=True)
    default_cv = models.FileField(upload_to="default_cvs/", blank=True, null=True)

    # Profil recruteur / entreprise
    company_name = models.CharField(max_length=255, blank=True)
    company_sector = models.CharField(max_length=100, blank=True)
    company_size = models.CharField(max_length=50, blank=True)
    company_logo_url = models.URLField(blank=True)
    hiring_needs = models.TextField(blank=True)
    tech_stack = models.TextField(blank=True)
    remote_policy = models.CharField(max_length=100, blank=True)

    # Champ que tu avais déjà
    position_title = models.CharField(max_length=255, blank=True)

    def is_admin(self):
        return self.role == self.Role.ADMIN

    def is_recruiter(self):
        return self.role == self.Role.RECRUITER

    def is_candidate(self):
        return self.role == self.Role.CANDIDATE
