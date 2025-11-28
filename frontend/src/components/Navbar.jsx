import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/">Accueil</Link>
      {user?.role === "admin" && <Link to="/dashboard-admin">Admin</Link>}
      {user?.role === "candidate" && (
        <Link to="/dashboard-candidate">Candidat</Link>
      )}
      {user?.role === "recruiter" && (
        <Link to="/dashboard-recruiter">Recruteur</Link>
      )}

      <span className="nav-right">
        {!user && (
          <>
            <Link to="/login">Se connecter</Link>
            <Link to="/register">S'inscrire</Link>
          </>
        )}

        {user && (
          <>
            <Link to="/profile">Mon profil</Link>
            <span>({user.username} – {user.role})</span>
            <button className="btn btn-outline" onClick={logout}>Se déconnecter</button>
          </>
        )}
      </span>
    </nav>
  );
};

export default Navbar;
