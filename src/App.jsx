import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GuardianDashboard from './pages/GuardianDashboard';
import AdminRegistrationPage from './pages/AdminRegistrationPage';
import StudentSubmissionsPage from './pages/StudentSubmissionsPage';
import StudentResultPage from './pages/StudentResultPage';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  switch (user.role) {
    case 'teacher':
      return <Navigate to="/teacher" />;
    case 'student':
      return <Navigate to="/student" />;
    case 'admin':
      return <Navigate to="/admin" />;
    case 'guardian':
      return <Navigate to="/guardian" />;
    default:
      return <Navigate to="/" />;
  }
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin-registration" element={<AdminRegistrationPage />} />
          <Route path="/teacher/*" element={<TeacherDashboard />} />
          <Route path="/student/*" element={<StudentDashboard />} />
          <Route path="/student/results/:examId" element={<StudentResultPage />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="/guardian/*" element={<GuardianDashboard />} />
          <Route path="/guardian" element={<GuardianDashboard />} />
          <Route path="/results/:resultId" element={<StudentResultPage />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/exam/:examId/submissions" element={<StudentSubmissionsPage />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
