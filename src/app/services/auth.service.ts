import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from '@angular/fire/auth';
import { User } from '../models/user.model';

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
    this.initializeAuth();
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
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const result = await signInWithPopup(this.auth, provider);
      const firebaseUser = result.user;

      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
        };
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(this.auth);
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
