import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    email: "",
    city: "",
    preferred_techs: "",
    company_name: "",
    company_sector: "",
    company_size: "",
    company_logo_url: "",
    hiring_needs: "",
    tech_stack: "",
    remote_policy: "",
  });
  const [defaultCvFile, setDefaultCvFile] = useState(null);
  const [defaultCvUrl, setDefaultCvUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get("accounts/profile/");
      const data = res.data;
    setForm({
      email: data.email || "",
      city: data.city || "",
      preferred_techs: data.preferred_techs || "",
      company_name: data.company_name || "",
      company_sector: data.company_sector || "",
      company_size: data.company_size || "",
      company_logo_url: data.company_logo_url || "",
      hiring_needs: data.hiring_needs || "",
      tech_stack: data.tech_stack || "",
      remote_policy: data.remote_policy || "",
    });
    if (data.default_cv) {
      setDefaultCvUrl(data.default_cv);
    }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        formData.append(k, v ?? "");
      });
      if (defaultCvFile) {
        formData.append("default_cv", defaultCvFile);
      }

      const res = await api.put("accounts/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("Profil mis à jour avec succès.");
      if (res.data.default_cv) {
        setDefaultCvUrl(res.data.default_cv);
      }
      // mettre à jour le contexte user au moins pour l'email
      if (user) {
        setUser({ ...user, email: res.data.email });
      }
    } catch (err) {
      setMsg("Erreur lors de la mise à jour du profil.");
    } finally {
      setLoading(false);
    }
  };

  const isCandidate = user?.role === "candidate";
  const isRecruiter = user?.role === "recruiter";

  return (
    <div className="card centered-card">
      {loading && (
        <>
          <div className="skeleton text h-18 w-40"></div>
          <div className="skeleton text mt-8 h-14 w-70"></div>
        </>
      )}
      <h2>Mon profil</h2>
      <p className="muted-sub">Utilisateur : <strong>{user?.username}</strong> · Rôle : <strong>{user?.role}</strong></p>

      {msg && <p className="mt-8 ui-success">{msg}</p>}

      <form onSubmit={handleSubmit} className="mt-12">
        <div className="mb-8">
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} />
        </div>

        {isCandidate && (
          <>
            <h3 className="section-title">Profil candidat</h3>
            <div className="mb-8">
              <label>Ville</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} />
            </div>
            <div className="mb-8">
              <label>Technos préférées (texte libre)</label>
              <input type="text" name="preferred_techs" value={form.preferred_techs} onChange={handleChange} />
            </div>
            <div className="mb-8">
              <label>CV par défaut (PDF)</label>
              <input type="file" accept="application/pdf" onChange={(e) => setDefaultCvFile(e.target.files[0] || null)} />
              {defaultCvUrl && (
                <p className="mt-6">CV actuel : <a href={defaultCvUrl} target="_blank" rel="noreferrer">ouvrir</a></p>
              )}
            </div>
          </>
        )}

        {isRecruiter && (
          <>
            <h3 className="section-title">Profil recruteur / entreprise</h3>
            <div className="mb-8">
              <label>Nom de l’entreprise</label>
              <input type="text" name="company_name" value={form.company_name} onChange={handleChange} />
            </div>
            <div className="mb-8">
              <label>Secteur</label>
              <input type="text" name="company_sector" value={form.company_sector} onChange={handleChange} />
            </div>
            <div className="mb-8">
              <label>Taille (ex : 1-10, 11-50…)</label>
              <input type="text" name="company_size" value={form.company_size} onChange={handleChange} />
            </div>
            <div className="mb-8">
              <label>Logo (URL)</label>
              <input type="text" name="company_logo_url" value={form.company_logo_url} onChange={handleChange} />
            </div>
            <div className="mb-8">
              <label>Besoins / postes recherchés</label>
              <textarea name="hiring_needs" rows={3} value={form.hiring_needs} onChange={handleChange} />
            </div>
            <div className="mb-8">
              <label>Stack technique</label>
              <textarea name="tech_stack" rows={3} value={form.tech_stack} onChange={handleChange} />
            </div>
            <div className="mb-8">
              <label>Politique remote (ex : full remote, 2j/sem…)</label>
              <input type="text" name="remote_policy" value={form.remote_policy} onChange={handleChange} />
            </div>
          </>
        )}

        <div className="mt-12">
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Sauvegarde…' : 'Enregistrer'}</button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
