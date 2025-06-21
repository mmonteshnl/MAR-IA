import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registro de Contacto | CRM',
  description: 'Comparte tu información de contacto con nosotros',
  robots: 'noindex, nofollow', // Prevent search engine indexing for privacy
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        {/* Minimal SEO for public capture pages */}
        <meta name="description" content="Comparte tu información de contacto con nosotros" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {children}
      </body>
    </html>
  );
}