
import { Injectable } from '@nestjs/common';
import { SupabaseClientService } from '../lib/supabaseClient.service';

export type UserProfile = {
  id: string;
  nome: string;
  email: string;
  role: string;
  academy_id: string;
  created_at: string;
};

@Injectable()
export class UsersService {
  constructor(private supabaseClient: SupabaseClientService) {}

  async findById(id: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabaseClient.client
      .from('usuarios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }

    return data as UserProfile;
  }

  async findAll(academyId: string): Promise<UserProfile[]> {
    const { data, error } = await this.supabaseClient.client
      .from('usuarios')
      .select('*')
      .eq('academy_id', academyId);

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    return data as UserProfile[];
  }
}
