from django.db.models import Count, Avg

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Application
from .serializers import ApplicationSerializer
from ai_engine.pipeline import analyze_application


class ApplicationPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user

        # lecture autorisée selon rôle
        if request.method in permissions.SAFE_METHODS:
            if user.role == "admin":
                return True
            if user.role == "candidate":
                return obj.candidate == user
            if user.role == "recruiter":
                return obj.job.recruiter == user
            return False

        # écriture : seulement admin + recruteur
        if user.role == "admin":
            return True
        if user.role == "recruiter":
            return obj.job.recruiter == user

        # candidat ne peut pas modifier
        return False



class ApplicationViewSet(viewsets.ModelViewSet):
    queryset = Application.objects.all().order_by("-created_at")
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated, ApplicationPermission]

    def perform_create(self, serializer):
        serializer.save(candidate=self.request.user, status="received")

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset()
        job_id = self.request.query_params.get("job")

        if user.role == "admin":
            qs = qs
        elif user.role == "candidate":
            qs = qs.filter(candidate=user)
        elif user.role == "recruiter":
            qs = qs.filter(job__recruiter=user)
        else:
            return qs.none()

        if job_id:
            qs = qs.filter(job_id=job_id)

        return qs

    @action(detail=True, methods=["post"])
    def analyze(self, request, pk=None):
        application = self.get_object()
        application = analyze_application(application.id)
        serializer = self.get_serializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def stats(self, request):
        qs = self.get_queryset()
        total = qs.count()
        avg_score = qs.aggregate(avg=Avg("final_score"))["avg"]

        by_status = (
            qs.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        data = {
            "total_applications": total,
            "average_score": avg_score,
            "by_status": list(by_status),
        }
        return Response(data, status=status.HTTP_200_OK)
