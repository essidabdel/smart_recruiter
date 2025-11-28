from django.contrib import admin
from .models import JobPosting


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ("title", "recruiter", "status", "created_at")
    list_filter = ("status", "location", "contract_type")
    search_fields = ("title", "description")
