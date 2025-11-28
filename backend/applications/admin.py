from django.contrib import admin
from .models import Application, ParsedResume, ApplicationScore


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("job", "candidate", "status", "final_score", "created_at")
    list_filter = ("status", "job__title")
    search_fields = ("candidate__username", "job__title")


@admin.register(ParsedResume)
class ParsedResumeAdmin(admin.ModelAdmin):
    list_display = ("application", "extracted_at")


@admin.register(ApplicationScore)
class ApplicationScoreAdmin(admin.ModelAdmin):
    list_display = ("application", "final_score", "similarity_score", "created_at")
