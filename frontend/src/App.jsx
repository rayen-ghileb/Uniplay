import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./router/ProtectedRoute.jsx";
import { AdminRoute } from "./router/AdminRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import SportPage from "./pages/SportPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ReservationsPage from "./pages/ReservationsPage.jsx";
import Navbar from "./components/Navbar.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ParametresLayout from "./components/ParametersLayout.jsx";
import EditProfilePage from "./pages/parametres/EditProfilePage.jsx";
import ChangePasswordPage from "./pages/parametres/ChangePasswordPage.jsx";
import ReclamationsPage from "./pages/parametres/ReclamationsPage.jsx";
import AdminReclamations from "./pages/admin/AdminReclamations.jsx";
import AdminPlanning from "./pages/admin/AdminPlanning.jsx";
import MyGamesPage from "./pages/MyGamesPage.jsx";
import GamesListPage from "./pages/GamesListPage.jsx";
import GameLobby from "./pages/GameLobby.jsx";
import AdminGroups from "./pages/admin/AdminGroups.jsx";

// Admin Imports
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminTerrains from "./pages/admin/AdminTerrains.jsx";
import AdminReservations from "./pages/admin/AdminReservations.jsx";
import AdminSports from "./pages/admin/AdminSports.jsx";
import AdminUsers from "./pages/admin/AdminUsers.jsx";
import AdminStudents from "./pages/admin/AdminStudents.jsx";  // add this
import Toast from "./components/Toast.jsx";

// Layout wrapper that renders Navbar and wraps protected content for students
function AppLayout({ children }) {
  const [loginWarning, setLoginWarning] = useState(() => sessionStorage.getItem("login_warning") || "");

  useEffect(() => {
    if (loginWarning) sessionStorage.removeItem("login_warning");
  }, [loginWarning]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-fog">
        <Navbar />
        <main>{children}</main>
        <Toast
          type="error"
          message={loginWarning}
          onClose={() => setLoginWarning("")}
        />
      </div>
    </ProtectedRoute>
  );
}

// Layout wrapper for Admin Panel routes
function AdminAppLayout({ children }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  );
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes (Navbar will stay permanently visible here) */}
      <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
      <Route path="/sports/:sportId" element={<AppLayout><SportPage /></AppLayout>} />
      <Route path="/reservations" element={<AppLayout><ReservationsPage /></AppLayout>} />
      <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
      <Route path="/parametres" element={<Navigate to="/parametres/profil" replace />} />
      <Route path="/parametres/profil" element={<AppLayout><ParametresLayout><EditProfilePage /></ParametresLayout></AppLayout>} />
      <Route path="/parametres/mot-de-passe" element={<AppLayout><ParametresLayout><ChangePasswordPage /></ParametresLayout></AppLayout>} />
      <Route path="/parametres/reclamations" element={<AppLayout><ParametresLayout><ReclamationsPage /></ParametresLayout></AppLayout>} />
      <Route path="/mes-jeux" element={<AppLayout><MyGamesPage /></AppLayout>} />
      <Route path="/jeux" element={<AppLayout><GamesListPage /></AppLayout>} />
      <Route path="/games/:gameId" element={<AppLayout><GameLobby /></AppLayout>} />

      {/* --- PHASE 4: ADMIN ROUTES --- */}
      <Route path="/admin" element={<AdminAppLayout><AdminDashboard /></AdminAppLayout>} />
      <Route path="/admin/users" element={<AdminAppLayout><AdminUsers /></AdminAppLayout>} />
      <Route path="/admin/students" element={<AdminAppLayout><AdminStudents /></AdminAppLayout>} />
      <Route path="/admin/sports" element={<AdminAppLayout><AdminSports /></AdminAppLayout>} />
      <Route path="/admin/terrains" element={<AdminAppLayout><AdminTerrains /></AdminAppLayout>} />
      <Route path="/admin/reservations" element={<AdminAppLayout><AdminReservations /></AdminAppLayout>} />
      <Route path="/admin/reclamations" element={<AdminAppLayout><AdminReclamations /></AdminAppLayout>} />
      <Route path="/admin/planning" element={<AdminAppLayout><AdminPlanning /></AdminAppLayout>} />
      <Route path="/admin/groups" element={<AdminAppLayout><AdminGroups /></AdminAppLayout>} />
    </Routes>
  );
}

export default App;