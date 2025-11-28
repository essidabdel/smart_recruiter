# applications/signals.py
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import Application
from .notifications import (
    send_application_submitted_email,
    send_application_status_changed_email,
    send_new_application_to_recruiter,
)


@receiver(pre_save, sender=Application)
def store_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = Application.objects.get(pk=instance.pk)
            instance._old_status = old.status
        except Application.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=Application)
def handle_application_notifications(sender, instance, created, **kwargs):
    if created:
        send_application_submitted_email(instance)
        send_new_application_to_recruiter(instance)
    else:
        old_status = getattr(instance, "_old_status", None)
        if old_status and old_status != instance.status:
            send_application_status_changed_email(instance, old_status)
