import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./router/ProtectedRoute.jsx";
import { AdminRoute } from "./router/AdminRoute.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import SportPage from "./pages/SportPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import ReservationsPage from "./pages/ReservationsPage.jsx";
import Navbar from "./components/Navbar.jsx";

// Admin Imports
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminTerrains from "./pages/admin/AdminTerrains.jsx";
import AdminReservations from "./pages/admin/AdminReservations.jsx";

// Layout wrapper that renders Navbar and wraps protected content for students
function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-fog">
        <Navbar />
        <main>{children}</main>
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes (Navbar will stay permanently visible here) */}
      <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
      <Route path="/sports/:sportId" element={<AppLayout><SportPage /></AppLayout>} />
      <Route path="/reservations" element={<AppLayout><ReservationsPage /></AppLayout>} />

      {/* --- PHASE 4: ADMIN ROUTES --- */}
      <Route path="/admin" element={<AdminAppLayout><AdminDashboard /></AdminAppLayout>} />
      <Route path="/admin/terrains" element={<AdminAppLayout><AdminTerrains /></AdminAppLayout>} />
      <Route path="/admin/reservations" element={<AdminAppLayout><AdminReservations /></AdminAppLayout>} />
    </Routes>
  );
}

export default App;