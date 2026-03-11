import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/SafeFirebaseContext';
import { MainLayout } from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { PcrPage } from './pages/PcrPage';
import { PccPage } from './pages/PccPage';
import { PrintPage } from './pages/PrintPage';
import { HelpPage } from './pages/HelpPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <DataProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/pending"
                element={
                  <ProtectedRoute requireApproved={false}>
                    <PendingApprovalPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <Navigate to="/dashboard" replace />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <DashboardPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <ProjectsPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pcr"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PcrPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pcc"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PccPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/print"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <PrintPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/help"
                element={
                  <ProtectedRoute>
                    <MainLayout>
                      <HelpPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireRoles={['MasterAdmin', 'ppeAdmin']}>
                    <MainLayout>
                      <AdminPanelPage />
                    </MainLayout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </DataProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
