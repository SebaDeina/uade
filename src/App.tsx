import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './LoginPage';
import PlanEstudios from './PlanEstudios';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0f1a',
        color: '#94a3b8',
        fontSize: '1rem',
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return <PlanEstudios uid={user.uid} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
