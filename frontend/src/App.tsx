import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CreditScoringPage } from './pages/CreditScoringPage';
import { RiskProfilerPage } from './pages/RiskProfilerPage';
import { InvestmentPlanPage } from './pages/InvestmentPlanPage';
import { FinancialTwinPage } from './pages/FinancialTwinPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SampleUsersPage } from './pages/SampleUsersPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { AdminLockScreen } from './components/AdminLockScreen';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated || !isAdmin) {
    return <AdminLockScreen />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="credit-score" element={<CreditScoringPage />} />
            <Route path="risk-profiler" element={<RiskProfilerPage />} />
            <Route path="investment-plan" element={<InvestmentPlanPage />} />
            <Route path="financial-twin" element={<ProtectedRoute><FinancialTwinPage /></ProtectedRoute>} />
            <Route path="admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="sample-users" element={<SampleUsersPage />} />
            <Route path="reports" element={<ProtectedRoute><ReportHistoryPage /></ProtectedRoute>} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
