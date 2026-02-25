import { AuthProvider, useAuth } from './AuthContext';
import LandingPage from './LandingPage';
import PlanEstudios from './PlanEstudios';
import WhatsAppButton from './WhatsAppButton';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
        color: '#718096',
        fontSize: '1rem',
      }}>
        Cargando...
      </div>
    );
  }

  if (!user) return (
    <>
      <LandingPage />
      <WhatsAppButton />
    </>
  );

  return (
    <>
      <PlanEstudios uid={user.uid} />
      <WhatsAppButton />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
