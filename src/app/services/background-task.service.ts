import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { PushNotificationService } from './push-notification.service';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class BackgroundTaskService {
  private readonly UPDATE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private intervalId: any;

  constructor(
    private platform: Platform,
    private pushNotificationService: PushNotificationService,
    private configService: ConfigService
  ) {
    this.initializeBackgroundTasks();
  }

  /**
   * Initialize background tasks
   */
  private async initializeBackgroundTasks(): Promise<void> {
    await this.platform.ready();

    // Set up periodic notification updates
    this.schedulePeriodicUpdates();

    // Listen for app state changes
    this.setupAppStateListeners();
  }

  /**
   * Schedule periodic notification updates
   */
  private schedulePeriodicUpdates(): void {
    // Clear any existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Update notifications every 24 hours
    this.intervalId = setInterval(async () => {
      console.log('Performing periodic notification update...');
      await this.updateNotifications();
    }, this.UPDATE_INTERVAL);

    // Initial update
    setTimeout(() => {
      this.updateNotifications();
    }, 5000); // Wait 5 seconds after startup
  }

  /**
   * Set up listeners for app state changes
   */
  private setupAppStateListeners(): void {
    // Listen for when app becomes active
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        console.log('App became active, updating notifications...');
        setTimeout(() => {
          this.updateNotifications();
        }, 1000);
      }
    });

    // Listen for app pause/resume events (mobile)
    document.addEventListener('pause', () => {
      console.log('App paused');
    });

    document.addEventListener('resume', () => {
      console.log('App resumed, updating notifications...');
      setTimeout(() => {
        this.updateNotifications();
      }, 1000);
    });

    // Listen for configuration changes
    this.setupConfigurationListener();
  }

  /**
   * Set up listener for configuration changes
   */
  private setupConfigurationListener(): void {
    // Check for config changes periodically
    setInterval(() => {
      this.checkForConfigChanges();
    }, 60000); // Check every minute
  }

  /**
   * Check if configuration has changed and update notifications accordingly
   */
  private async checkForConfigChanges(): Promise<void> {
    try {
      const currentConfig = this.configService.getConfig();
      const lastKnownConfig = this.getLastKnownConfig();

      if (this.hasConfigurationChanged(currentConfig, lastKnownConfig)) {
        console.log('Configuration changed, updating notifications...');
        await this.updateNotifications();
        this.saveLastKnownConfig(currentConfig);
      }
    } catch (error) {
      console.error('Error checking configuration changes:', error);
    }
  }

  /**
   * Check if configuration has changed
   */
  private hasConfigurationChanged(current: any, previous: any): boolean {
    if (!previous) return true;

    return (
      current.enableNotifications !== previous.enableNotifications ||
      current.notificationDays !== previous.notificationDays ||
      JSON.stringify(current.notificationHours) !==
        JSON.stringify(previous.notificationHours)
    );
  }

  /**
   * Update notifications
   */
  private async updateNotifications(): Promise<void> {
    try {
      const config = this.configService.getConfig();

      if (config.enableNotifications) {
        await this.pushNotificationService.updateNotifications();
        console.log('Background notification update completed');
      } else {
        await this.pushNotificationService.clearAllNotifications();
        console.log(
          'Notifications disabled, cleared all pending notifications'
        );
      }
    } catch (error) {
      console.error('Error updating notifications in background:', error);
    }
  }

  /**
   * Get last known configuration
   */
  private getLastKnownConfig(): any {
    try {
      const stored = localStorage.getItem('last_known_config');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save last known configuration
   */
  private saveLastKnownConfig(config: any): void {
    try {
      localStorage.setItem('last_known_config', JSON.stringify(config));
    } catch (error) {
      console.error('Error saving last known config:', error);
    }
  }

  /**
   * Manually trigger notification update
   */
  async triggerUpdate(): Promise<void> {
    console.log('Manually triggering notification update...');
    await this.updateNotifications();
  }

  /**
   * Stop background tasks
   */
  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
