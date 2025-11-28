import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserIcon, LockIcon } from "../components/icons";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError("Identifiants invalides");
    }
  };

  return (
    <div className="auth-card">
      <h2>Connexion</h2>
      <p className="auth-subtitle">Connectez-vous pour accéder à votre tableau de bord.</p>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Nom d'utilisateur</label>
          <UserIcon className="input-icon" aria-hidden />
          <input className={error ? 'input-error' : ''} name="username" value={form.username} onChange={handleChange} placeholder="ex: jean.dupont" aria-label="Nom d'utilisateur" />
        </div>

        <div className="input-group">
          <label>Mot de passe</label>
          <LockIcon className="input-icon" aria-hidden />
          <input
            className={error ? 'input-error' : ''}
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Votre mot de passe"
            aria-label="Mot de passe"
          />
        </div>

        <div className="auth-actions auth-actions-between">
          <div className="auth-left">
            <label><input type="checkbox" /> Se souvenir de moi</label>
            <a href="/forgot-password">Mot de passe oublié ?</a>
          </div>
          <div>
            <button type="submit" className="btn btn-primary">Se connecter</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Login;
