"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Bell, Handshake, Heart, ClipboardList, Repeat } from 'lucide-react';
import type { Lead } from '@/types';

interface LeadStatsProps {
  leads: Lead[];
}

export default function LeadStats({ leads }: LeadStatsProps) {
  const stats = {
    total: leads.length,
    nuevo: leads.filter(l => l.stage === 'Nuevo').length,
    contactado: leads.filter(l => l.stage === 'Contactado').length,
    calificado: leads.filter(l => l.stage === 'Calificado').length,
    propuesta: leads.filter(l => l.stage === 'Propuesta Enviada').length,
    negociacion: leads.filter(l => l.stage === 'Negociación').length,
    ganado: leads.filter(l => l.stage === 'Ganado').length,
    perdido: leads.filter(l => l.stage === 'Perdido').length,
  };

  const conversionRate = stats.total > 0 
    ? ((stats.ganado / stats.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold leading-none mb-2">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Todos los leads registrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold leading-none mb-2">{stats.nuevo}</div>
          <p className="text-xs text-muted-foreground">
            Leads sin contactar
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En Proceso</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
<div className="text-6xl font-bold leading-none mb-2">
  {stats.contactado + stats.calificado + stats.propuesta + stats.negociacion}
</div>
          <p className="text-xs text-muted-foreground">
            Leads activos en el embudo
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
          <Handshake className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-6xl font-bold leading-none mb-2">{conversionRate}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.ganado} de {stats.total} leads
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
