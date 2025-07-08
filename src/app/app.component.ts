import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './services/firebase-database.service';
import { DashboardService } from './services/dashboard.service';
import { AuthService } from './services/auth.service';
import { PushNotificationService } from './services/push-notification.service';
import { BackgroundTaskService } from './services/background-task.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private databaseService: DatabaseService,
    private dashboardService: DashboardService,
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    private backgroundTaskService: BackgroundTaskService
  ) {}

  async ngOnInit() {
    // Initialize app services
    await this.initializeApp();
  }

  private async initializeApp() {
    try {
      // Wait for Firebase auth to initialize
      await this.authService.waitForAuthInitialization();

      // Firebase is already initialized in main.ts
      // Just initialize dashboard daily check
      await this.dashboardService.initializeDailyCheck();

      // Initialize push notifications
      await this.pushNotificationService.initializeNotifications();

      // Initialize background tasks
      // BackgroundTaskService initializes itself in the constructor

      console.log('App initialization completed with notifications');
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }
}
