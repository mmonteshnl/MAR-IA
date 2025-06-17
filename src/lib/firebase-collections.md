# Firebase Collections Structure for WhatsApp Integration

## Collection: `whatsapp_instances`
**Path:** `/organizations/{organizationId}/whatsapp_instances/{instanceId}`

```typescript
{
  id: string;
  organizationId: string;
  instanceName: string;
  webhookUrl: string;
  apiKey: string;
  isActive: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastStatusCheck: Timestamp;
  phoneNumber?: string;
  qrCode?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  settings: {
    autoReply: boolean;
    businessHours: {
      enabled: boolean;
      timezone: string;
      schedule: Array<{
        day: string;
        start: string;
        end: string;
        enabled: boolean;
      }>;
    };
    antiSpam: {
      enabled: boolean;
      cooldownMinutes: number;
      maxMessagesPerHour: number;
    };
  };
}
```

## Collection: `whatsapp_conversations`
**Path:** `/organizations/{organizationId}/whatsapp_conversations/{conversationId}`

```typescript
{
  id: string;
  organizationId: string;
  instanceId: string;
  leadId: string;
  contactNumber: string;
  contactName?: string;
  status: 'active' | 'archived' | 'blocked';
  lastMessageAt: Timestamp;
  messageCount: number;
  unreadCount: number;
  tags: string[];
  assignedTo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata: {
    firstContact: Timestamp;
    lastActivity: Timestamp;
    businessType?: string;
    leadStage?: string;
    customerSegment?: string;
  };
}
```

## Collection: `whatsapp_messages`
**Path:** `/organizations/{organizationId}/whatsapp_conversations/{conversationId}/messages/{messageId}`

```typescript
{
  id: string;
  conversationId: string;
  organizationId: string;
  instanceId: string;
  messageId: string; // Evolution API message ID
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact';
  direction: 'inbound' | 'outbound';
  content: {
    text?: string;
    media?: {
      url: string;
      mimetype: string;
      filename?: string;
      caption?: string;
    };
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    contact?: {
      name: string;
      phone: string;
      email?: string;
    };
  };
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Timestamp;
  fromNumber: string;
  toNumber: string;
  isFromBot: boolean;
  replyToMessageId?: string;
  createdAt: Timestamp;
  metadata: {
    campaignId?: string;
    templateName?: string;
    userAgent?: string;
    ipAddress?: string;
    deliveredAt?: Timestamp;
    readAt?: Timestamp;
    failureReason?: string;
  };
}
```

## Collection: `whatsapp_cooldowns`
**Path:** `/organizations/{organizationId}/whatsapp_cooldowns/{cooldownId}`

```typescript
{
  id: string;
  organizationId: string;
  contactNumber: string;
  instanceId: string;
  lastMessageAt: Timestamp;
  messageCount: number;
  cooldownUntil: Timestamp;
  createdAt: Timestamp;
}
```

## Indexes Required

### whatsapp_conversations
- `organizationId` + `instanceId` + `status`
- `organizationId` + `leadId`
- `organizationId` + `contactNumber`
- `lastMessageAt` (descending)

### whatsapp_messages
- `organizationId` + `conversationId` + `timestamp`
- `organizationId` + `instanceId` + `direction`
- `organizationId` + `fromNumber` + `timestamp`

### whatsapp_cooldowns
- `organizationId` + `contactNumber` + `instanceId`
- `cooldownUntil` (for cleanup)

## Security Rules

```javascript
// Allow read/write access to whatsapp data for authenticated users within their organization
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /organizations/{organizationId}/whatsapp_instances/{instanceId} {
      allow read, write: if request.auth != null && 
        resource.data.organizationId == organizationId &&
        isUserInOrganization(request.auth.uid, organizationId);
    }
    
    match /organizations/{organizationId}/whatsapp_conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        resource.data.organizationId == organizationId &&
        isUserInOrganization(request.auth.uid, organizationId);
    }
    
    match /organizations/{organizationId}/whatsapp_conversations/{conversationId}/messages/{messageId} {
      allow read, write: if request.auth != null && 
        resource.data.organizationId == organizationId &&
        isUserInOrganization(request.auth.uid, organizationId);
    }
    
    match /organizations/{organizationId}/whatsapp_cooldowns/{cooldownId} {
      allow read, write: if request.auth != null && 
        resource.data.organizationId == organizationId &&
        isUserInOrganization(request.auth.uid, organizationId);
    }
  }
}
```