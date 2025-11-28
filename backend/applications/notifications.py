# applications/notifications.py
from django.core.mail import send_mail
from django.conf import settings


def send_application_submitted_email(application):
    candidate = application.candidate
    job = application.job

    if not candidate.email:
        return

    subject = f"Candidature reçue pour le poste : {job.title}"
    message = (
        f"Bonjour {candidate.username},\n\n"
        f"Votre candidature pour le poste '{job.title}' a bien été reçue.\n"
        f"Nous reviendrons vers vous après analyse.\n\n"
        f"Cordialement,\nL'équipe RH IA"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [candidate.email],
        fail_silently=True,
    )


def send_application_status_changed_email(application, old_status):
    candidate = application.candidate
    job = application.job

    if not candidate.email:
        return

    subject = f"Mise à jour de votre candidature : {job.title}"
    message = (
        f"Bonjour {candidate.username},\n\n"
        f"Le statut de votre candidature pour le poste '{job.title}' "
        f"est passé de '{old_status}' à '{application.status}'.\n\n"
        f"Cordialement,\nL'équipe RH IA"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [candidate.email],
        fail_silently=True,
    )


def send_new_application_to_recruiter(application):
    job = application.job
    recruiter = job.recruiter

    if not recruiter.email:
        return

    subject = f"Nouvelle candidature pour votre poste : {job.title}"
    message = (
        f"Bonjour {recruiter.username},\n\n"
        f"Une nouvelle candidature a été soumise pour le poste '{job.title}'.\n"
        f"Candidat : {application.candidate.username}\n\n"
        f"Cordialement,\nL'application RH IA"
    )

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [recruiter.email],
        fail_silently=True,
    )
