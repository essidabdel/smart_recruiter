from rest_framework import serializers
from .models import JobPosting


class JobPostingSerializer(serializers.ModelSerializer):
    recruiter_username = serializers.ReadOnlyField(source="recruiter.username")

    class Meta:
        model = JobPosting
        fields = "__all__"
        read_only_fields = ["recruiter", "created_at", "updated_at"]
