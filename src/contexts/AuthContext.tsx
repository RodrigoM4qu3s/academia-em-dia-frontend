
import React, { createContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const setupAuth = async () => {
      // Get initial session
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user || null);
      
      if (initialSession?.user) {
        await fetchUserProfile(initialSession.user.id);
      }

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          setSession(newSession);
          setUser(newSession?.user || null);

          if (newSession?.user) {
            await fetchUserProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
        }
      );

      setIsLoading(false);
      
      // Cleanup subscription
      return () => subscription.unsubscribe();
    };

    setupAuth();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      setProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data && data.user) {
        await fetchUserProfile(data.user.id);
        navigate('/dashboard');
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro de login:', error);
      toast.error(error.message === 'Invalid login credentials'
        ? 'Credenciais inválidas'
        : 'Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (nome: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      // Generate a UUID for academy_id (simulating a new academy creation)
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
        // Insert user profile into usuarios table
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
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Erro de cadastro:', error);
      toast.error(
        error.message.includes('email') 
          ? 'Este e-mail já está em uso'
          : 'Erro ao criar conta. Tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await supabase.auth.signOut();
      setProfile(null);
      navigate('/login');
      toast.success('Desconectado com sucesso');
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
