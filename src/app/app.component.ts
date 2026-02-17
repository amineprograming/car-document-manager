import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fingerPrintOutline } from 'ionicons/icons';
import { DatabaseService } from './services/firebase-database.service';
import { DashboardService } from './services/dashboard.service';
import { AuthService } from './services/auth.service';
import { PushNotificationService } from './services/push-notification.service';
import { BackgroundTaskService } from './services/background-task.service';
import { BiometricService } from './services/biometric.service';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, IonApp, IonRouterOutlet, IonIcon],
})
export class AppComponent implements OnInit {
  isLocked = true;

  constructor(
    private databaseService: DatabaseService,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    private backgroundTaskService: BackgroundTaskService,
    private biometricService: BiometricService,
  ) {
    // Register icons
    addIcons({ fingerPrintOutline });
  }

  async ngOnInit() {
    // Initialize app services
    await this.initializeApp();
  }

  private async initializeApp() {
    try {
      // Perform biometric authentication first
      await this.authenticate();

      // Wait for Firebase auth to initialize
      await this.authService.waitForAuthInitialization();

      // Firebase is already initialized in main.ts
      // Just initialize dashboard daily check
      await this.dashboardService.initializeDailyCheck();

      // Initialize push notifications
      await this.pushNotificationService.initializeNotifications();

      // Initialize background tasks
      // BackgroundTaskService initializes itself in the constructor

      // Listen for app resume to re-authenticate
      this.setupAppStateListener();

      console.log('App initialization completed with notifications');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  /**
   * Setup listener for app state changes (resume from background)
   */
  private setupAppStateListener() {
    if (Capacitor.isNativePlatform()) {
      App.addListener('appStateChange', async ({ isActive }) => {
        if (isActive && !this.isLocked) {
          // App became active, re-authenticate
          this.isLocked = true;
          await this.authenticate();
        }
      });
    }
  }

  /**
   * Perform biometric authentication
   */
  async authenticate() {
    const success = await this.biometricService.authenticate();
    if (success) {
      this.isLocked = false;
    }
  }
}
