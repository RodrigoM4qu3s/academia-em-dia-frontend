
import React, { createContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AuthContextType, UserProfile } from './types';
import { cleanupAuthState } from './authUtils';

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
        
        // If the profile doesn't exist yet but we have user data from auth,
        // create a default profile using user metadata
        if (error.code === 'PGRST116') {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            const userMetadata = userData.user.user_metadata;
            const academyId = userMetadata?.academy_id || crypto.randomUUID();
            const nome = userMetadata?.nome || userData.user.email?.split('@')[0] || 'Usuário';
            
            const defaultProfile: UserProfile = {
              id: userId,
              nome,
              email: userData.user.email || '',
              role: 'Administrador',
              academy_id: academyId
            };
            
            // Try to insert the profile
            const { error: insertError } = await supabase
              .from('usuarios')
              .insert(defaultProfile);
              
            if (!insertError) {
              console.log('Perfil padrão criado para o usuário:', userId);
              setProfile(defaultProfile);
              return;
            } else {
              console.error('Erro ao criar perfil padrão:', insertError);
            }
          }
        }
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
      // Even if there's an error fetching the profile, don't set it to null
      // This ensures the user remains authenticated
    }
  };

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
        // We don't navigate here anymore, as the auth state change will handle it
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
          console.error('Erro ao criar perfil:', profileError);
          // Continue anyway - we'll create the profile on login if needed
        }

        toast.success('Verifique seu e-mail para confirmar o cadastro!');
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
