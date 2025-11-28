import { useEffect, useState } from "react";
import api from "../api/axios";
import { formatScore, mapStatus } from "../utils/format";
import { useNavigate } from "react-router-dom";

const DashboardAdmin = () => {
  const [globalStats, setGlobalStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobStats, setJobStats] = useState(null);
  const [topCandidates, setTopCandidates] = useState([]);

  const [recruiters, setRecruiters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const loadGlobalStats = async () => {
    try {
      const res = await api.get("applications/stats/");
      setGlobalStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadJobs = async () => {
    const res = await api.get("jobs/");
    setJobs(res.data);
  };

  const selectJob = async (job) => {
    setSelectedJob(job);
    const statsRes = await api.get(`jobs/${job.id}/stats/`);
    setJobStats(statsRes.data);
    const topRes = await api.get(`jobs/${job.id}/top_candidates/`);
    setTopCandidates(topRes.data);
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const [recRes, candRes] = await Promise.all([
        api.get("accounts/users/?role=recruiter"),
        api.get("accounts/users/?role=candidate"),
      ]);
      setRecruiters(recRes.data);
      setCandidates(candRes.data);
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    setLoadingUsers(true);
    try {
      await api.delete(`accounts/users/${id}/`);
      await loadUsers();
    } finally {
      setLoadingUsers(false);
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette offre ?")) return;
    try {
      await api.delete(`jobs/${jobId}/`);
      await loadJobs();
      if (selectedJob && selectedJob.id === jobId) {
        setSelectedJob(null);
        setJobStats(null);
        setTopCandidates([]);
      }
    } catch (e) {
      console.error("Erreur lors de la suppression:", e);
      alert("Erreur lors de la suppression de l'offre");
    }
  };

  const deleteApplication = async (applicationId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette candidature ?")) return;
    try {
      await api.delete(`applications/${applicationId}/`);
      if (selectedJob) {
        await selectJob(selectedJob);
      }
    } catch (e) {
      console.error("Erreur lors de la suppression:", e);
      alert("Erreur lors de la suppression de la candidature");
    }
  };

  const editUserEmail = async (user) => {
    const newEmail = window.prompt("Nouveau mail :", user.email || "");
    if (!newEmail) return;
    setLoadingUsers(true);
    try {
      await api.patch(`accounts/users/${user.id}/`, { email: newEmail });
      await loadUsers();
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadGlobalStats();
    loadJobs();
    loadUsers();
  }, []);
  const navigate = useNavigate();

  return (
    <div className="page">
      <header className="page-header">
        <h2>Tableau de bord — Admin</h2>
      </header>

      <section className="card">
        <h3 className="section-title">Stats globales</h3>
        {globalStats ? (
          <div className="stats">
            <div className="stat-card">
              <div className="stat-title">Total candidatures</div>
              <div className="stat-value">{globalStats.total_applications}</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Score moyen</div>
              <div className="stat-value">{formatScore(globalStats.average_score)}</div>
            </div>

            <div className="stat-card">
              <div className="stat-title">Par statut</div>
              <div className="status-list">
                {globalStats.by_status.map((s) => (
                  <div key={s.status} className="status-row">
                    <span className={`status-badge status-${s.status}`}>{mapStatus(s.status)}</span>
                    <span className="status-count">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p>Chargement des stats…</p>
        )}
      </section>

      <section className="card">
        <h3 className="section-title">Offres et top candidats</h3>
        <div className="flex-row">
          <div className="side-col">
            <h4>Offres</h4>
            {jobs.length === 0 ? (
              <div className="empty-state">Aucune offre publiée.</div>
            ) : (
              <ul className="job-list">
                {jobs.map((job) => (
                  <li key={job.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => selectJob(job)}>{job.title} ({mapStatus(job.status)})</button>
                    <button className="btn btn-small btn-secondary" onClick={() => deleteJob(job.id)} title="Supprimer l'offre">🗑️</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex-fill">
                {selectedJob ? (
              <>
                <h4>Détails offre : {selectedJob.title}</h4>
                {jobStats && (
                  <div>
                    <p><strong>Total candidatures :</strong> {jobStats.total_applications}</p>
                    <p><strong>Score moyen :</strong> {formatScore(jobStats.average_score)}</p>
                  </div>
                )}

                <h5>Top candidats (IA)</h5>
                {topCandidates.length === 0 ? (
                  <div className="empty-state">Aucun candidat scoré.</div>
                ) : (
                  <div className="leaderboard">
                    {topCandidates
                      .filter((c) => c && c.status !== 'rejected')
                      .slice()
                      .sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0))
                      .slice(0, 8)
                      .map((c, idx) => (
                        <div key={c.application_id} className={`leaderboard-item rank-${idx + 1}`}>
                          <div className={`rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                          <div className="lb-avatar">{(c.candidate_username || '?').slice(0,1).toUpperCase()}</div>
                          <div className="lb-meta">
                            <div className="lb-name">{c.candidate_username}</div>
                            <div className="lb-sub">{c.candidate_title || ''}</div>
                          </div>
                          <div className="lb-score">{formatScore(c.final_score)}</div>
                          <div className="lb-actions">
                            <button className="btn btn-outline" onClick={() => navigate(`/applications/${c.application_id}`)}>Voir</button>
                            <button className="btn btn-small btn-secondary" onClick={() => deleteApplication(c.application_id)} title="Supprimer la candidature">🗑️</button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            ) : (
              <p>Sélectionnez une offre pour voir ses détails.</p>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h3 className="section-title">Gestion des utilisateurs</h3>
        {loadingUsers && (
          <div>
            <div className="skeleton text h-16 w-60"></div>
            <div className="skeleton text h-14 w-80"></div>
          </div>
        )}
        
        <div className="user-management-grid">
          <div className="user-table-section">
            <div className="section-header">
              <h4>Recruteurs</h4>
              <span className="count-badge">{recruiters.length}</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Actif</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiters.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.username}</strong></td>
                      <td className="email-cell">{u.email}</td>
                      <td>
                        <span className={u.is_active ? 'badge-success' : 'badge-muted'}>
                          {u.is_active ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-small btn-outline" onClick={() => editUserEmail(u)}>✏️</button>
                          <button className="btn btn-small btn-secondary" onClick={() => deleteUser(u.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {recruiters.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-state">Aucun recruteur.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="user-table-section">
            <div className="section-header">
              <h4>Candidats</h4>
              <span className="count-badge">{candidates.length}</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Actif</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.username}</strong></td>
                      <td className="email-cell">{u.email}</td>
                      <td>
                        <span className={u.is_active ? 'badge-success' : 'badge-muted'}>
                          {u.is_active ? '✓ Actif' : '✗ Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn btn-small btn-outline" onClick={() => editUserEmail(u)}>✏️</button>
                          <button className="btn btn-small btn-secondary" onClick={() => deleteUser(u.id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {candidates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty-state">Aucun candidat.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardAdmin;
