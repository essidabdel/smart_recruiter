import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid || !token) setError("Lien invalide ou incomplet.");
  }, [uid, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!password || password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("accounts/reset-password/", {
        uid,
        token,
        new_password: password,
      });
      setStatus(res?.data?.message || "Mot de passe réinitialisé.");
      // redirect to login after short delay
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Réinitialiser le mot de passe</h2>
      <p className="auth-subtitle">Choisissez un nouveau mot de passe sécurisé.</p>
      {status && <p className="ui-success mt-8">{status}</p>}
      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Nouveau mot de passe</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="input-group">
          <label>Confirmer le mot de passe</label>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>

        <div className="auth-actions auth-actions-center">
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Envoi…' : 'Définir le nouveau mot de passe'}</button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
