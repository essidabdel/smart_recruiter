# applications/models.py
from django.db import models
from django.conf import settings


class Application(models.Model):
    class Status(models.TextChoices):
        RECEIVED = "received", "Reçue"
        IN_REVIEW = "in_review", "En cours"
        SHORTLISTED = "shortlisted", "Shortlist"
        REJECTED = "rejected", "Refusée"
        HIRED = "hired", "Embauché"

    job = models.ForeignKey(
        "jobs.JobPosting",
        on_delete=models.CASCADE,
        related_name="applications",
    )
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    cv_file = models.FileField(upload_to="cv/")
    cover_letter_file = models.FileField(upload_to="cover_letters/", blank=True, null=True)
    cover_letter_text = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RECEIVED,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # score global pour accès rapide
    final_score = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.candidate} → {self.job}"
    

class ParsedResume(models.Model):
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name="parsed_resume",
    )
    raw_text = models.TextField(blank=True)
    skills = models.JSONField(default=list, blank=True)
    experiences = models.JSONField(default=list, blank=True)
    education = models.JSONField(default=list, blank=True)
    extracted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ParsedResume({self.application_id})"


class ApplicationScore(models.Model):
    application = models.OneToOneField(
        Application,
        on_delete=models.CASCADE,
        related_name="scores",
    )
    similarity_score = models.FloatField(null=True, blank=True)
    final_score = models.FloatField(null=True, blank=True)
    recommendation = models.TextField(blank=True)
    model_version = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"Score({self.application_id})"
