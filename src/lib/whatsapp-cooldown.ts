import { db } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { WhatsAppCooldown, WhatsAppInstance } from '@/types';

interface CooldownCheck {
  inCooldown: boolean;
  remainingMinutes?: number;
  messageCount?: number;
  nextAllowedAt?: Date;
}

interface CooldownSettings {
  enabled: boolean;
  cooldownMinutes: number;
  maxMessagesPerHour: number;
}

export class WhatsAppCooldownService {
  /**
   * Check if a contact is in cooldown period
   */
  static async checkCooldown(
    organizationId: string,
    instanceId: string,
    contactNumber: string,
    settings: CooldownSettings
  ): Promise<CooldownCheck> {
    if (!settings.enabled) {
      return { inCooldown: false };
    }

    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check for existing cooldown record
      const cooldownQuery = await db
        .collection('organizations')
        .doc(organizationId)
        .collection('whatsapp_cooldowns')
        .where('instanceId', '==', instanceId)
        .where('contactNumber', '==', contactNumber)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      if (!cooldownQuery.empty) {
        const cooldownDoc = cooldownQuery.docs[0];
        const cooldownData = cooldownDoc.data() as WhatsAppCooldown;
        
        const cooldownUntil = cooldownData.cooldownUntil.toDate();
        const lastMessageAt = cooldownData.lastMessageAt.toDate();

        // Check if still in cooldown period
        if (cooldownUntil > now) {
          const remainingMinutes = Math.ceil((cooldownUntil.getTime() - now.getTime()) / (1000 * 60));
          return {
            inCooldown: true,
            remainingMinutes,
            messageCount: cooldownData.messageCount,
            nextAllowedAt: cooldownUntil
          };
        }

        // Check hourly message limit
        if (lastMessageAt > oneHourAgo && cooldownData.messageCount >= settings.maxMessagesPerHour) {
          const nextHourStart = new Date(lastMessageAt.getTime() + 60 * 60 * 1000);
          const remainingMinutes = Math.ceil((nextHourStart.getTime() - now.getTime()) / (1000 * 60));
          
          return {
            inCooldown: true,
            remainingMinutes,
            messageCount: cooldownData.messageCount,
            nextAllowedAt: nextHourStart
          };
        }
      }

      return { inCooldown: false };
    } catch (error) {
      console.error('Error checking cooldown:', error);
      // On error, allow the message to prevent blocking legitimate communications
      return { inCooldown: false };
    }
  }

  /**
   * Record a message send and update cooldown
   */
  static async recordMessageSent(
    organizationId: string,
    instanceId: string,
    contactNumber: string,
    settings: CooldownSettings
  ): Promise<void> {
    if (!settings.enabled) {
      return;
    }

    try {
      const now = Timestamp.now();
      const cooldownUntil = Timestamp.fromDate(
        new Date(now.toDate().getTime() + settings.cooldownMinutes * 60 * 1000)
      );

      // Find existing cooldown record
      const cooldownQuery = await db
        .collection('organizations')
        .doc(organizationId)
        .collection('whatsapp_cooldowns')
        .where('instanceId', '==', instanceId)
        .where('contactNumber', '==', contactNumber)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      const oneHourAgo = new Date(now.toDate().getTime() - 60 * 60 * 1000);

      if (!cooldownQuery.empty) {
        const cooldownDoc = cooldownQuery.docs[0];
        const cooldownData = cooldownDoc.data() as WhatsAppCooldown;
        const lastMessageAt = cooldownData.lastMessageAt.toDate();

        // If last message was within the hour, increment count
        const messageCount = lastMessageAt > oneHourAgo ? cooldownData.messageCount + 1 : 1;

        await cooldownDoc.ref.update({
          lastMessageAt: now,
          messageCount,
          cooldownUntil,
          createdAt: now // Update creation time for this cooldown period
        });
      } else {
        // Create new cooldown record
        const newCooldown: Omit<WhatsAppCooldown, 'id'> = {
          organizationId,
          instanceId,
          contactNumber,
          lastMessageAt: now,
          messageCount: 1,
          cooldownUntil,
          createdAt: now
        };

        await db
          .collection('organizations')
          .doc(organizationId)
          .collection('whatsapp_cooldowns')
          .add(newCooldown);
      }
    } catch (error) {
      console.error('Error recording message sent:', error);
      // Don't throw error to prevent blocking message sending
    }
  }

  /**
   * Clean up expired cooldown records (to be called periodically)
   */
  static async cleanupExpiredCooldowns(organizationId: string): Promise<number> {
    try {
      const now = Timestamp.now();
      const twentyFourHoursAgo = Timestamp.fromDate(
        new Date(now.toDate().getTime() - 24 * 60 * 60 * 1000)
      );

      const expiredQuery = await db
        .collection('organizations')
        .doc(organizationId)
        .collection('whatsapp_cooldowns')
        .where('cooldownUntil', '<', twentyFourHoursAgo)
        .get();

      let deletedCount = 0;
      const batch = db.batch();

      expiredQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
      }

      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired cooldowns:', error);
      return 0;
    }
  }

  /**
   * Get cooldown statistics for an organization
   */
  static async getCooldownStats(organizationId: string, instanceId?: string) {
    try {
      let query = db
        .collection('organizations')
        .doc(organizationId)
        .collection('whatsapp_cooldowns');

      if (instanceId) {
        query = query.where('instanceId', '==', instanceId);
      }

      const snapshot = await query.get();
      const now = new Date();
      
      let activeCooldowns = 0;
      let totalContacts = 0;
      const contactStats: { [contact: string]: number } = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data() as WhatsAppCooldown;
        totalContacts++;

        const cooldownUntil = data.cooldownUntil.toDate();
        if (cooldownUntil > now) {
          activeCooldowns++;
        }

        const contact = data.contactNumber;
        contactStats[contact] = (contactStats[contact] || 0) + data.messageCount;
      });

      return {
        totalContacts,
        activeCooldowns,
        contactStats,
        averageMessagesPerContact: totalContacts > 0 
          ? Object.values(contactStats).reduce((a, b) => a + b, 0) / totalContacts 
          : 0
      };
    } catch (error) {
      console.error('Error getting cooldown stats:', error);
      return {
        totalContacts: 0,
        activeCooldowns: 0,
        contactStats: {},
        averageMessagesPerContact: 0
      };
    }
  }

  /**
   * Check if sending is allowed within business hours
   */
  static isWithinBusinessHours(
    instance: WhatsAppInstance,
    timezone: string = 'America/Panama'
  ): boolean {
    if (!instance.settings.businessHours.enabled) {
      return true; // Always allow if business hours are not enabled
    }

    try {
      const now = new Date();
      const timeInTimezone = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).formatToParts(now);

      const currentDay = timeInTimezone.find(part => part.type === 'weekday')?.value.toLowerCase();
      const currentHour = parseInt(timeInTimezone.find(part => part.type === 'hour')?.value || '0');
      const currentMinute = parseInt(timeInTimezone.find(part => part.type === 'minute')?.value || '0');
      const currentTime = currentHour * 60 + currentMinute; // Convert to minutes

      // Find the schedule for current day
      const daySchedule = instance.settings.businessHours.schedule.find(
        schedule => schedule.day === currentDay && schedule.enabled
      );

      if (!daySchedule) {
        return false; // Day not enabled for business
      }

      // Parse start and end times
      const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
      const [endHour, endMinute] = daySchedule.end.split(':').map(Number);
      
      const startTime = startHour * 60 + startMinute;
      const endTime = endHour * 60 + endMinute;

      return currentTime >= startTime && currentTime <= endTime;
    } catch (error) {
      console.error('Error checking business hours:', error);
      return true; // On error, allow sending
    }
  }

  /**
   * Get next business hour for messaging
   */
  static getNextBusinessHour(
    instance: WhatsAppInstance,
    timezone: string = 'America/Panama'
  ): Date | null {
    if (!instance.settings.businessHours.enabled) {
      return null;
    }

    try {
      const now = new Date();
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      
      // Check each day starting from today
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
        const dayName = daysOfWeek[checkDate.getDay()];
        
        const daySchedule = instance.settings.businessHours.schedule.find(
          schedule => schedule.day === dayName && schedule.enabled
        );

        if (daySchedule) {
          const [startHour, startMinute] = daySchedule.start.split(':').map(Number);
          const nextBusinessTime = new Date(checkDate);
          nextBusinessTime.setHours(startHour, startMinute, 0, 0);

          // If it's today and the business hour hasn't passed yet, return it
          // If it's a future day, return the start of business hours
          if (dayOffset > 0 || nextBusinessTime > now) {
            return nextBusinessTime;
          }
        }
      }

      return null; // No business hours found in the next week
    } catch (error) {
      console.error('Error getting next business hour:', error);
      return null;
    }
  }
}