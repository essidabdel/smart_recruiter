from rest_framework import generics, permissions, viewsets
from rest_framework.exceptions import MethodNotAllowed

from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    UserAdminSerializer,
    ProfileSerializer,
)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.urls import reverse


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (getattr(user, "role", None) == "admin" or user.is_superuser)
        )


class UserAdminViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserAdminSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get_queryset(self):
        qs = super().get_queryset()
        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        return qs

    def create(self, request, *args, **kwargs):
        # on ne crée pas d'utilisateurs via ce ViewSet
        raise MethodNotAllowed("POST")


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email")
        if not email:
            return Response({"message": "Adresse email requise."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()

        # Build generic response to avoid account enumeration
        generic_response = {"message": "Si un compte existe, un email de réinitialisation a été envoyé."}

        if not user:
            return Response(generic_response)

        try:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
            reset_link = f"{frontend}/reset-password?uid={uid}&token={token}"

            subject = "Réinitialisation de votre mot de passe"
            message = (
                f"Bonjour {user.username},\n\n"
                "Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant (ou copiez-le dans votre navigateur) pour définir un nouveau mot de passe:\n\n"
                f"{reset_link}\n\n"
                "Si vous n'avez pas demandé cela, ignorez ce message.\n\n"
                "Cordialement,\nL'équipe"
            )

            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
            return Response(generic_response)
        except Exception as exc:
            return Response({"message": "Erreur lors de l'envoi de l'email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")

        if not uidb64 or not token or not new_password:
            return Response({"message": "Paramètres requis manquants."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.filter(pk=uid).first()
            if not user:
                return Response({"message": "Utilisateur introuvable."}, status=status.HTTP_400_BAD_REQUEST)

            if not default_token_generator.check_token(user, token):
                return Response({"message": "Token invalide ou expiré."}, status=status.HTTP_400_BAD_REQUEST)

            # Optional: validate password strength using Django validators
            user.set_password(new_password)
            user.save()
            return Response({"message": "Mot de passe réinitialisé avec succès."})
        except Exception:
            return Response({"message": "Erreur lors de la réinitialisation."}, status=status.HTTP_400_BAD_REQUEST)
