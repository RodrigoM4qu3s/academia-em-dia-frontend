
import { supabase } from '../lib/supabase';
import { SignUpFormData } from './ValidationUtils';

export class RegistrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistrationError';
  }
}

export const registerUser = async ({ nome, email, password }: SignUpFormData) => {
  try {
    // Generate a UUID for academy_id (simulating a new academy creation)
    const academy_id = crypto.randomUUID();
    
    // Register user with Supabase Auth
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
      throw new RegistrationError(error.message);
    }

    if (!data.user) {
      throw new RegistrationError('Falha ao criar usuário');
    }

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
      throw new RegistrationError(profileError.message);
    }

    return data.user;
  } catch (error) {
    if (error instanceof RegistrationError) {
      throw error;
    }
    throw new RegistrationError('Erro ao processar registro');
  }
};
