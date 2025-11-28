// src/pages/JobDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { mapStatus } from "../utils/format";

const JobDetail = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadJob = async () => {
    setLoading(true);
    try {
      const res = await api.get(`jobs/${id}/`);
      setJob(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
  }, [id]);

  if (loading) return (
    <div className="card">
      <div className="skeleton text h-18 w-50"></div>
      <div className="skeleton text mt-8 h-14 w-80"></div>
    </div>
  );
  if (!job) return <div className="empty-state">Offre introuvable.</div>;

  return (
    <div className="card">
      <h2>{job.title}</h2>
        <p><strong>Statut :</strong> {mapStatus(job.status)}</p>
      <p>{job.description}</p>

      <div className="mt-16 actions">
        <button className="btn btn-primary" onClick={() => navigate(`/jobs/${job.id}/apply`)}>Postuler</button>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Retour</button>
      </div>
    </div>
  );
  };

  export default JobDetail;
