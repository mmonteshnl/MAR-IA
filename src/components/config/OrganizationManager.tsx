"use client";

import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Users, Plus, Mail, Crown, Settings, UserPlus } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function OrganizationManager() {
  const { 
    organizations, 
    currentOrganization, 
    loading, 
    error, 
    createOrganization, 
    addMember, 
    switchOrganization 
  } = useOrganization();
  
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  
  // Create organization form
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  
  // Invite member form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member');

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreating(true);
    try {
      await createOrganization();
      toast({
        title: "Organización creada",
        description: `La organización "${newOrgName}" ha sido creada exitosamente.`
      });
      setIsCreateDialogOpen(false);
      setNewOrgName('');
      setNewOrgDescription('');
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo crear la organización. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentOrganization) return;

    setInviting(true);
    try {
      await addMember();
      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${inviteEmail}.`
      });
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo enviar la invitación. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Building2 className="mr-2 h-6 w-6" />
            Gestión de Organizaciones
          </h2>
          <p className="text-gray-600 mt-1">
            Administra tu organización y miembros del equipo
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Organización
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Organización</DialogTitle>
              <DialogDescription>
                Crea una nueva organización para gestionar leads en equipo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrganization}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="orgName">Nombre de la Organización</Label>
                  <Input
                    id="orgName"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Mi Empresa"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="orgDescription">Descripción (opcional)</Label>
                  <Textarea
                    id="orgDescription"
                    value={newOrgDescription}
                    onChange={(e) => setNewOrgDescription(e.target.value)}
                    placeholder="Describe tu organización..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating || !newOrgName.trim()}>
                  {creating ? <LoadingSpinner size="sm" /> : 'Crear Organización'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Organization */}
      {currentOrganization && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  {currentOrganization.name}
                  <Badge variant="outline" className="ml-2">Actual</Badge>
                </CardTitle>
                <CardDescription>{currentOrganization.description}</CardDescription>
              </div>
              
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar Miembro
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
                    <DialogDescription>
                      Invita a un nuevo miembro a tu organización.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInviteMember}>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="inviteEmail">Email del Usuario</Label>
                        <Input
                          id="inviteEmail"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="usuario@ejemplo.com"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="inviteRole">Rol</Label>
                        <Select value={inviteRole} onValueChange={(value: 'admin' | 'member') => setInviteRole(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Miembro</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={inviting || !inviteEmail.trim()}>
                        {inviting ? <LoadingSpinner size="sm" /> : 'Enviar Invitación'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <Users className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {currentOrganization.memberIds.length} miembro(s)
                </span>
              </div>
              <div className="flex items-center">
                <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                <span className="text-sm text-gray-600">
                  Propietario
                </span>
              </div>
              <div className="flex items-center">
                <Settings className="mr-2 h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Configuración activa
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Organizations */}
      {organizations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Cambiar Organización</CardTitle>
            <CardDescription>
              Selecciona una organización para trabajar con sus datos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    currentOrganization?.id === org.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={switchOrganization}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{org.name}</h4>
                      <p className="text-sm text-gray-600">{org.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {org.memberIds.length} miembro(s)
                      </Badge>
                      {currentOrganization?.id === org.id && (
                        <Badge>Actual</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">¿Cómo funcionan las organizaciones?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600">
          <p>• <strong>Organización personal:</strong> Por ahora tienes una organización personal que gestiona todos tus leads.</p>
          <p>• <strong>Datos privados:</strong> Tus leads son privados y solo tú puedes acceder a ellos.</p>
          <p>• <strong>Próximamente:</strong> Funciones colaborativas para equipos están en desarrollo.</p>
          <p>• <strong>Migración automática:</strong> Cuando estén listas, tus datos se migrarán automáticamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}