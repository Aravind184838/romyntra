import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import SplashScreen        from './pages/SplashScreen';
import LoginPage           from './pages/LoginPage';
import SignupPage          from './pages/SignupPage';
import OTPVerification     from './pages/OTPVerification';
import ProfileSetup        from './pages/ProfileSetup';
import DiscoverPage        from './pages/DiscoverPage';
import MatchesPage         from './pages/MatchesPage';
import ChatPage            from './pages/ChatPage';
import RecommendationsPage from './pages/RecommendationsPage';
import PreferencesPage    from './pages/PreferencesPage';
import ProfilePage         from './pages/ProfilePage';
import AdminDashboard      from './pages/admin/AdminDashboard';
import UserManagement      from './pages/admin/UserManagement';
import ReportsPanel        from './pages/admin/ReportsPanel';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/"              element={<SplashScreen />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/signup"        element={<SignupPage />} />
        <Route path="/verify-otp"    element={<OTPVerification />} />
        <Route path="/setup-profile" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />

        {/* App */}
        <Route path="/discover"          element={<ProtectedRoute><DiscoverPage /></ProtectedRoute>} />
        <Route path="/matches"           element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
        <Route path="/chat"              element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/chat/:matchId"     element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/recommendations/:matchId" element={<ProtectedRoute><RecommendationsPage /></ProtectedRoute>} />
        <Route path="/profile"           element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/preferences"       element={<ProtectedRoute><PreferencesPage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin"         element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users"   element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute adminOnly><ReportsPanel /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
