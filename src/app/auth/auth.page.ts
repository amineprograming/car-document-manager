import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ToastController,
  LoadingController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  carSport,
  logoGoogle,
  car,
  documentText,
  notifications,
  search,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { GOOGLE_AUTH_CONFIG } from '../config/google-auth.config';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CommonModule,
    FormsModule,
  ],
})
export class AuthPage implements OnInit {
  loading = false;
  debugInfo: any = null;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {
    addIcons({
      carSport,
      logoGoogle,
      car,
      documentText,
      notifications,
      search,
    });
  }

  ngOnInit() {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/tabs/dashboard']);
    }
  }

  async signInWithGoogle() {
    this.loading = true;
    const loading = await this.loadingController.create({
      message: 'Connexion en cours...',
    });
    await loading.present();

    try {
      const user = await this.authService.signInWithGoogle();
      if (user) {
        await this.showToast('Connexion réussie!', 'success');
        this.router.navigate(['/tabs/dashboard']);
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      this.errorMessage = error.message || 'Erreur inconnue';
      await this.showToast(
        error.message || 'Erreur lors de la connexion. Veuillez réessayer.',
        'danger'
      );
    } finally {
      this.loading = false;
      await loading.dismiss();
    }
  }

  async showDebugInfo() {
    this.debugInfo = {
      platform: Capacitor.isNativePlatform() ? 'Mobile (Native)' : 'Web',
      clientConfigured: !GOOGLE_AUTH_CONFIG.CLIENT_ID.includes(
        '603137695665-web.apps.googleusercontent.com'
      ),
      pluginAvailable: typeof GoogleAuth !== 'undefined',
      clientId: GOOGLE_AUTH_CONFIG.CLIENT_ID,
    };
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
