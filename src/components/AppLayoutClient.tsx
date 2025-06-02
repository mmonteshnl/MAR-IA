
"use client";

import React from 'react';
import '@/styles/sidebar.css';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Toaster } from "@/components/ui/toaster";
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ListChecks, Search, LogOut, PackageSearch, FileUp, Send, Cable, Zap, UserCircle, LayoutDashboard, Bell, TrendingUp, Settings, MessageSquare, Phone, Tags, FileText, Users, Briefcase, ShieldCheck, Palette, ConciergeBell, Calculator, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useFirebaseInit } from '@/hooks/useFirebaseInit';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User as FirebaseUser } from 'firebase/auth';

// Placeholder for a 'C' like logo icon
const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14" cy="14" r="12" stroke="hsl(var(--primary))" strokeWidth="2.5"/>
    <path d="M17.2002 9.19995C16.2954 8.71354 15.1897 8.44458 14.0002 8.44458C10.9356 8.44458 8.44464 10.9355 8.44464 14C8.44464 17.0645 10.9356 19.5555 14.0002 19.5555C15.1897 19.5555 16.2954 19.2865 17.2002 18.8" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);


const AppLayoutClient = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { user, authInstance, loading: authLoading, initialLoadDone } = useAuth();
  const { isInitialized, isInitializing } = useFirebaseInit();
  const router = useRouter();
  const { toast } = useToast();

  // Leer estado inicial del sidebar desde cookie
  const getInitialSidebarState = () => {
    if (typeof document !== 'undefined') {
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('sidebar_state='))
        ?.split('=')[1];
      return cookieValue === 'true';
    }
    return true; // default abierto
  };

  const noSidebarPaths = ['/login', '/register'];
  const showSidebar = initialLoadDone && user && !noSidebarPaths.includes(pathname);
  const showOnlyChildren = initialLoadDone && (!user || noSidebarPaths.includes(pathname));

  const handleLogout = async () => {
    if (!authInstance) return;
    try {
      await signOut(authInstance);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión correctamente." });
      router.push('/login'); 
    } catch (error: any) {
      toast({ title: "Error al Cerrar Sesión", description: error.message, variant: "destructive" });
    }
  };

  if (authLoading || !initialLoadDone) {
     if (noSidebarPaths.includes(pathname)) {
        return <>{children}<Toaster /></>;
     }
     return ( 
      <div className="flex items-center justify-center min-h-screen bg-sidebar-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading mientras se inicializan las colecciones de Firebase
  if (user && isInitializing && !noSidebarPaths.includes(pathname)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sidebar-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Inicializando configuraciones...</p>
          <p className="text-xs text-muted-foreground/60">Configurando tu espacio de trabajo por primera vez</p>
        </div>
      </div>
    );
  }

  if (showOnlyChildren) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }
  
  if (!user) {
     return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  const menuSections = [
    {
      title: 'OVERVIEW',
      items: [
        { href: '/business-finder', label: 'Dashboard', icon: LayoutDashboard, currentPathMatcher: (p: string) => p === '/business-finder' || p === '/' },
        { href: '/leads', label: 'Mis Leads', icon: ListChecks, currentPathMatcher: (p: string, sp: URLSearchParams) => p.startsWith('/leads') && sp.get('action') !== 'import-xml' },
      ]
    },
    {
      title: 'GESTIÓN',
      items: [
        { href: '/products', label: 'Mi Catálogo', icon: PackageSearch, currentPathMatcher: (p: string) => p === '/products' },
        { href: '/services', label: 'Mis Servicios', icon: Briefcase, currentPathMatcher: (p: string) => p === '/services' },
        { href: '/channels', label: 'Canales', icon: Cable, currentPathMatcher: (p: string) => p === '/channels' },
      ]
    },
    {
      title: 'COMUNICACIÓN',
      items: [
        { href: '/email-campaigns', label: 'Campañas de Email', icon: Send, currentPathMatcher: (p: string) => p === '/email-campaigns' },
      ]
    },
     {
      title: 'HERRAMIENTAS Y AUTOMATIZACIÓN',
      items: [
        { href: '/leads?action=import-xml', label: 'Importar Leads (IA)', icon: FileUp, currentPathMatcher: (p: string, sp: URLSearchParams) => p === '/leads' && sp.get('action') === 'import-xml' },
        { href: '/ai-prompts', label: 'Configuración de IA', icon: Brain, currentPathMatcher: (p: string) => p === '/ai-prompts' },
        { href: '/valuation', label: 'Configurar Valoración', icon: Calculator, currentPathMatcher: (p: string) => p === '/valuation' },
        { href: '/config', label: 'Configuración General', icon: Settings, currentPathMatcher: (p: string) => p === '/config' },
        { href: '/automations', label: 'Automatizaciones', icon: Zap, currentPathMatcher: (p: string) => p === '/automations' },
      ]
    }
  ];


  return (
    <SidebarProvider 
      defaultOpen={getInitialSidebarState()}
    > 
      <div className="flex min-h-screen bg-background">
        <Sidebar 
          collapsible="icon" 
          side="left" 
          variant="sidebar" 
          className="sidebar border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground shadow-md"
        >
          <SidebarHeader className="p-4 flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Link href="/business-finder" className="flex items-center gap-2.5">
              <LogoIcon />
              <h1 className="font-semibold text-xl text-sidebar-primary group-data-[collapsible=icon]:hidden">MAR-IA</h1>
            </Link>
          </SidebarHeader>
          <SidebarContent className="flex-grow p-2">
            {menuSections.map(section => (
              <SidebarGroup key={section.title} className="p-0 mb-2">
                <SidebarGroupLabel className="px-2 text-xs uppercase text-muted-foreground group-data-[collapsible=icon]:hidden">
                  {section.title}
                </SidebarGroupLabel>
                <SidebarMenu>
                  {section.items.map(item => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.currentPathMatcher(pathname, new URLSearchParams(typeof window !== 'undefined' ? window.location.search : ''))}
                        tooltip={{ children: item.label, side: "right", align:"center" }}
                        className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                      >
                        <Link href={item.href}>
                          <item.icon className="h-5 w-5" />
                          <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter className="p-3 mt-auto border-t border-sidebar-border">
             {user && (
              <div className="flex items-center gap-2 p-2 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'Usuario'} />
                  <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                    {user.email ? user.email[0].toUpperCase() : <UserCircle size={16}/>}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs group-data-[collapsible=icon]:hidden">
                  <p className="font-medium text-sidebar-foreground truncate max-w-[120px]">{user.displayName || user.email}</p>
                  <p className="text-muted-foreground">Admin</p> 
                  <p className="text-muted-foreground/50 break-all text-[10px] max-w-[120px] truncate" title={user.uid}>{user.uid}</p>
                </div>
              </div>
            )}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={handleLogout}
                  tooltip={{ children: "Cerrar Sesión", side: "right", align:"center" }}
                   className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-5 w-5"/>
                  <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col overflow-auto bg-background">
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="sidebar-trigger -ml-1 hover:bg-accent hover:text-accent-foreground transition-all duration-200" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/business-finder" className="font-medium">
                    MAR-IA
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathname !== '/business-finder' && pathname !== '/' && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#" className="capitalize">
                        {pathname.split('/')[1]?.replace('-', ' ') || 'Dashboard'}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <main className="flex-1 p-4 sm:p-6 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
      <Toaster />

    </SidebarProvider>
  );
};

export default AppLayoutClient;
