import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fog">
        <div className="text-steel text-sm font-bold uppercase tracking-wider">Chargement...</div>
      </div>
    );
  }

  // If not logged in, go to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but NOT an admin, kick them to the homepage
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}