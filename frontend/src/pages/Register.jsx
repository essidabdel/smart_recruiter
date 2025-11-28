import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { UserIcon, MailIcon, LockIcon } from "../components/icons";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "candidate",
  });
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

   const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      console.error(err.response?.data); // pour voir le détail
      setError("Erreur lors de l'inscription");
    }
  };

  return (
    <div className="auth-card">
      <h2>Inscription</h2>
      <p className="auth-subtitle">Créez un compte pour postuler ou publier des offres.</p>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Nom d'utilisateur</label>
          <UserIcon className="input-icon" aria-hidden />
          <input className={error ? 'input-error' : ''} name="username" value={form.username} onChange={handleChange} placeholder="ex: jean.dupont" aria-label="Nom d'utilisateur" />
        </div>

        <div className="input-group">
          <label>Email</label>
          <MailIcon className="input-icon" aria-hidden />
          <input className={error ? 'input-error' : ''} name="email" value={form.email} onChange={handleChange} placeholder="ex: vous@exemple.com" aria-label="Email" />
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
            placeholder="Choisissez un mot de passe"
            aria-label="Mot de passe"
          />
        </div>

        <div className="select-group">
          <label>Rôle</label>
          <select name="role" value={form.role} onChange={handleChange} aria-label="Rôle">
            <option value="candidate">Candidat</option>
            <option value="recruiter">Recruteur</option>
          </select>
        </div>

        <div className="auth-actions">
          <button type="submit" className="btn btn-primary">Créer un compte</button>
        </div>

        <div className="auth-actions auth-actions-center">
          <a href="/login">Déjà un compte ? Se connecter</a>
        </div>
      </form>
    </div>
  );
};

export default Register;
