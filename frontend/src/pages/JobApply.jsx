// src/pages/JobApply.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const JobApply = () => {
  const { id } = useParams(); // job id
  const [job, setJob] = useState(null);
  const [cvFile, setCvFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const loadJob = async () => {
    const res = await api.get(`jobs/${id}/`);
    setJob(res.data);
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      setMessage("Merci de joindre votre CV (PDF).");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("job", id);
      formData.append("cv_file", cvFile);
      if (coverFile) {
        formData.append("cover_letter_file", coverFile);
      }

      await api.post("applications/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(
        "Candidature envoyée avec succès ✅ Un email de confirmation vous a été envoyé."
      );
      setCvFile(null);
      setCoverFile(null);
    } catch (err) {
      setMessage("Erreur lors de l’envoi de la candidature.");
    } finally {
      setLoading(false);
    }
  };

  if (!job) return <p>Chargement de l’offre…</p>;

  return (
    <div className="card centered-card">
      <h2>Postuler pour : {job.title}</h2>
      <p className="muted-sub mt-4">{job.description}</p>

      <form onSubmit={handleSubmit} className="mt-12">
        <div className="mb-8">
          <label>CV (PDF, max 5 Mo)</label>
          <input type="file" accept="application/pdf" onChange={(e) => setCvFile(e.target.files[0] || null)} />
        </div>

        <div className="mb-8">
          <label>Lettre de motivation (PDF facultatif)</label>
          <input type="file" accept="application/pdf" onChange={(e) => setCoverFile(e.target.files[0] || null)} />
        </div>
        <div className="mt-12">
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Envoi…' : 'Envoyer ma candidature'}</button>
          <button className="btn btn-outline ml-8" type="button" onClick={() => navigate(-1)}>Annuler</button>
        </div>
      </form>

      {message && <div className={message.includes('✅') ? 'ui-success mt-12' : 'form-error mt-12'}>{message}</div>}
    </div>
  );
};

export default JobApply;
