# ai_engine/pipeline.py
from django.utils import timezone

from jobs.models import JobPosting
from applications.models import Application, ParsedResume, ApplicationScore
from ai_engine.services.resume_analyzer import (
    extract_text_from_pdf,
    dummy_extract_structured_info,
    compute_similarity_score,
)


def _compute_final_score(similarity_score: float) -> float:
    """Score basé uniquement sur MiniLM"""
    return max(0.0, min(float(similarity_score), 1.0))


def _build_recommendation(final_score: float, skills=None) -> str:
    if final_score >= 0.8:
        base = "Candidat fortement recommandé : à interviewer en priorité."
    elif final_score >= 0.6:
        base = "Candidat intéressant : à considérer pour un entretien."
    elif final_score >= 0.4:
        base = "Candidat moyen : à garder en réserve selon le volume."
    else:
        base = "Candidat peu pertinent pour ce poste."

    if skills:
        base += f" Compétences détectées : {', '.join(skills[:8])}."
    return base


def analyze_application(
    application_id: int,
    model_version: str = "minilm-finetuned-v1",
) -> Application:
    app = Application.objects.select_related("job", "candidate").get(id=application_id)

    job_desc = app.job.description or ""

    cv_text = ""
    if app.cv_file:
        try:
            cv_text = extract_text_from_pdf(app.cv_file.path)
        except Exception:
            cv_text = ""

    info = dummy_extract_structured_info(cv_text or "")

    ParsedResume.objects.update_or_create(
        application=app,
        defaults={
            "raw_text": cv_text or "",
            "skills": info.get("skills", []),
            "experiences": info.get("experiences", []),
            "education": info.get("education", []),
            "extracted_at": timezone.now(),
        },
    )

    if cv_text and job_desc:
        similarity = compute_similarity_score(cv_text, job_desc)
    else:
        similarity = 0.0

    final = _compute_final_score(similarity)
    recommendation = _build_recommendation(final, info.get("skills", []))

    ApplicationScore.objects.update_or_create(
        application=app,
        defaults={
            "similarity_score": similarity,
            "final_score": final,
            "recommendation": recommendation,
            "model_version": model_version,
        },
    )

    app.final_score = final
    app.save(update_fields=["final_score"])

    return app


def analyze_job(job_id: int, model_version: str = "minilm-finetuned-v1"):
    job = JobPosting.objects.get(id=job_id)
    apps = Application.objects.filter(job=job)

    results = []
    for app in apps:
        updated = analyze_application(app.id, model_version=model_version)
        results.append(updated.id)
    return job, results
