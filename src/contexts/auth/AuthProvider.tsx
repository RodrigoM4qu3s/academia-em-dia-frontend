
import React, { createContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContextType } from './types';
import { useAuthState } from './useAuthState';
import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut } from './authOperations';

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
  const navigate = useNavigate();
  const { 
    user, 
    profile, 
    session, 
    isLoading,
    setIsLoading,
    fetchUserProfile
  } = useAuthState();

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const data = await authSignIn(email, password);
      if (data && data.user) {
        await fetchUserProfile(data.user.id);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (nome: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      await authSignUp(nome, email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authSignOut(navigate);
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
