'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Phone, 
  Mail, 
  User, 
  MessageSquare, 
  Loader2,
  AlertCircle 
} from 'lucide-react';

export default function PublicCapturePage() {
  const params = useParams();
  const publicUrlId = params.publicUrlId as string;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    website: '' // Honeypot field
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrLinkExists, setQRLinkExists] = useState<boolean | null>(null);

  // Track scan on page load
  useEffect(() => {
    const trackScan = async () => {
      try {
        await fetch('/api/public/track-scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicUrlId }),
        });
      } catch (error) {
        console.error('Error tracking scan:', error);
        // Don't show error to user for tracking issues
      }
    };

    if (publicUrlId) {
      trackScan();
    }
  }, [publicUrlId]);

  // Verify QR link exists
  useEffect(() => {
    const verifyLink = async () => {
      try {
        const response = await fetch('/api/public/track-scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ publicUrlId }),
        });

        if (response.ok) {
          setQRLinkExists(true);
        } else {
          setQRLinkExists(false);
        }
      } catch (error) {
        console.error('Error verifying link:', error);
        setQRLinkExists(false);
      }
    };

    if (publicUrlId) {
      verifyLink();
    }
  }, [publicUrlId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Por favor completa todos los campos obligatorios');
      setIsSubmitting(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor ingresa un email válido');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/public/register-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicUrlId,
          leadData: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            notes: formData.notes.trim() || undefined,
          },
          website: formData.website // Honeypot field
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        // Clear form
        setFormData({
          name: '',
          email: '',
          phone: '',
          notes: '',
          website: ''
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al enviar el formulario. Inténtalo de nuevo.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Error de conexión. Por favor verifica tu conexión a internet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(null); // Clear error when user starts typing
  };

  // Loading state while checking if link exists
  if (qrLinkExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Cargando...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Link doesn't exist or is inactive
  if (qrLinkExists === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-semibold mb-2 text-gray-900">
              Link No Válido
            </h1>
            <p className="text-gray-600">
              Este link de registro no existe o ha sido desactivado.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500" />
            <h1 className="text-2xl font-bold mb-4 text-gray-900">
              ¡Gracias por tu interés!
            </h1>
            <p className="text-gray-600 mb-6">
              Hemos recibido tu información correctamente. Nos pondremos en contacto contigo pronto.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                💡 <strong>Próximos pasos:</strong> Revisa tu email para más información y mantente atento a nuestras comunicaciones.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            ¡Conectemos!
          </CardTitle>
          <p className="text-gray-600">
            Comparte tu información y te contactaremos pronto
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot field - hidden from users */}
            <div style={{ display: 'none' }}>
              <Label htmlFor="website">Website (do not fill)</Label>
              <Input
                id="website"
                type="text"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Name field */}
            <div>
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre completo *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ingresa tu nombre completo"
                required
                className="mt-1"
                autoComplete="name"
              />
            </div>

            {/* Email field */}
            <div>
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@email.com"
                required
                className="mt-1"
                autoComplete="email"
              />
            </div>

            {/* Phone field */}
            <div>
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
                required
                className="mt-1"
                autoComplete="tel"
              />
            </div>

            {/* Notes field */}
            <div>
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Mensaje adicional (opcional)
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="¿Hay algo específico en lo que podemos ayudarte?"
                rows={3}
                className="mt-1 resize-none"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                'Enviar información'
              )}
            </Button>

            {/* Privacy notice */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
              <p className="text-xs text-gray-600 text-center">
                🔒 Tu información está segura. Solo la usaremos para contactarte y no la compartiremos con terceros.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}