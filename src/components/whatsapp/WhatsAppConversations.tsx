"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { MessageCircle, Search, Phone, Clock, User } from 'lucide-react';
import type { WhatsAppConversation } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useOrganization } from '@/hooks/useOrganization';

interface WhatsAppConversationsProps {
  instanceId?: string;
  leadId?: string;
}

export function WhatsAppConversations({ instanceId, leadId }: WhatsAppConversationsProps) {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const { organizationId } = useOrganization();

  const loadConversations = async () => {
    if (!user || !organizationId) return;

    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        organizationId,
        ...(instanceId && { instanceId }),
        ...(leadId && { leadId }),
        limit: '50'
      });
      
      const response = await fetch(`/api/whatsapp/conversations?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        setConversations(result.data);
      } else {
        throw new Error(result.message || 'Error al cargar conversaciones');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Error al cargar conversaciones',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      conversation.contactName?.toLowerCase().includes(searchLower) ||
      conversation.contactNumber.includes(searchTerm) ||
      conversation.leadId.toLowerCase().includes(searchLower)
    );
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'archived':
        return 'bg-gray-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getInitials = (name?: string, phone?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return phone?.slice(-2) || '??';
  };

  useEffect(() => {
    loadConversations();
  }, [user, organizationId, instanceId, leadId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <MessageCircle className="h-4 w-4 animate-pulse" />
            <span>Cargando conversaciones...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Conversaciones de WhatsApp
          {conversations.length > 0 && (
            <Badge variant="secondary">{conversations.length}</Badge>
          )}
        </CardTitle>
        
        {conversations.length > 0 && (
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono o lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay conversaciones disponibles</p>
            {searchTerm && (
              <p className="text-sm">No se encontraron resultados para "{searchTerm}"</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Avatar>
                  <AvatarFallback>
                    {getInitials(conversation.contactName, conversation.contactNumber)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate">
                      {conversation.contactName || `Contacto ${conversation.contactNumber}`}
                    </h4>
                    <Badge 
                      variant="secondary"
                      className={`${getStatusColor(conversation.status)} text-white text-xs`}
                    >
                      {conversation.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{conversation.contactNumber}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">Lead: {conversation.leadId}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>{conversation.messageCount} mensajes</span>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {conversation.unreadCount} sin leer
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(conversation.lastMessageAt)}</span>
                    </div>
                  </div>
                  
                  {conversation.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {conversation.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <Button size="sm" variant="outline">
                  Ver Chat
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}