import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, homePathFor } from './context/AuthContext';
import './index.css';
import LandingPage from './pages/LandingPage';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const CompanyDashboard = lazy(() => import('./pages/CompanyDashboard'));
const InternshipSearch = lazy(() => import('./pages/InternshipSearch'));
const MyApplications = lazy(() => import('./pages/MyApplications'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const InterviewCenter = lazy(() => import('./pages/InterviewCenter'));
const StudentInsights = lazy(() => import('./pages/StudentInsights'));
const CompanyInsights = lazy(() => import('./pages/CompanyInsights'));
const InterviewReports = lazy(() => import('./pages/InterviewReports'));
const InterviewTimeline = lazy(() => import('./pages/InterviewTimeline'));
const StudentFeedbackPortal = lazy(() => import('./pages/StudentFeedbackPortal'));

const PageLoader = () => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'im-spin 0.8s linear infinite' }} />
    <style>{'@keyframes im-spin { to { transform: rotate(360deg); } }'}</style>
  </div>
);

const PrivateRoute = ({ element, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return element;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <LandingPage />;
  return <Navigate to={homePathFor(user.role)} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/student-dashboard" element={
            <PrivateRoute element={<StudentDashboard />} roles={['student']} />
          } />
          <Route path="/company-dashboard" element={
            <PrivateRoute element={<CompanyDashboard />} roles={['company']} />
          } />
          <Route path="/company-insights" element={
            <PrivateRoute element={<CompanyInsights />} roles={['company']} />
          } />
          <Route path="/admin-dashboard" element={
            <PrivateRoute element={<AdminDashboard />} roles={['university_admin','system_admin']} />
          } />
          <Route path="/internships" element={
            <PrivateRoute element={<InternshipSearch />} roles={['student','university_admin','system_admin']} />
          } />
          <Route path="/my-applications" element={
            <PrivateRoute element={<MyApplications />} roles={['student']} />
          } />
          <Route path="/student-insights" element={
            <PrivateRoute element={<StudentInsights />} roles={['student']} />
          } />
          <Route path="/student-feedback" element={
            <PrivateRoute element={<StudentFeedbackPortal />} roles={['student']} />
          } />
          <Route path="/notifications" element={
            <PrivateRoute element={<NotificationsPage />} roles={['student','company','university_admin','system_admin']} />
          } />
          <Route path="/interviews" element={
            <PrivateRoute element={<InterviewCenter />} roles={['student','company','university_admin','system_admin']} />
          } />
          <Route path="/interview-reports" element={
            <PrivateRoute element={<InterviewReports />} roles={['company','university_admin','system_admin']} />
          } />
          <Route path="/interview-timeline/:applicationId" element={
            <PrivateRoute element={<InterviewTimeline />} roles={['student','company','university_admin','system_admin']} />
          } />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
