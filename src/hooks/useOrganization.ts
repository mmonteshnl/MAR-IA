import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch,
  onSnapshot
} from 'firebase/firestore';
import { logger } from '@/lib/logger';
import type { Organization, OrganizationMember, OrganizationInvite } from '@/types/organization';

export function useOrganization() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Cache and debouncing refs
  const loadingRef = useRef(false);
  const cacheRef = useRef<{ [userId: string]: { data: Organization[], timestamp: number } }>({});
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Memoized user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.uid, [user?.uid]);

  // Create default organization for new users
  const createDefaultOrganization = useCallback(async () => {
    if (!userId || !user?.email) {
      return null;
    }

    try {
      const displayName = user.displayName || user.email.split('@')[0];
      const defaultOrg = {
        name: `Organización de ${displayName}`,
        description: 'Organización predeterminada',
        ownerId: userId,
        memberIds: [userId],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          allowMemberInvites: true,
          defaultLeadStage: 'Nuevo',
          timezone: 'America/Mexico_City'
        }
      };

      const docRef = await addDoc(collection(db, 'organizations'), defaultOrg);
      
      const newOrg: Organization = {
        id: docRef.id,
        name: defaultOrg.name,
        description: defaultOrg.description,
        ownerId: defaultOrg.ownerId,
        memberIds: defaultOrg.memberIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: defaultOrg.settings
      };

      // Update cache
      cacheRef.current[userId] = {
        data: [newOrg],
        timestamp: Date.now()
      };

      setOrganizations([newOrg]);
      setCurrentOrganization(newOrg);
      setError(null);
      return newOrg;
    } catch (err) {
      setError('Error al crear organización predeterminada');
      return null;
    }
  }, [userId, user?.email, user?.displayName]);

  // Load user's organizations with cache and debouncing
  const loadUserOrganizations = useCallback(async () => {
    if (!userId) return;
    
    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;
    
    // Check cache first
    const cached = cacheRef.current[userId];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setOrganizations(cached.data);
      if (cached.data.length > 0 && !currentOrganization) {
        setCurrentOrganization(cached.data[0]);
      }
      setLoading(false);
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      // Query organizations where user is owner or member
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('memberIds', 'array-contains', userId)
      );

      const snapshot = await getDocs(orgsQuery);
      
      const orgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Organización Sin Nombre',
          description: data.description || '',
          ownerId: data.ownerId || userId,
          memberIds: data.memberIds || [userId],
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          settings: data.settings || {
            allowMemberInvites: true,
            defaultLeadStage: 'Nuevo',
            timezone: 'America/Mexico_City'
          }
        };
      }) as Organization[];

      // Sort by creation date (newest first)
      orgs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Update cache
      cacheRef.current[userId] = {
        data: orgs,
        timestamp: Date.now()
      };

      setOrganizations(orgs);
      
      // Set current organization (first one or create default)
      if (orgs.length > 0) {
        if (!currentOrganization) {
          setCurrentOrganization(orgs[0]);
        }
      } else {
        await createDefaultOrganization();
      }
    } catch (err) {
      try {
        await createDefaultOrganization();
      } catch (createErr) {
        setError('Error al cargar organizaciones. Creando organización local...');
        createLocalFallbackOrganization();
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [userId, createDefaultOrganization, currentOrganization]);

  // Create local fallback organization if Firestore fails
  const createLocalFallbackOrganization = useCallback(() => {
    if (!userId || !user?.email) return;

    const displayName = user.displayName || user.email.split('@')[0];
    const localOrg: Organization = {
      id: `local_${userId}`,
      name: `Organización Local de ${displayName}`,
      description: 'Organización temporal (solo local)',
      ownerId: userId,
      memberIds: [userId],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowMemberInvites: false,
        defaultLeadStage: 'Nuevo',
        timezone: 'America/Mexico_City'
      }
    };

    setOrganizations([localOrg]);
    setCurrentOrganization(localOrg);
    setError(null);
  }, [userId, user?.email, user?.displayName]);

  // Create new organization
  const createOrganization = useCallback(async (name: string, description?: string) => {
    if (!user?.uid) throw new Error('Usuario no autenticado');

    try {
      logger.debug('Creating new organization:', { name, description });
      
      const orgData = {
        name: name.trim(),
        description: description?.trim() || '',
        ownerId: user.uid,
        memberIds: [user.uid],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: {
          allowMemberInvites: true,
          defaultLeadStage: 'Nuevo',
          timezone: 'America/Mexico_City'
        }
      };

      const docRef = await addDoc(collection(db, 'organizations'), orgData);
      logger.info('Organization created with ID:', docRef.id);
      
      const newOrg: Organization = {
        id: docRef.id,
        name: orgData.name,
        description: orgData.description,
        ownerId: orgData.ownerId,
        memberIds: orgData.memberIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        settings: orgData.settings
      };

      setOrganizations(prev => [newOrg, ...prev]);
      setCurrentOrganization(newOrg);
      
      // Store in localStorage for persistence
      localStorage.setItem('currentOrganizationId', newOrg.id);
      
      return newOrg;
    } catch (err) {
      logger.error('Error creating organization:', err);
      throw new Error('Error al crear organización');
    }
  }, [user]);

  // Add member to organization
  const addMember = useCallback(async (orgId: string, email: string, role: 'admin' | 'member' = 'member') => {
    if (!user?.uid) throw new Error('Usuario no autenticado');

    try {
      logger.debug('Adding member to organization:', { orgId, email, role });
      
      // Create invite with unique ID for link generation
      const inviteData = {
        organizationId: orgId,
        email: email.trim().toLowerCase(),
        role,
        invitedBy: user.uid,
        invitedByEmail: user.email,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending' as const
      };

      const inviteRef = await addDoc(collection(db, 'organizationInvites'), inviteData);
      logger.info('Invite created with ID:', inviteRef.id);
      
      // Generate invitation link
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const inviteLink = `${baseUrl}/invite/${inviteRef.id}`;
      
      logger.debug('Invitation link generated:', inviteLink);
      
      return { 
        inviteId: inviteRef.id, 
        inviteLink,
        success: true 
      };
    } catch (err) {
      logger.error('Error adding member:', err);
      throw new Error('Error al invitar miembro');
    }
  }, [user]);

  // Delete organization
  const deleteOrganization = useCallback(async (orgId: string, password?: string) => {
    if (!user?.uid) throw new Error('Usuario no autenticado');

    try {
      logger.debug('Deleting organization:', orgId);
      
      const orgToDelete = organizations.find(org => org.id === orgId);
      if (!orgToDelete) throw new Error('Organización no encontrada');
      
      // Only owner can delete organization
      if (orgToDelete.ownerId !== user.uid) {
        throw new Error('Solo el propietario puede eliminar la organización');
      }

      // If this is the current organization and there are other orgs, switch to another
      const otherOrgs = organizations.filter(org => org.id !== orgId);
      
      // Create batch to delete organization and related data
      const batch = writeBatch(db);
      
      // Delete organization document
      batch.delete(doc(db, 'organizations', orgId));
      
      // Delete all invites for this organization
      const invitesQuery = query(
        collection(db, 'organizationInvites'),
        where('organizationId', '==', orgId)
      );
      const invitesSnapshot = await getDocs(invitesQuery);
      invitesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Execute batch
      await batch.commit();
      
      // Update local state
      setOrganizations(prev => prev.filter(org => org.id !== orgId));
      
      // If deleting current organization, switch to another or clear
      if (currentOrganization?.id === orgId) {
        if (otherOrgs.length > 0) {
          setCurrentOrganization(otherOrgs[0]);
          localStorage.setItem('currentOrganizationId', otherOrgs[0].id);
        } else {
          setCurrentOrganization(null);
          localStorage.removeItem('currentOrganizationId');
        }
      }
      
      logger.info('Organization deleted successfully');
      return { success: true };
    } catch (err) {
      logger.error('Error deleting organization:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar organización');
    }
  }, [user, organizations, currentOrganization]);

  // Switch current organization
  const switchOrganization = useCallback((org: Organization) => {
    setCurrentOrganization(org);
    localStorage.setItem('currentOrganizationId', org.id);
  }, []);

  // Load organizations only when userId changes
  useEffect(() => {
    if (userId) {
      loadUserOrganizations();
    }
  }, [userId]);

  // Load saved organization from localStorage - memoized
  useEffect(() => {
    const savedOrgId = localStorage.getItem('currentOrganizationId');
    if (savedOrgId && organizations.length > 0) {
      const savedOrg = organizations.find(org => org.id === savedOrgId);
      if (savedOrg && savedOrg.id !== currentOrganization?.id) {
        setCurrentOrganization(savedOrg);
      }
    }
  }, [organizations, currentOrganization?.id]);

  return {
    organizations,
    currentOrganization,
    members,
    loading,
    error,
    createOrganization,
    addMember,
    deleteOrganization,
    switchOrganization,
    reload: loadUserOrganizations
  };
}