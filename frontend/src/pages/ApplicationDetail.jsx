// src/pages/ApplicationDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { formatScore, mapStatus } from "../utils/format";

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const loadApplication = async () => {
    setLoading(true);
    try {
      const res = await api.get(`applications/${id}/`);
      setApp(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplication();
  }, [id]);

  if (loading) return (
    <div className="card">
      <div className="skeleton text h-18 w-50"></div>
      <div className="skeleton text mt-8 h-14 w-80"></div>
    </div>
  );

  if (!app) return <div className="empty-state">Candidature introuvable.</div>;

  const scores = app.scores;
  const parsed = app.parsed_resume;

  const truncate = (text, max = 260) => {
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, max).trimEnd() + "...";
  };

  const cleanText = (s) => {
    if (!s) return s;
    // remove spaced dots like " . . . " and collapse multiple spaces
    let t = String(s).replace(/\s+\.\s+/g, ' ');
    // collapse multiple punctuation and spaces
    t = t.replace(/\.{2,}/g, '...');
    // replace multiple whitespace with single space
    t = t.replace(/\s{2,}/g, ' ');
    // trim and remove stray spaces before commas/periods
    t = t.replace(/\s+,/g, ',').replace(/\s+\./g, '.').trim();
    return t;
  };

  return (
    <div className="card centered-card">
      <header className="card-header">
        <div className="detail-meta">
          <div className="left">
            <h2>Candidature — {app.candidate_username}</h2>
            <p className="mt-4 muted-sub">{app.job_title}</p>
          </div>
          <div className="right">
            <p>
              <span className="label-strong">Statut :</span>{" "}
              <span className={`status-badge status-${app.status}`}>{mapStatus(app.status)}</span>
            </p>
            <p className="mt-6">
              <span className="label-strong">Date :</span>{" "}
              {new Date(app.created_at).toLocaleString('fr-FR')}
            </p>
          </div>
        </div>
      </header>

      <section className="detail-section">
        <h3 className="section-title">Documents</h3>
        <ul className="doc-list">
          <li>
            <strong>CV :</strong>{" "}
            {app.cv_file ? (
              <a href={app.cv_file} target="_blank" rel="noreferrer">
                📄 Ouvrir le CV
              </a>
            ) : (
              "—"
            )}
          </li>
          <li>
            <strong>Lettre de motivation (fichier) :</strong>{" "}
            {app.cover_letter_file ? (
              <a href={app.cover_letter_file} target="_blank" rel="noreferrer">
                📄 Ouvrir
              </a>
            ) : (
              "—"
            )}
          </li>
          <li>
            <strong>Lettre de motivation (texte) :</strong> {app.cover_letter_text || "—"}
          </li>
        </ul>
      </section>

      <section className="detail-section">
        <h3 className="section-title">Scores IA</h3>
        {scores ? (
          <table className="table score-table">
            <tbody>
              <tr>
                <td>Score final</td>
                <td>{formatScore(scores?.final_score, 0)}</td>
              </tr>
              <tr>
                <td>Similarité</td>
                <td>{formatScore(scores?.similarity_score, 0)}</td>
              </tr>

              <tr>
                <td>Modèle</td>
                <td><span style={{color: 'var(--muted)', fontWeight: 500}}>{scores.model_version || "—"}</span></td>
              </tr>
              <tr>
                <td>Recommandation</td>
                <td><span style={{color: 'var(--text)', fontWeight: 500, fontSize: '14px'}}>{scores.recommendation || "—"}</span></td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>Aucun score IA disponible pour le moment.</p>
        )}
      </section>

      <section className="detail-section">
        <h3 className="section-title">CV analysé</h3>
        {parsed ? (
          <>
            <div>
              <span className="label-strong">Compétences :</span>
              {parsed.skills && parsed.skills.length > 0 ? (
                <div className="skills-display">
                  {parsed.skills.map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <span> —</span>
              )}
            </div>

            <div className="mt-12">
              <strong>Expériences :</strong>
              {parsed.experiences && parsed.experiences.length > 0 ? (
                <ul className="parsed-list">
                  {parsed.experiences.map((exp, idx) => (
                    <li key={idx}>
                      {truncate(
                        cleanText(typeof exp === "string" ? exp : JSON.stringify(exp))
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>—</p>
              )}
            </div>

            <div className="mt-12">
              <strong>Formation :</strong>
              {parsed.education && parsed.education.length > 0 ? (
                <ul className="parsed-list">
                  {parsed.education.map((edu, idx) => (
                    <li key={idx}>
                      {truncate(
                        cleanText(typeof edu === "string" ? edu : JSON.stringify(edu))
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>—</p>
              )}
            </div>

            <div className="mt-8">
              <div className="detail-actions">
                <strong>Texte brut du CV</strong>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowRaw((s) => !s)}
                >
                  {showRaw ? "Masquer" : "Afficher"}
                </button>
              </div>
              {showRaw && (
                <div className="raw-cv">
                  {cleanText(parsed.raw_text) || "Aucun texte extrait."}
                </div>
              )}
            </div>
          </>
        ) : (
          <p>Le CV n’a pas encore été parsé par l’IA.</p>
        )}
      </section>

      <div className="mt-12">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          Retour
        </button>
      </div>
    </div>
  );
};

export default ApplicationDetail;
