# applications/serializers.py
from rest_framework import serializers
from .models import Application, ParsedResume, ApplicationScore

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 Mo
ALLOWED_EXT = [".pdf"]


class ParsedResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParsedResume
        fields = "__all__"


class ApplicationScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApplicationScore
        fields = "__all__"


class ApplicationSerializer(serializers.ModelSerializer):
    candidate_username = serializers.ReadOnlyField(source="candidate.username")
    job_title = serializers.ReadOnlyField(source="job.title")
    parsed_resume = ParsedResumeSerializer(read_only=True)
    scores = ApplicationScoreSerializer(read_only=True)

    class Meta:
        model = Application
        fields = "__all__"
        read_only_fields = [
            "candidate",
            "created_at",
            "updated_at",
            "final_score",
        ]

    def _validate_file(self, file):
        if not file:
            return file
        name = file.name.lower()
        if not any(name.endswith(ext) for ext in ALLOWED_EXT):
            raise serializers.ValidationError("Seuls les fichiers PDF sont autorisés.")
        if file.size > MAX_FILE_SIZE:
            raise serializers.ValidationError("Fichier trop volumineux (max 5 Mo).")
        return file

    def validate_cv_file(self, value):
        return self._validate_file(value)

    def validate_cover_letter_file(self, value):
        return self._validate_file(value)

    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user if request else None

        # Candidat connecté : on force candidate + on utilise default_cv si besoin
        if user and getattr(user, "role", None) == "candidate":
            validated_data["candidate"] = user

            # si pas de CV uploadé mais un CV par défaut existe, on le réutilise
            if not validated_data.get("cv_file") and getattr(user, "default_cv", None):
                validated_data["cv_file"] = user.default_cv

        return super().create(validated_data)
