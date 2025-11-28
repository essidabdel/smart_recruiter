import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DashboardCandidate from "./pages/DashboardCandidate";
import DashboardRecruiter from "./pages/DashboardRecruiter";
import DashboardAdmin from "./pages/DashboardAdmin";
import JobDetail from "./pages/JobDetail";
import JobApply from "./pages/JobApply";
import ApplicationDetail from "./pages/ApplicationDetail";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import "./App.css";

const Home = () => {
  const { user } = useAuth();
  if (user?.role === "candidate") return <Navigate to="/dashboard-candidate" />;
  if (user?.role === "recruiter") return <Navigate to="/dashboard-recruiter" />;
  if (user?.role === "admin") return <Navigate to="/dashboard-admin" />;
  return <div>Bienvenue sur l’app RH IA</div>;
};

const App = () => {
  return (
    <div className="app-frame">
      <Navbar />
      <main className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route
            path="/dashboard-candidate"
            element={
              <ProtectedRoute roles={["candidate"]}>
                <DashboardCandidate />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard-recruiter"
            element={
              <ProtectedRoute roles={["recruiter", "admin"]}>
                <DashboardRecruiter />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard-admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <DashboardAdmin />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs/:id"
            element={
              <ProtectedRoute roles={["candidate", "recruiter", "admin"]}>
                <JobDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jobs/:id/apply"
            element={
              <ProtectedRoute roles={["candidate"]}>
                <JobApply />
              </ProtectedRoute>
            }
          />

          <Route
            path="/applications/:id"
            element={
              <ProtectedRoute roles={["recruiter", "admin"]}>
                <ApplicationDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute roles={["candidate", "recruiter", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default App;
