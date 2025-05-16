
import React, { createContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type UserProfile = {
  id: string;
  nome: string;
  email: string;
  role: string;
  academy_id: string;
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (nome: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  isAuthenticated: false,
});

// Função para limpar o estado de autenticação
const cleanupAuthState = () => {
  localStorage.removeItem('supabase.auth.token');
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Configurar ouvinte de eventos de autenticação primeiro
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('Auth state changed:', event);
            setSession(newSession);
            setUser(newSession?.user || null);

            if (event === 'SIGNED_IN' && newSession?.user) {
              // Usar setTimeout para evitar deadlocks
              setTimeout(async () => {
                await fetchUserProfile(newSession.user.id);
              }, 0);
            } else if (event === 'SIGNED_OUT') {
              setProfile(null);
              setUser(null);
              setSession(null);
            }
          }
        );

        // Depois verificar a sessão atual
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('Initial session:', initialSession);
        setSession(initialSession);
        setUser(initialSession?.user || null);
        
        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id);
        }

        setIsLoading(false);
        
        // Limpar inscrição
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Erro ao configurar autenticação:', error);
        setIsLoading(false);
      }
    };

    setupAuth();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Buscando perfil para usuário:', userId);
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        throw error;
      }
      
      if (data) {
        console.log('Perfil encontrado:', data);
        setProfile(data as UserProfile);
      } else {
        console.warn('Nenhum perfil encontrado para o usuário:', userId);
        setProfile(null);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Limpar estado de autenticação anterior
      cleanupAuthState();
      
      // Tentar fazer logout global para garantir estado limpo
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continuar mesmo se falhar
        console.warn('Falha ao fazer logout global antes do login:', err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data && data.user) {
        await fetchUserProfile(data.user.id);
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro de login:', error);
      
      let errorMessage = 'Erro ao fazer login. Tente novamente.';
      if (error.message === 'Invalid login credentials') {
        errorMessage = 'Credenciais inválidas';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (nome: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Limpar estado de autenticação anterior
      cleanupAuthState();
      
      // Gerar um UUID para academy_id (simulando a criação de uma nova academia)
      const academy_id = crypto.randomUUID();
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            academy_id,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data && data.user) {
        // Inserir perfil de usuário na tabela usuarios
        const { error: profileError } = await supabase
          .from('usuarios')
          .insert({
            id: data.user.id,
            nome,
            email,
            role: 'Administrador',
            academy_id,
          });

        if (profileError) {
          throw profileError;
        }

        toast.success('Verifique seu e-mail para confirmar o cadastro!');
        return data.user;
      } else {
        throw new Error('Falha ao criar usuário');
      }
    } catch (error: any) {
      console.error('Erro de cadastro:', error);
      
      let errorMessage = 'Erro ao criar conta. Tente novamente.';
      if (error.message.includes('email') || error.message.includes('already')) {
        errorMessage = 'Este e-mail já está em uso';
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Limpar estado de autenticação
      cleanupAuthState();
      
      // Tentar logout global
      await supabase.auth.signOut({ scope: 'global' });
      setProfile(null);
      setUser(null);
      setSession(null);
      
      toast.success('Desconectado com sucesso');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
      toast.error('Erro ao desconectar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
