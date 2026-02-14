import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import MembrosPage from "./pages/MembrosPage";
import ReunioesPage from "./pages/ReunioesPage";
import EventosPage from "./pages/EventosPage";
import { FinancasPage } from "./pages/PlaceholderPages";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* rota pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* protege rotas, todas vão p login */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/membros"
            element={
              <ProtectedRoute>
                <MembrosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reunioes"
            element={
              <ProtectedRoute>
                <ReunioesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/eventos"
            element={
              <ProtectedRoute>
                <EventosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/financas"
            element={
              <ProtectedRoute>
                <FinancasPage />
              </ProtectedRoute>
            }
          />

          {/* mais um redirecionamento p login */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}