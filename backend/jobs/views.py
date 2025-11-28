from django.db.models import Count, Avg
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import JobPosting
from .serializers import JobPostingSerializer
from applications.models import Application
from ai_engine.pipeline import analyze_job
from applications.serializers import ApplicationSerializer


class IsRecruiterOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            request.user.is_authenticated
            and request.user.role in ["recruiter", "admin"]
        )

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.role == "admin":
            return True
        return obj.recruiter == request.user


class JobPostingViewSet(viewsets.ModelViewSet):
    queryset = JobPosting.objects.all().order_by("-created_at")
    serializer_class = JobPostingSerializer
    permission_classes = [IsRecruiterOrAdmin]

    def perform_create(self, serializer):
        serializer.save(recruiter=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        # plus tard: filtres (status, search, etc.)
        return qs

    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        job = self.get_object()
        qs = Application.objects.filter(job=job)

        total = qs.count()
        avg = qs.aggregate(avg=Avg("final_score"))["avg"]
        by_status = (
            qs.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        data = {
            "total_applications": total,
            "average_score": avg,
            "by_status": list(by_status),
        }
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"])
    def top_candidates(self, request, pk=None):
        job = self.get_object()
        qs = (
            Application.objects.filter(job=job)
            .exclude(final_score__isnull=True)
            .order_by("-final_score")[:10]
        )

        data = [
            {
                "application_id": a.id,
                "candidate_username": a.candidate.username,
                "final_score": a.final_score,
                "status": a.status,
            }
            for a in qs
        ]
        return Response(data)

    @action(detail=True, methods=["post"])
    def analyze_all(self, request, pk=None):
        job, app_ids = analyze_job(pk)
        from applications.models import Application

        qs = Application.objects.filter(id__in=app_ids).order_by("-final_score")
        serialized = ApplicationSerializer(qs, many=True)
        return Response(
            {
                "job_id": job.id,
                "job_title": job.title,
                "processed_applications": len(app_ids),
                "applications": serialized.data,
            }
        )
