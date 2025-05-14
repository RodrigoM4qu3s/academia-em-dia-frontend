
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <h2 className="mb-4 mt-2 text-2xl font-semibold">Página não encontrada</h2>
      <p className="mb-6 max-w-md text-muted-foreground">
        A página que você está procurando não existe ou foi removida.
      </p>
      <Button asChild>
        <Link to="/">Voltar para o início</Link>
      </Button>
    </div>
  );
};

export default NotFound;
