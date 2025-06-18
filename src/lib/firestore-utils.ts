/**
 * Utilities for handling Firestore data conversion safely
 */

/**
 * Safely converts Firestore timestamp to Date
 * Handles both Firestore Timestamp objects and regular Date objects
 */
export function safeTimestampToDate(timestamp: any): Date {
  if (!timestamp) {
    return new Date();
  }
  
  // If it's already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }
  
  // If it's a Firestore Timestamp with toDate method
  if (timestamp && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate();
    } catch (error) {
      console.warn('Error converting Firestore timestamp:', error);
      return new Date();
    }
  }
  
  // If it's an object with seconds property (Firestore timestamp structure)
  if (timestamp && typeof timestamp.seconds === 'number') {
    return new Date(timestamp.seconds * 1000);
  }
  
  // If it's a string that can be parsed
  if (typeof timestamp === 'string') {
    const parsedDate = new Date(timestamp);
    return isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
  }
  
  // If it's a number (Unix timestamp)
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  
  // Fallback to current date
  console.warn('Could not convert timestamp, using current date:', timestamp);
  return new Date();
}

/**
 * Safely processes Firestore document data, converting timestamps to dates
 */
export function processFirestoreDoc(doc: any): any {
  if (!doc || !doc.data) {
    return null;
  }
  
  const data = doc.data();
  const processed = { ...data };
  
  // Common timestamp fields to convert
  const timestampFields = ['createdAt', 'updatedAt', 'lastMessageAt', 'lastActivity', 'timestamp'];
  
  timestampFields.forEach(field => {
    if (processed[field]) {
      processed[field] = safeTimestampToDate(processed[field]);
    }
  });
  
  return {
    id: doc.id,
    ...processed
  };
}

/**
 * Processes an array of Firestore documents
 */
export function processFirestoreDocs(docs: any[]): any[] {
  return docs.map(doc => processFirestoreDoc(doc));
}