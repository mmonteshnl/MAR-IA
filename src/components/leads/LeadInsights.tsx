"use client";

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Target, Phone, Mail, Globe, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Lead } from '@/types';
import { LEAD_STAGES } from '@/lib/leads-utils';

interface LeadInsightsProps {
  leads: Lead[];
  className?: string;
}

export const LeadInsights = ({ leads, className }: LeadInsightsProps) => {
  const insights = useMemo(() => {
    const total = leads.length;
    
    // Stage distribution
    const stageDistribution = LEAD_STAGES.map(stage => ({
      stage,
      count: leads.filter(lead => lead.stage === stage).length,
      percentage: total ? (leads.filter(lead => lead.stage === stage).length / total) * 100 : 0
    }));

    // Contact info completeness
    const contactStats = {
      withPhone: leads.filter(lead => lead.phone && lead.phone.trim()).length,
      withEmail: leads.filter(lead => lead.email && lead.email.trim()).length,
      withWebsite: leads.filter(lead => lead.website && lead.website.trim()).length,
      complete: leads.filter(lead => 
        lead.phone?.trim() && lead.email?.trim() && lead.website?.trim()
      ).length
    };

    // Source distribution
    const sourceDistribution = leads.reduce((acc, lead) => {
      const source = lead.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentLeads = leads.filter(lead => {
      const createdAt = lead.createdAt?.toDate?.() || new Date(lead.createdAt || 0);
      return createdAt > oneWeekAgo;
    }).length;

    return {
      total,
      stageDistribution,
      contactStats,
      sourceDistribution,
      recentLeads,
      conversionRate: total ? (leads.filter(lead => lead.stage === 'Vendido').length / total) * 100 : 0
    };
  }, [leads]);

  const MiniChart = ({ data, color = "bg-primary" }: { data: number; color?: string }) => (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-8 rounded-full", color)} 
           style={{ height: `${Math.max(data, 5)}%` }} />
      <span className="text-sm font-medium">{data}%</span>
    </div>
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.total}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +{insights.recentLeads} esta semana
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa Conversión</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.conversionRate.toFixed(1)}%</div>
            <Progress value={insights.conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacto Completo</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.contactStats.complete}</div>
            <div className="text-xs text-muted-foreground">
              {insights.total ? ((insights.contactStats.complete / insights.total) * 100).toFixed(1) : 0}% del total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos Esta Semana</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.recentLeads}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {insights.recentLeads > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              Últimos 7 días
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Etapa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.stageDistribution.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{stage.stage}</span>
                  <span className="text-sm text-muted-foreground">
                    {stage.count} ({stage.percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress 
                  value={stage.percentage} 
                  className="h-2"
                  style={{
                    '--progress-background': `hsl(${(index * 60) % 360}, 70%, 50%)`
                  } as React.CSSProperties}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Con Teléfono</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{insights.contactStats.withPhone}</span>
                <MiniChart 
                  data={insights.total ? (insights.contactStats.withPhone / insights.total) * 100 : 0} 
                  color="bg-blue-500" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-500" />
                <span className="text-sm">Con Email</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{insights.contactStats.withEmail}</span>
                <MiniChart 
                  data={insights.total ? (insights.contactStats.withEmail / insights.total) * 100 : 0} 
                  color="bg-green-500" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Con Website</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{insights.contactStats.withWebsite}</span>
                <MiniChart 
                  data={insights.total ? (insights.contactStats.withWebsite / insights.total) * 100 : 0} 
                  color="bg-purple-500" 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Source Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fuentes de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(insights.sourceDistribution).map(([source, count]) => (
              <Badge key={source} variant="outline" className="flex items-center gap-1">
                {source.replace('_', ' ')}
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 ml-1">
                  {count}
                </span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};