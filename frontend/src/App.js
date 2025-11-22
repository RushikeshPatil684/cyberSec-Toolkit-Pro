import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { HelmetProvider } from 'react-helmet-async';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/Layout';
import Loader from './components/Loader';
import ProtectedRoute from './components/ProtectedRoute';
import { ReportProvider } from './contexts/ReportContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import GlobalLoadingOverlay from './components/GlobalLoadingOverlay';
import ScrollToTopButton from './components/ScrollToTopButton';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

// Lazy load heavy pages
const Tools = lazy(() => import('./pages/Tools'));
const Reports = lazy(() => import('./pages/Reports'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Profile = lazy(() => import('./pages/Profile'));
const Debug = lazy(() => import('./pages/Debug'));
const PasswordChecker = lazy(() => import('./pages/tools/PasswordChecker'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const IPInfo = lazy(() => import('./pages/tools/IPInfo'));
const Whois = lazy(() => import('./pages/tools/WHOIS'));
const SSL = lazy(() => import('./pages/tools/SSL'));
const SslCheck = lazy(() => import('./pages/tools/SslCheck'));
const HashTool = lazy(() => import('./pages/tools/Hash'));
const Subdomain = lazy(() => import('./pages/tools/Subdomain'));
const DNS = lazy(() => import('./pages/tools/DNS'));
const CVE = lazy(() => import('./pages/tools/CVE'));
const Headers = lazy(() => import('./pages/tools/Headers'));
const Breach = lazy(() => import('./pages/tools/Breach'));
const Risk = lazy(() => import('./pages/tools/Risk'));

function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Layout>{children}</Layout>
    </div>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-[#05060f] text-[#E2E8F0] relative">
      <GlobalLoadingOverlay />
      <Routes>
        {/* Public routes with Navbar but no Sidebar */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/about"
          element={
            <PublicLayout>
              <Suspense fallback={<Loader size={32} />}>
                <About />
              </Suspense>
            </PublicLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <PublicLayout>
              <Suspense fallback={<Loader size={32} />}>
                <Contact />
              </Suspense>
            </PublicLayout>
          }
        />
        <Route
          path="/privacy"
          element={
            <PublicLayout>
              <Suspense fallback={<Loader size={32} />}>
                <Privacy />
              </Suspense>
            </PublicLayout>
          }
        />
        <Route
          path="/terms"
          element={
            <PublicLayout>
              <Suspense fallback={<Loader size={32} />}>
                <Terms />
              </Suspense>
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <PublicLayout>
              <Login />
            </PublicLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicLayout>
              <Signup />
            </PublicLayout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicLayout>
              <ForgotPassword />
            </PublicLayout>
          }
        />
        {/* Private routes with Layout (Navbar + Sidebar) */}
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Tools />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Reports />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Profile />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/ipinfo"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <IPInfo />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/whois"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Whois />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/ssl"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <SslCheck />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/hash"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <HashTool />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/subdomains"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Subdomain />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/email-breach"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Breach />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/password"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <PasswordChecker />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/dns"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <DNS />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/cve"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <CVE />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/headers"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Headers />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/breach"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Breach />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools/risk"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Risk />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/debug"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<Loader size={32} />}>
                  <Debug />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="*"
          element={
            <PublicLayout>
              <Suspense fallback={<Loader size={32} />}>
                <NotFound />
              </Suspense>
            </PublicLayout>
          }
        />
      </Routes>
      <ScrollToTopButton />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <ReportProvider>
            <AppContent />
          </ReportProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
