// src/pages/DashboardCandidate.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { mapStatus, formatScore } from "../utils/format";
import { useNavigate } from "react-router-dom";

const DashboardCandidate = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [remoteFilter, setRemoteFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest

  const navigate = useNavigate();

  const loadJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await api.get("jobs/");
      setJobs(res.data);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadMyApplications = async () => {
    setLoadingApps(true);
    try {
      const res = await api.get("applications/");
      setMyApplications(res.data);
    } finally {
      setLoadingApps(false);
    }
  };

  const deleteApplication = async (applicationId) => {
    if (!window.confirm("Supprimer cette candidature ?")) return;
    setLoadingApps(true);
    try {
      await api.delete(`applications/${applicationId}/`);
      await loadMyApplications();
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadMyApplications();
  }, []);

  const processedJobs = [...jobs]
    .filter((job) => {
      const q = search.toLowerCase();
      if (q) {
        const hay = (job.title || "") + " " + (job.description || "") + " " + (job.recruiter_company_name || "");
        if (!hay.toLowerCase().includes(q)) return false;
      }

      if (statusFilter !== "all" && job.status !== statusFilter) return false;

      if (remoteFilter === "remote" && !job.remote) return false;
      if (remoteFilter === "onsite" && job.remote) return false;

      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.created_at);
      const db = new Date(b.created_at);
      if (sortBy === "newest") return db - da;
      if (sortBy === "oldest") return da - db;
      return 0;
    });

  return (
    <div className="page">
      <header className="page-header">
        <h2>Tableau de bord — Candidat</h2>
        <p className="centered">Bonjour {user?.username}</p>
      </header>

      <section className="card">
        <h3 className="section-title">Mes candidatures</h3>
        {loadingApps && (
          <div>
            <div className="skeleton text h-14 w-60"></div>
            <div className="skeleton text h-14 w-80"></div>
            <div className="skeleton text h-14 w-40"></div>
          </div>
        )}

        {!loadingApps && myApplications.length === 0 && (
          <div className="empty-state">Vous n’avez pas encore postulé à une offre.</div>
        )}

        {!loadingApps && myApplications.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Offre</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {myApplications.map((app) => (
                <tr key={app.id}>
                  <td>{app.job_title}</td>
                  <td><span className={`status-badge status-${app.status}`}>{mapStatus(app.status)}</span></td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-outline" onClick={() => navigate(`/jobs/${app.job}/`)}>Détails</button>
                      <button className="btn btn-secondary" onClick={() => deleteApplication(app.id)} disabled={loadingApps}>Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h3 className="section-title">Toutes les offres</h3>

        <div className="controls-row">
          <input type="text" placeholder="Rechercher (titre, entreprise, mots-clés)" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Tous statuts</option>
            <option value="open">Ouvert</option>
            <option value="closed">Fermé</option>
          </select>
          <select value={remoteFilter} onChange={(e) => setRemoteFilter(e.target.value)}>
            <option value="all">Remote / sur site</option>
            <option value="remote">Remote uniquement</option>
            <option value="onsite">Sur site uniquement</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
          </select>
        </div>

          {loadingJobs && (
          <div>
            <div className="skeleton text h-16 w-40"></div>
            <div className="skeleton text h-14 w-80"></div>
          </div>
        )}

        {!loadingJobs && processedJobs.length === 0 && (
          <div className="empty-state">Aucune offre ne correspond à votre recherche.</div>
        )}

        {!loadingJobs && processedJobs.map((job) => (
          <article key={job.id} className="card">
            <h4>{job.title}</h4>
            <p><strong>Entreprise :</strong> {job.recruiter_company_name || 'N/A'}</p>
            <p><strong>Statut :</strong> <span className={`status-badge status-${job.status}`}>{mapStatus(job.status)}</span> {job.remote ? '(Remote possible)' : ''}</p>
            <p>{job.description && job.description.length > 200 ? job.description.slice(0,200) + '…' : job.description}</p>
            <div className="actions">
              <button className="btn btn-outline" onClick={() => navigate(`/jobs/${job.id}`)}>Voir détails</button>
              <button className="btn btn-primary" onClick={() => navigate(`/jobs/${job.id}/apply`)}>Postuler</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default DashboardCandidate;
