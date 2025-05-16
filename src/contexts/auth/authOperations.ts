
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from './authUtils';

/**
 * Core authentication operations
 * Extracted from AuthProvider to separate business logic
 */
export const signIn = async (email: string, password: string) => {
  try {
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
      toast.success('Login realizado com sucesso!');
      return data;
    }
    return null;
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
  }
};

export const signUp = async (nome: string, email: string, password: string) => {
  try {
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
      return data;
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
  }
};

export const signOut = async (navigate: (path: string) => void) => {
  try {
    // Limpar estado de autenticação
    cleanupAuthState();
    
    // Tentar logout global
    await supabase.auth.signOut({ scope: 'global' });
    
    toast.success('Desconectado com sucesso');
    navigate('/login');
  } catch (error) {
    console.error('Erro ao sair:', error);
    toast.error('Erro ao desconectar');
    throw error;
  }
};
