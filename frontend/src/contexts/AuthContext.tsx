import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type Rol = 'admin' | 'operario' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  rol: Rol;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchRol(userId: string): Promise<Rol> {
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.warn('[fetchRol] Policy or data error:', error.message);
      // If it's a 406 (Not Acceptable) it might mean no row found, which is fine, default to operario
      return 'operario';
    }
    
    return (data?.rol as Rol) ?? 'operario';
  } catch (err) {
    console.error('[fetchRol] Unexpected error:', err);
    return 'operario';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [rol, setRol] = useState<Rol>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isMounted) {
          const currentUser = data.session?.user || null;
          setSession(data.session);
          setUser(currentUser);
          if (currentUser) {
            const userRol = await fetchRol(currentUser.id);
            if (isMounted) setRol(userRol);
          }
        }
      } catch (error) {
        console.error('Error al inicializar sesión', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setRol(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[Auth] Auth state changed:', _event, 'Session exists:', !!session);
      setSession(session);
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        console.log('[Auth] Fetching role for user:', currentUser.id);
        const userRol = await fetchRol(currentUser.id);
        console.log('[Auth] Role fetched:', userRol);
        setRol(userRol);
      } else {
        setRol(null);
      }
      setLoading(false);
      console.log('[Auth] Loading set to false');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, rol, isAdmin: rol === 'admin', loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
