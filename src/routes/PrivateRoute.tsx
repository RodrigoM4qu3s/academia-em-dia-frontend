
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PrivateRouteProps {
  children?: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    // Mostrar spinner de carregamento enquanto verifica autenticação
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Consider the user authenticated if they have a valid user object from Supabase auth
  // even if the profile fetch failed
  if (!isAuthenticated || !user) {
    // Redirecionar para a página de login se não estiver autenticado
    return <Navigate to="/login" replace />;
  }

  // Renderizar ou os filhos ou o outlet (para rotas aninhadas)
  return children ? <>{children}</> : <Outlet />;
};

export default PrivateRoute;
