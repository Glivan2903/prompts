import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { BaseLayout } from "@/components/BaseLayout";
import BuilderPage from "@/pages/BuilderPage";
import PromptsPage from "@/pages/PromptsPage";
import GuidePage from "@/pages/GuidePage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { useAuth } from "@/contexts/AuthContext";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      
      <Route
        path="/"
        element={
          <PrivateRoute>
            <BaseLayout>
              <DashboardPage />
            </BaseLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/builder"
        element={
          <PrivateRoute>
            <BaseLayout>
              <BuilderPage />
            </BaseLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/prompts"
        element={
          <PrivateRoute>
            <BaseLayout>
              <PromptsPage />
            </BaseLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/guide"
        element={
          <PrivateRoute>
            <BaseLayout>
              <GuidePage />
            </BaseLayout>
          </PrivateRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <BaseLayout>
              <SettingsPage />
            </BaseLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
