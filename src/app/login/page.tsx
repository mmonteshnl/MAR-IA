
"use client";

import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';


export default function LoginPage() {
  const router = useRouter();
  const { user, loading, initialLoadDone } = useAuth();

  useEffect(() => {
    if (initialLoadDone && user) {
      router.replace('/business-finder');
    }
  }, [user, initialLoadDone, router]);


  const handleLogin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/business-finder');
    } catch (error: any) {
      console.error("Login failed:", error);
      let message = "Error al iniciar sesión. Por favor, revisa tus credenciales.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        message = "Email o contraseña incorrectos.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Por favor, introduce una dirección de email válida.";
      }
      throw new Error(message);
    }
  };
  
  if (loading || (initialLoadDone && user) ) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }


  return (
    <AuthForm
      mode="login"
      onSubmit={handleLogin}
      title="¡Bienvenido de Nuevo!"
      buttonText="Iniciar Sesión"
      alternateActionText="¿No tienes una cuenta?"
      alternateActionLink="/register"
    />
  );
}
