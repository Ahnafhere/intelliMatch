import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import CompanyDashboard from './pages/CompanyDashboard';
import InternshipSearch from './pages/InternshipSearch';
import MyApplications from './pages/MyApplications';
import AdminDashboard from './pages/AdminDashboard';
import NotificationsPage from './pages/NotificationsPage';
import InterviewCenter from './pages/InterviewCenter';
import StudentInsights from './pages/StudentInsights';
import CompanyInsights from './pages/CompanyInsights';
import InterviewReports from './pages/InterviewReports';
import InterviewTimeline from './pages/InterviewTimeline';
import StudentFeedbackPortal from './pages/StudentFeedbackPortal';

const PrivateRoute = ({ element, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return element;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'student') return <Navigate to="/student-dashboard" />;
  if (user.role === 'company') return <Navigate to="/company-dashboard" />;
  return <Navigate to="/admin-dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
