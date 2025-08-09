import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Auth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import { User } from '../models/user.model';
import { GOOGLE_AUTH_CONFIG } from '../config/google-auth.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private authInitialized = new BehaviorSubject<boolean>(false);
  public currentUser$ = this.currentUserSubject.asObservable();
  public authInitialized$ = this.authInitialized.asObservable();

  constructor() {
    this.initializeGoogleAuth();
    this.initializeAuth();
  }

  private async initializeGoogleAuth() {
    try {
      // Initialize Google Auth plugin to prevent crashes
      console.log('Initializing Google Auth...');
      console.log('Using Client ID:', GOOGLE_AUTH_CONFIG.CLIENT_ID);

      await GoogleAuth.initialize({
        clientId: GOOGLE_AUTH_CONFIG.CLIENT_ID,
        scopes: GOOGLE_AUTH_CONFIG.SCOPES,
        grantOfflineAccess: GOOGLE_AUTH_CONFIG.GRANT_OFFLINE_ACCESS,
      });

      console.log('Google Auth initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Auth:', error);
      throw new Error("Impossible d'initialiser Google Auth: " + error.message);
    }
  }

  private initializeAuth() {
    try {
      // Firebase v9+ has persistence enabled by default for web
      // Listen to Firebase auth state changes
      onAuthStateChanged(this.auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
          };
          this.currentUserSubject.next(user);
          console.log('User authenticated:', user.email);
        } else {
          this.currentUserSubject.next(null);
          console.log('User not authenticated');
        }

        // Mark auth as initialized after first check
        if (!this.authInitialized.value) {
          this.authInitialized.next(true);
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.authInitialized.next(true); // Mark as initialized even if there's an error
    }
  }

  async waitForAuthInitialization(): Promise<void> {
    return new Promise((resolve) => {
      if (this.authInitialized.value) {
        resolve();
      } else {
        const subscription = this.authInitialized$.subscribe((initialized) => {
          if (initialized) {
            subscription.unsubscribe();
            resolve();
          }
        });
      }
    });
  }

  async signInWithGoogle(): Promise<User | null> {
    try {
      console.log('Starting Google Sign-In...');

      // Check if we're on a platform that supports Google Auth
      if (!Capacitor.isNativePlatform()) {
        throw new Error('Google Sign-In seulement disponible sur mobile');
      }

      // First, ensure Google Auth is initialized
      try {
        await this.initializeGoogleAuth();
      } catch (initError) {
        console.error('Google Auth initialization failed:', initError);

        // Check if it's a configuration error
        if (initError.message?.includes('Configuration client ID invalide')) {
          throw new Error(
            'Configuration Google incomplète. Veuillez configurer le client ID dans Firebase Console.'
          );
        }

        throw new Error("Erreur d'initialisation: " + initError.message);
      }

      // Add a safety check before calling signIn
      if (!GoogleAuth) {
        throw new Error('Google Auth plugin non disponible');
      }

      console.log('Attempting Google Sign-In...');

      // Add timeout to prevent hanging
      const signInPromise = GoogleAuth.signIn();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 30000)
      );

      const googleUser = (await Promise.race([
        signInPromise,
        timeoutPromise,
      ])) as any;
      console.log('Google Sign-In result:', googleUser);

      if (googleUser && googleUser.email) {
        // Sign in to Firebase with Google credentials
        try {
          if (googleUser.authentication?.idToken) {
            // Use Google credentials to sign in to Firebase
            const credential = GoogleAuthProvider.credential(
              googleUser.authentication.idToken,
              googleUser.authentication.accessToken
            );

            const firebaseResult = await signInWithCredential(
              this.auth,
              credential
            );
            console.log(
              'Firebase sign-in successful:',
              firebaseResult.user.email
            );

            // Firebase auth state change will handle user update
            return {
              uid: firebaseResult.user.uid,
              email: firebaseResult.user.email || '',
              displayName: firebaseResult.user.displayName || '',
              photoURL: firebaseResult.user.photoURL || '',
            };
          } else {
            // Fallback: create user directly from Google data (without Firebase)
            console.log('No ID token available, using Google data directly');
            const user: User = {
              uid: googleUser.id || googleUser.email,
              email: googleUser.email,
              displayName: googleUser.name || '',
              photoURL: googleUser.imageUrl || '',
            };

            // Update the current user state
            this.currentUserSubject.next(user);
            console.log(
              'User signed in successfully (without Firebase):',
              user
            );
            return user;
          }
        } catch (firebaseError) {
          console.error('Firebase sign-in error:', firebaseError);
          // Fallback to local user creation
          const user: User = {
            uid: googleUser.id || googleUser.email,
            email: googleUser.email,
            displayName: googleUser.name || '',
            photoURL: googleUser.imageUrl || '',
          };

          // Update the current user state
          this.currentUserSubject.next(user);
          console.log('User signed in successfully (fallback):', user);
          return user;
        }
      } else {
        throw new Error('Aucune donnée utilisateur reçue de Google');
      }
    } catch (error: any) {
      console.error('Detailed Google Sign-In error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);

      // Provide specific error messages without crashing
      let errorMessage = 'Erreur de connexion inconnue';

      // Check for specific error codes first
      if (
        error.code === '12500' ||
        error.message?.includes('12500') ||
        error.message?.includes('DEVELOPER_ERROR')
      ) {
        errorMessage =
          'ERREUR SHA-1: Ajoutez le SHA-1 fingerprint dans Firebase Console → Project Settings → Android app';
      } else if (
        error.code === '12501' ||
        error.message?.includes('12501') ||
        error.message?.includes('SIGN_IN_CANCELLED')
      ) {
        errorMessage = "Connexion annulée par l'utilisateur.";
      } else if (
        error.code === '7' ||
        error.message?.includes('7') ||
        error.message?.includes('NETWORK_ERROR')
      ) {
        errorMessage = 'Erreur de réseau. Vérifiez votre connexion internet.';
      } else if (error.code === '10' || error.message?.includes('10')) {
        errorMessage =
          'Configuration du certificat SHA-1 requise dans Firebase Console.';
      } else if (error.message?.includes('Configuration Google incomplète')) {
        errorMessage =
          'Configuration Google incomplète. Contactez le développeur pour configurer Firebase.';
      } else if (error.message?.includes('Configuration client ID invalide')) {
        errorMessage =
          'Client ID Google non configuré. Configuration Firebase requise.';
      } else if (error.message?.includes('Timeout')) {
        errorMessage = "Délai d'attente dépassé. Veuillez réessayer.";
      } else if (error.message?.includes('Google Auth plugin non disponible')) {
        errorMessage = 'Plugin Google Auth non installé correctement.';
      } else if (error.message?.includes("Impossible d'initialiser")) {
        errorMessage = error.message;
      } else {
        // Include the actual error for debugging
        errorMessage = `Erreur: ${error.code || 'unknown'} - ${
          error.message || 'Problème de connexion'
        }`;
      }

      throw new Error(errorMessage);
    }
  }

  async signOut(): Promise<void> {
    try {
      // Sign out from Firebase
      await signOut(this.auth);

      // Sign out from Google Auth if on native platform
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  async isAuthenticatedAsync(): Promise<boolean> {
    await this.waitForAuthInitialization();
    return this.isAuthenticated();
  }
}
