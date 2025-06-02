"use client";
import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updatePassword,
  updateEmail,
  deleteUser,
  sendPasswordResetEmail,
  sendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';

const firebaseAuth = getAuth(app);

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  role: 'user' | 'admin';
  isActive: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load user profile from Firestore
  const loadUserProfile = useCallback(async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    try {
      const result = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      // Update profile with display name
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Create user document in Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: displayName || result.user.displayName || '',
        photoURL: result.user.photoURL || '',
        phoneNumber: result.user.phoneNumber || '',
        emailVerified: result.user.emailVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        role: 'user',
        isActive: true
      };
      
      await setDoc(doc(db, 'users', result.user.uid), userProfile);
      
      // Send email verification
      await sendEmailVerification(result.user);
      
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      
      // Check if user document exists, create if not
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        const userProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          phoneNumber: result.user.phoneNumber || '',
          emailVerified: result.user.emailVerified,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          role: 'user',
          isActive: true
        };
        
        await setDoc(doc(db, 'users', result.user.uid), userProfile);
      }
      
      return { success: true, user: result.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  // Sign out
  const logout = useCallback(async () => {
    try {
      await signOut(firebaseAuth);
      setUserProfile(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
      // Update Firebase Auth profile
      if (updates.displayName !== undefined || updates.photoURL !== undefined) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL
        });
      }
      
      // Update email if changed
      if (updates.email && updates.email !== user.email) {
        await updateEmail(user, updates.email);
      }
      
      // Update Firestore document
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      // Reload profile
      await loadUserProfile(user.uid);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user, loadUserProfile]);

  // Change password
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) return { success: false, error: 'No user logged in' };
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user]);

  // Delete user account
  const deleteAccount = useCallback(async (password: string) => {
    if (!user || !user.email) return { success: false, error: 'No user logged in' };
    
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // Delete user from Firebase Auth
      await deleteUser(user);
      
      setUserProfile(null);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user]);

  // Send email verification
  const sendVerificationEmail = useCallback(async () => {
    if (!user) return { success: false, error: 'No user logged in' };
    
    try {
      await sendEmailVerification(user);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await loadUserProfile(currentUser.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
      setInitialLoadDone(true);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  return {
    user,
    userProfile,
    loading,
    initialLoadDone,
    authInstance: firebaseAuth,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    changePassword,
    deleteAccount,
    sendVerificationEmail
  };
}