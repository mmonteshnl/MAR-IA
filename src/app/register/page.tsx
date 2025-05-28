
"use client";

import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';


export default function RegisterPage() {
  const router = useRouter();
  const { user, loading, initialLoadDone } = useAuth();

  useEffect(() => {
    if (initialLoadDone && user) {
      router.replace('/business-finder');
    }
  }, [user, initialLoadDone, router]);

  const handleRegister = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/business-finder');
    } catch (error: any) {
      console.error("Registration failed:", error);
      let message = "Error al registrarse. Por favor, inténtalo de nuevo.";
      if (error.code === 'auth/email-already-in-use') {
        message = "Esta dirección de email ya está en uso.";
      } else if (error.code === 'auth/weak-password') {
        message = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
      } else if (error.code === 'auth/invalid-email') {
        message = "Por favor, introduce una dirección de email válida.";
      }
      throw new Error(message);
    }
  };

  if (loading || (initialLoadDone && user)) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthForm
      mode="register"
      onSubmit={handleRegister}
      title="Crear Cuenta"
      buttonText="Registrarse"
      alternateActionText="¿Ya tienes una cuenta?"
      alternateActionLink="/login"
    />
  );
}
