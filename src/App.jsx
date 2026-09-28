import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { ProtectedRoute } from './components/ProtectedRoute';

import AppLayout from './layouts/AppLayout';
import PlatformLayout from './layouts/PlatformLayout';

import LoginPage from './pages/LoginPage';
import PlatformLoginPage from './pages/PlatformLoginPage';
import PlatformDashboard from './pages/PlatformDashboard';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import PurchasesPage from './pages/PurchasesPage';
import FinancePage from './pages/FinancePage';
import ReportsPage from './pages/ReportsPage';
import AlertsPage from './pages/AlertsPage';
import DataPage from './pages/DataPage';
import UsersPage from './pages/UsersPage';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/platform/login" element={<PlatformLoginPage />} />

            {/* Tenant application */}
            <Route
              path="/"
              element={
                <ProtectedRoute requiredType="tenant">
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="purchases" element={<PurchasesPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="data" element={<DataPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Platform administration */}
            <Route
              path="/platform"
              element={
                <ProtectedRoute requiredType="platform">
                  <PlatformLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PlatformDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}