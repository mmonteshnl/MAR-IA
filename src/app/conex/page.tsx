'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingGuide } from '@/components/conex/OnboardingGuide';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';

export default function ConexWelcomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentOrganization: organization } = useOrganization();
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    // Check if user has already seen the guide
    const hasSeenGuide = localStorage.getItem(`conex-guide-seen-${organization?.id}`);
    if (hasSeenGuide) {
      // Redirect to flows if already seen
      router.push('/conex/flows');
    }
  }, [organization, router]);

  const handleGuideComplete = () => {
    if (organization) {
      localStorage.setItem(`conex-guide-seen-${organization.id}`, 'true');
    }
    setShowGuide(false);
    router.push('/conex/flows');
  };

  if (!showGuide) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Bienvenido a Conex
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            La plataforma de automatización visual que transforma tu CRM en una potente herramienta iPaaS
          </p>
        </div>
        
        <OnboardingGuide 
          onClose={handleGuideComplete}
          className="shadow-2xl"
        />
        
        <div className="text-center mt-8">
          <button
            onClick={handleGuideComplete}
            className="text-sm text-muted-foreground hover:text-primary transition-colors underline"
          >
            Saltar tutorial y empezar directamente
          </button>
        </div>
      </div>
    </div>
  );
}