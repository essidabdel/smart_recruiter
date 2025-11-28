import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { formatScore, mapStatus } from "../utils/format";
import { MagnifierIcon, RefreshIcon } from "../components/icons";

const STATUS_OPTIONS = [
  { value: "received", label: "Reçue" },
  { value: "in_review", label: "En cours" },
  { value: "shortlisted", label: "Présélectionné" },
  { value: "rejected", label: "Refusée" },
  { value: "hired", label: "Embauché" },
];

const DashboardRecruiter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [topCandidates, setTopCandidates] = useState([]);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [uiMessage, setUiMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("final_score"); // final_score | status | candidate
  const [sortDir, setSortDir] = useState("desc"); // asc | desc

  const loadJobs = async () => {
    const res = await api.get("jobs/");
    setJobs(res.data);
  };

  const loadGlobalStats = async () => {
    const res = await api.get("applications/stats/");
    setGlobalStats(res.data);
  };

  const loadApplications = async (jobId) => {
    setLoading(true);
    setUiMessage("");
    try {
      const [appsRes, topRes] = await Promise.all([
        api.get(`applications/?job=${jobId}`),
        api.get(`jobs/${jobId}/top_candidates/`),
      ]);

      setApplications(appsRes.data);
      setTopCandidates(topRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    loadApplications(job.id);
  };

  const analyzeOne = async (applicationId) => {
    if (!selectedJob) return;
    setLoading(true);
    setUiMessage("");
    try {
      await api.post(`applications/${applicationId}/analyze/`);
      await loadApplications(selectedJob.id);
      setUiMessage("Analyse IA terminée pour cette candidature.");
    } catch {
      setUiMessage("Erreur lors de l’analyse IA.");
    } finally {
      setLoading(false);
    }
  };

  const analyzeAll = async () => {
    if (!selectedJob) return;
    setLoading(true);
    setUiMessage("");
    try {
      await api.post(`jobs/${selectedJob.id}/analyze_all/`);
      await loadApplications(selectedJob.id);
      setUiMessage("Analyse IA relancée pour toutes les candidatures.");
    } catch {
      setUiMessage("Erreur lors de l’analyse IA globale.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (applicationId, newStatus) => {
    if (!selectedJob) return;
    setLoading(true);
    setUiMessage("");
    try {
      await api.patch(`applications/${applicationId}/`, { status: newStatus });
      await loadApplications(selectedJob.id);
      setUiMessage(
        "Statut mis à jour, un email a été envoyé au candidat."
      );
    } catch {
      setUiMessage("Erreur lors de la mise à jour du statut.");
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setUiMessage("");
    try {
      await api.post("jobs/", {
        title: newTitle,
        description: newDescription,
      });
      setNewTitle("");
      setNewDescription("");
      await loadJobs();
      await loadGlobalStats();
      setUiMessage("Offre créée avec succès.");
    } catch {
      setUiMessage("Erreur lors de la création de l’offre.");
    }
  };

  useEffect(() => {
    loadJobs();
    loadGlobalStats();
  }, []);

  // filtrage + tri des candidatures
  const processedApplications = [...applications]
    .filter((app) =>
      statusFilter === "all" ? true : app.status === statusFilter
    )
    .sort((a, b) => {
      let av;
      let bv;

      if (sortBy === "final_score") {
        av = a.final_score ?? -9999;
        bv = b.final_score ?? -9999;
      } else if (sortBy === "status") {
        av = a.status || "";
        bv = b.status || "";
      } else if (sortBy === "candidate") {
        av = a.candidate_username || "";
        bv = b.candidate_username || "";
      } else {
        return 0;
      }

      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }

      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="page">
      <header className="page-header">
        <h2>Tableau de bord — Recruteur</h2>
        <p className="centered">Bonjour {user?.username}</p>
      </header>

      {uiMessage && (
        <p role="status" aria-live="polite" className="ui-message ui-success">
          {uiMessage}
        </p>
      )}

      <section className="card">
        <div className="stats">
          <div className="stat-card">
            <div className="stat-title">Candidatures (global)</div>
            <div className="stat-value">{globalStats?.total_applications ?? 0}</div>
            <div className="stat-title mt-6">
              Score moyen
            </div>
            <div className="stat-value">{formatScore(globalStats?.average_score)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-title">Répartition par statut</div>
            <div>
              {globalStats?.by_status?.map((s) => (
                <div key={s.status} className="mb-6">
                  <span className={`status-badge status-${s.status}`}>{mapStatus(s.status)}</span>
                  <span className="ml-8">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-title">Mes offres</div>
            <div className="stat-value">{jobs.length}</div>
            <div className="stat-title mt-6">
              Créer / gérer
            </div>
          </div>
        </div>
      </section>

      <div className="two-column flex-row">
        <aside className="side-col flex-left">
          <div className="card">
            <h3>Créer une nouvelle offre</h3>
            <form onSubmit={createJob} className="mt-8">
              <div className="mb-8">
                <label>Titre</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </div>

              <div className="mb-8">
                <label>Description</label>
                <textarea rows={4} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
              </div>

              <div>
                <button type="submit" className="btn btn-primary">
                  Créer l’offre
                </button>
              </div>
            </form>
          </div>

          <div className="card mt-12">
            <h3>Mes offres</h3>
            <ul className="job-list">
              {jobs.map((job) => (
                <li key={job.id} className={`job-item ${selectedJob?.id === job.id ? "selected" : ""}`}>
                  <div className="job-main">
                    <div className="job-title">{job.title}</div>
                    <div className="job-desc">{job.description ? job.description.replace(/\s+/g, ' ').trim().slice(0, 140) : ''}</div>
                    <div className="job-tags">
                      {/* optional tags could be extracted from job.description or metadata */}
                      {job.location && <span className="job-tag">{job.location}</span>}
                      {job.contract_type && <span className="job-tag">{job.contract_type}</span>}
                      {job.remote ? <span className="job-tag">Télétravail</span> : null}
                    </div>
                  </div>

                  <div className="job-actions">
                    <button className="btn btn-outline" onClick={() => handleSelectJob(job)}>Voir</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-2 flex-fill">
          {selectedJob ? (
            <div>
              <div className="card">
                <div className="card-header">
                  <div>
                    <h3 className="card-title">{selectedJob.title}</h3>
                    <div className="muted-sub">{selectedJob.description}</div>
                  </div>
                  <div className="actions">
                    <button className="btn btn-secondary" onClick={analyzeAll} disabled={loading}>
                      <RefreshIcon className="icon" aria-hidden />
                      <span className="ml-6">Analyser toutes</span>
                    </button>
                    <button className="btn btn-outline" onClick={() => loadApplications(selectedJob.id)} disabled={loading}>
                      Rafraîchir
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="controls-row">
                  <div>
                    <label>Filtrer statut</label>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">Tous</option>
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>Trier par</label>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      <option value="final_score">Score IA</option>
                      <option value="status">Statut</option>
                      <option value="candidate">Candidat</option>
                    </select>
                  </div>

                  <div>
                    <label>Ordre</label>
                    <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                      <option value="desc">Desc</option>
                      <option value="asc">Asc</option>
                    </select>
                  </div>

                  <div className="ml-auto">
                    <input type="text" placeholder="Rechercher un candidat" onChange={(e) => {/* optional search hook */}} />
                  </div>
                </div>
              </div>

              <div className="card">
                <table className="table" role="table" aria-label="Liste des candidatures">
                  <thead>
                    <tr>
                      <th>Candidat</th>
                      <th>Score IA</th>
                      <th>Recommandation IA</th>
                      <th>Statut</th>
                      <th>CV</th>
                      <th>Analyser</th>
                      <th>Détails</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <>
                          <tr><td colSpan={7}><div className="skeleton text h-16 w-40"></div></td></tr>
                          <tr><td colSpan={7}><div className="skeleton text h-14 w-60"></div></td></tr>
                      </>
                    ) : (
                      processedApplications.map((app) => (
                      <tr key={app.id}>
                        <td>
                          <div className="col-vertical">
                            <strong>{app.candidate_username}</strong>
                            <span className="muted-sub">{app.candidate_title || ""}</span>
                          </div>
                        </td>
                        <td>{formatScore(app.final_score)}</td>
                        <td className="reco">{app.scores && app.scores.recommendation ? app.scores.recommendation : "—"}</td>
                        <td>
                          <div>
                            <span className={`status-badge status-${app.status}`}>{mapStatus(app.status)}</span>
                            <div className="mt-6">
                              <select value={app.status} onChange={(e) => updateStatus(app.id, e.target.value)} disabled={loading}>
                                {STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </td>
                        <td>
                          {app.cv_file ? (
                            <button className="btn btn-outline" onClick={() => window.open(app.cv_file, "_blank", "noopener")}>Voir CV</button>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <div className="actions">
                            <button className="btn btn-secondary" onClick={() => analyzeOne(app.id)} disabled={loading} title="Analyser cette candidature">
                              <MagnifierIcon className="icon" aria-hidden />
                              <span className="ml-6">Analyser</span>
                            </button>
                          </div>
                        </td>
                        <td>
                          <button className="btn btn-outline" onClick={() => navigate(`/applications/${app.id}`)}>Voir détails</button>
                        </td>
                      </tr>
                    ))) }

                    {!loading && processedApplications.length === 0 && (
                      <tr>
                        <td colSpan={7}><div className="empty-state">Aucune candidature pour ce poste.</div></td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="mt-16">
                  <h4>Top candidats (IA)</h4>
                  {topCandidates.length > 0 ? (
                    (() => {
                      const displayed = (topCandidates || []).filter((c) => c && c.status !== "rejected").slice().sort((a, b) => (b.final_score ?? 0) - (a.final_score ?? 0));
                      if (displayed.length === 0) return <p>Aucun candidat éligible (les candidats refusés sont masqués).</p>;

                      const maxShown = Math.min(displayed.length, 8);
                      const leaderboard = displayed.slice(0, maxShown);

                      return (
                        <div className="leaderboard" role="list" aria-label="Classement des candidats IA">
                          {leaderboard.map((c, idx) => (
                            <div key={c.application_id} className={`leaderboard-item rank-${idx + 1}`} role="listitem">
                              <div className={`rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                              <div className="lb-avatar">{(c.candidate_username || "?").slice(0, 1).toUpperCase()}</div>
                              <div className="lb-meta">
                                <div className="lb-name">{c.candidate_username}</div>
                                <div className="lb-sub">{c.candidate_title || ""}</div>
                              </div>
                              <div className="lb-score">{formatScore(c.final_score)}</div>
                              <div className="lb-actions">
                                <button className="btn btn-outline" onClick={() => navigate(`/applications/${c.application_id}`)}>Voir</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  ) : (
                    <p>Aucun candidat scoré pour ce poste.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p>Sélectionnez une offre pour voir les candidatures correspondantes.</p>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardRecruiter;
