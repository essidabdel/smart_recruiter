import { useState } from "react";
import api from "../api/axios";

const isValidEmail = (s) => /\S+@\S+\.\S+/.test(s);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!isValidEmail(email)) {
      setError("Veuillez fournir une adresse email valide.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("accounts/forgot-password/", { email });
      setStatus(res?.data?.message || "Si un compte existe, un email a été envoyé (simulé).");
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de la demande. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Mot de passe oublié</h2>
      <p className="auth-subtitle">Entrez votre email pour recevoir un lien de réinitialisation.</p>
      {status && <p className="ui-success mt-8">{status}</p>}
      {error && <p className="form-error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Adresse email</label>
          <input
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className={error ? "input-error" : ""}
          />
        </div>

        <div className="auth-actions auth-actions-center">
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Envoi…' : 'Demander la réinitialisation'}</button>
        </div>

        <div className="auth-actions auth-actions-center mt-8">
          <a href="/login">Retour à la connexion</a>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
