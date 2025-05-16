
import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from './types';

/**
 * Hook to manage authentication state
 * Extracts the core authentication state management logic from AuthProvider
 */
export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  return {
    user,
    profile,
    session,
    isLoading,
    setProfile,
    setUser,
    setSession,
    setIsLoading,
    fetchUserProfile
  };
};
