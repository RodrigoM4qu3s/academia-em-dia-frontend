
import { Session, User } from '@supabase/supabase-js';

export type UserProfile = {
  id: string;
  nome: string;
  email: string;
  role: string;
  academy_id: string;
};

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (nome: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}
