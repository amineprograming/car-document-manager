import { Injectable } from '@angular/core';
import {
  LocalNotifications,
  ScheduleOptions,
} from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { ConfigService, AppConfig } from './config.service';
import { DatabaseService } from './firebase-database.service';
import { Document } from '../models/document.model';

export interface NotificationSchedule {
  id: number;
  documentId: string;
  scheduledFor: Date;
  notificationHour: number;
}

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly STORAGE_KEY = 'scheduled_notifications';
  private notificationIdCounter = 1;

  constructor(
    private configService: ConfigService,
    private databaseService: DatabaseService,
  ) {
    // Inject DatabaseService to ConfigService to avoid circular dependency
    this.configService.setDatabaseService(this.databaseService);
    this.initializeNotifications();
  }

  /**
   * Initialize notifications and request permissions
   */
  async initializeNotifications(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        // Request permissions for notifications
        const permissionStatus = await LocalNotifications.requestPermissions();
        console.log(
          'Notification permission status:',
          permissionStatus.display,
        );

        // Listen for notification actions
        await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (notification) => {
            console.log('Notification action performed:', notification);
            // Handle notification tap - could navigate to documents page
          },
        );

        // Start the notification scheduling process
        await this.scheduleAllNotifications();

        // Also check and show immediate notifications for documents that need attention NOW
        await this.checkAndShowImmediateNativeNotifications();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    } else {
      console.log('Notifications are only available on native platforms');
      // For web development, we can simulate notifications
      this.simulateWebNotifications();
    }
  }

  /**
   * Schedule notifications for all active documents
   */
  async scheduleAllNotifications(): Promise<void> {
    try {
      const config = this.configService.getConfig();

      if (!config.enableNotifications) {
        console.log('Notifications are disabled');
        return;
      }

      // Clear existing notifications
      await this.clearAllNotifications();

      // Get all documents
      const documents = await this.databaseService.getDocuments();

      // Filter active documents that need notifications
      const activeDocuments = documents.filter(
        (doc) =>
          doc.documentActive && this.shouldScheduleNotification(doc, config),
      );

      console.log(
        `Scheduling notifications for ${activeDocuments.length} documents`,
      );

      // Schedule notifications for each document and each configured hour
      for (const document of activeDocuments) {
        await this.scheduleDocumentNotifications(document, config);
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  /**
   * Check if a document should have notifications scheduled
   */
  private shouldScheduleNotification(
    document: Document,
    config: AppConfig,
  ): boolean {
    // Only schedule notifications for active documents
    if (!document.documentActive) {
      return false;
    }

    const now = new Date();
    const expirationDate =
      typeof document.dateFin === 'string'
        ? new Date(document.dateFin)
        : document.dateFin;

    // Calculate days until expiration
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Schedule if within the notification window and not yet expired
    return diffDays > 0 && diffDays <= config.notificationDays;
  }

  /**
   * Schedule notifications for a specific document
   * Schedules notifications for ALL days within the notification window at configured hours
   * This ensures notifications fire even when app is closed
   */
  private async scheduleDocumentNotifications(
    document: Document,
    config: AppConfig,
  ): Promise<void> {
    const expirationDate =
      typeof document.dateFin === 'string'
        ? new Date(document.dateFin)
        : document.dateFin;

    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Schedule notifications for each day from now until expiration (within notificationDays window)
    const daysToSchedule = Math.min(
      daysUntilExpiration,
      config.notificationDays,
    );

    for (let dayOffset = 0; dayOffset < daysToSchedule; dayOffset++) {
      const notificationDay = new Date(now);
      notificationDay.setDate(notificationDay.getDate() + dayOffset);

      const remainingDays = daysUntilExpiration - dayOffset;

      // Schedule for each configured hour on this day
      for (const hour of config.notificationHours) {
        const scheduledDate = new Date(notificationDay);
        scheduledDate.setHours(hour, 0, 0, 0);

        // Only schedule if the time is in the future
        if (scheduledDate.getTime() > now.getTime()) {
          await this.scheduleNotificationForDateTime(
            document,
            scheduledDate,
            hour,
            remainingDays,
          );
        }
      }
    }
  }

  /**
   * Schedule a notification for a specific date and hour
   */
  private async scheduleNotificationForDateTime(
    document: Document,
    notificationDate: Date,
    hour: number,
    daysUntilExpiration: number,
  ): Promise<void> {
    try {
      const notificationId = this.generateNotificationId();

      // Set the specific hour for notification
      const scheduledDate = new Date(notificationDate);
      scheduledDate.setHours(hour, 0, 0, 0);

      // Only schedule if the time is in the future
      if (scheduledDate.getTime() <= Date.now()) {
        return; // Skip this notification as it's in the past
      }

      const notificationOptions: ScheduleOptions = {
        notifications: [
          {
            id: notificationId,
            title: '⚠️ Document bientôt expiré',
            body: this.generateNotificationMessage(
              document,
              daysUntilExpiration,
            ),
            schedule: {
              at: scheduledDate,
              allowWhileIdle: true, // Important: ensures notification fires even in Doze mode
            },
            sound: 'default',
            smallIcon: 'ic_stat_icon_config_sample',
            largeIcon: 'ic_launcher',
            attachments: [],
            actionTypeId: 'DOCUMENT_EXPIRY',
            extra: {
              documentId: document.id,
              documentType: document.typeDocument,
              matricule: document.matriculeCar,
              daysUntilExpiration: daysUntilExpiration,
              scheduledFor: scheduledDate.toISOString(),
            },
          },
        ],
      };

      await LocalNotifications.schedule(notificationOptions);

      // Store the notification schedule for tracking
      this.saveNotificationSchedule({
        id: notificationId,
        documentId: document.id || '',
        scheduledFor: scheduledDate,
        notificationHour: hour,
      });

      console.log(
        `Scheduled notification ${notificationId} for document ${
          document.typeDocument
        } (${
          document.matriculeCar
        }) on ${scheduledDate.toLocaleDateString()} at ${hour}:00 (${daysUntilExpiration} days until expiration)`,
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  /**
   * Generate notification message based on document and days until expiration
   */
  private generateNotificationMessage(
    document: Document,
    daysUntilExpiration: number,
  ): string {
    const vehicleInfo = document.matriculeCar;
    const docType = document.typeDocument;

    if (daysUntilExpiration === 1) {
      return `${docType} pour ${vehicleInfo} expire demain !`;
    } else if (daysUntilExpiration <= 7) {
      return `${docType} pour ${vehicleInfo} expire dans ${daysUntilExpiration} jours`;
    } else {
      return `${docType} pour ${vehicleInfo} expire dans ${daysUntilExpiration} jours`;
    }
  }

  /**
   * Clear all scheduled notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        const ids = pending.notifications.map((n) => n.id);
        await LocalNotifications.cancel({
          notifications: ids.map((id) => ({ id })),
        });
        console.log(`Cleared ${ids.length} pending notifications`);
      }

      // Clear stored schedules
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Update notifications when documents or settings change
   */
  async updateNotifications(): Promise<void> {
    console.log('Updating notifications...');
    await this.scheduleAllNotifications();
  }

  /**
   * Cancel notifications for a specific document
   */
  async cancelDocumentNotifications(documentId: string): Promise<void> {
    try {
      const schedules = this.getStoredNotificationSchedules();
      const documentSchedules = schedules.filter(
        (s) => s.documentId === documentId,
      );

      if (documentSchedules.length > 0) {
        const ids = documentSchedules.map((s) => s.id);
        await LocalNotifications.cancel({
          notifications: ids.map((id) => ({ id })),
        });

        // Remove from stored schedules
        const remainingSchedules = schedules.filter(
          (s) => s.documentId !== documentId,
        );
        this.saveAllNotificationSchedules(remainingSchedules);

        console.log(
          `Cancelled ${ids.length} notifications for document ${documentId}`,
        );
      }
    } catch (error) {
      console.error('Error cancelling document notifications:', error);
    }
  }

  /**
   * Get pending notifications count
   */
  async getPendingNotificationsCount(): Promise<number> {
    try {
      const pending = await LocalNotifications.getPending();
      return pending.notifications.length;
    } catch (error) {
      console.error('Error getting pending notifications count:', error);
      return 0;
    }
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): number {
    return this.notificationIdCounter++;
  }

  /**
   * Save notification schedule to storage
   */
  private saveNotificationSchedule(schedule: NotificationSchedule): void {
    const schedules = this.getStoredNotificationSchedules();
    schedules.push(schedule);
    this.saveAllNotificationSchedules(schedules);
  }

  /**
   * Get stored notification schedules
   */
  private getStoredNotificationSchedules(): NotificationSchedule[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading notification schedules:', error);
      return [];
    }
  }

  /**
   * Save all notification schedules
   */
  private saveAllNotificationSchedules(
    schedules: NotificationSchedule[],
  ): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('Error saving notification schedules:', error);
    }
  }

  /**
   * Simulate web notifications for development
   */
  private simulateWebNotifications(): void {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Web notifications enabled for development');
          // Start checking for notification times
          this.startWebNotificationChecker();
        }
      });
    }
  }

  /**
   * Start a periodic checker for web notifications
   */
  private startWebNotificationChecker(): void {
    // Check every minute if we should show a notification
    setInterval(async () => {
      await this.checkAndShowWebNotifications();
    }, 60000); // Check every 60 seconds

    // Also check immediately on start
    this.checkAndShowWebNotifications();
  }

  /**
   * Check if current time matches notification hours and show web notifications
   * Simplified: shows notification for ALL documents within notificationDays window
   */
  private async checkAndShowWebNotifications(): Promise<void> {
    try {
      const config = await this.configService.getConfigAsync();

      if (!config.enableNotifications) {
        return;
      }

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Only trigger at the start of the configured hours (within first minute)
      if (
        !config.notificationHours.includes(currentHour) ||
        currentMinute !== 0
      ) {
        return;
      }

      // Get documents that need notification (within notificationDays window)
      const documents = await this.databaseService.getDocuments();
      const activeDocuments = documents.filter(
        (doc) =>
          doc.documentActive && this.shouldScheduleNotification(doc, config),
      );

      // Show web notification for each document within the notification window
      for (const document of activeDocuments) {
        const expirationDate =
          typeof document.dateFin === 'string'
            ? new Date(document.dateFin)
            : document.dateFin;

        const diffTime = expirationDate.getTime() - now.getTime();
        const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        this.showWebNotification(
          '⚠️ Document bientôt expiré',
          this.generateNotificationMessage(document, daysUntilExpiration),
        );
      }
    } catch (error) {
      console.error('Error checking web notifications:', error);
    }
  }

  /**
   * Show a web notification
   */
  private showWebNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/assets/icon/favicon.png',
        badge: '/assets/icon/favicon.png',
      });
      console.log(`Web notification shown: ${title} - ${body}`);
    }
  }

  /**
   * Test notification (for development/debugging)
   */
  async testNotification(): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native test notification
        const notificationOptions: ScheduleOptions = {
          notifications: [
            {
              id: 999999,
              title: '🚗 Test Notification',
              body: 'Ceci est une notification de test pour vérifier le fonctionnement.',
              schedule: {
                at: new Date(Date.now() + 5000), // 5 seconds from now
              },
              sound: 'default',
            },
          ],
        };

        await LocalNotifications.schedule(notificationOptions);
        console.log('Test notification scheduled');
      } else {
        // Web test notification
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            setTimeout(() => {
              this.showWebNotification(
                '🚗 Test Notification',
                'Ceci est une notification de test pour vérifier le fonctionnement.',
              );
            }, 5000);
            console.log('Web test notification scheduled for 5 seconds');
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              setTimeout(() => {
                this.showWebNotification(
                  '🚗 Test Notification',
                  'Ceci est une notification de test pour vérifier le fonctionnement.',
                );
              }, 5000);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  }

  /**
   * Check and show immediate notifications on native platforms
   * This is called when the app starts to notify users of documents that need attention
   */
  private async checkAndShowImmediateNativeNotifications(): Promise<void> {
    try {
      const config = await this.configService.getConfigAsync();

      if (!config.enableNotifications) {
        console.log('Notifications are disabled');
        return;
      }

      // Get all documents
      const documents = await this.databaseService.getDocuments();

      // Filter documents that need notification (within notificationDays window)
      const documentsNeedingNotification = documents.filter(
        (doc) =>
          doc.documentActive && this.shouldScheduleNotification(doc, config),
      );

      console.log(
        `Documents needing immediate notification: ${documentsNeedingNotification.length}`,
      );

      if (documentsNeedingNotification.length === 0) {
        return;
      }

      // Check if we already showed a notification today (to avoid spamming)
      const today = new Date().toDateString();
      const lastNotificationDate = localStorage.getItem(
        'last_native_notification_date',
      );

      if (lastNotificationDate === today) {
        console.log('Already showed notifications today');
        return;
      }

      // Schedule immediate notifications (5 seconds from now)
      const notifications = documentsNeedingNotification.map(
        (document, index) => {
          const expirationDate =
            typeof document.dateFin === 'string'
              ? new Date(document.dateFin)
              : document.dateFin;

          const diffTime = expirationDate.getTime() - new Date().getTime();
          const daysUntilExpiration = Math.ceil(
            diffTime / (1000 * 60 * 60 * 24),
          );

          return {
            id: 800000 + index, // Use a separate ID range for immediate notifications
            title: '⚠️ Document bientôt expiré',
            body: this.generateNotificationMessage(
              document,
              daysUntilExpiration,
            ),
            schedule: {
              at: new Date(Date.now() + 5000 + index * 1000), // Stagger by 1 second each
            },
            sound: 'default',
          };
        },
      );

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
        localStorage.setItem('last_native_notification_date', today);
        console.log(
          `Scheduled ${notifications.length} immediate notifications`,
        );
      }
    } catch (error) {
      console.error('Error checking immediate native notifications:', error);
    }
  }

  /**
   * Check if current hour is in configured notification hours (for debugging)
   */
  async isCurrentHourConfigured(): Promise<boolean> {
    const config = await this.configService.getConfigAsync();
    const currentHour = new Date().getHours();
    return config.notificationHours.includes(currentHour);
  }

  /**
   * Force check and show notifications now (for testing)
   * Works on both web and native platforms
   */
  async forceCheckNotifications(): Promise<void> {
    const config = await this.configService.getConfigAsync();
    const currentHour = new Date().getHours();

    console.log(`Current hour: ${currentHour}:00`);
    console.log(
      `Configured hours: ${config.notificationHours.map((h) => h + ':00').join(', ')}`,
    );
    console.log(`Notification days: ${config.notificationDays}`);

    // Get documents that need notification
    const documents = await this.databaseService.getDocuments();
    const activeDocuments = documents.filter(
      (doc) =>
        doc.documentActive && this.shouldScheduleNotification(doc, config),
    );

    console.log(`Documents needing notification: ${activeDocuments.length}`);

    if (activeDocuments.length === 0) {
      console.log('No documents need notification');
      return;
    }

    if (Capacitor.isNativePlatform()) {
      // Native platform - schedule immediate notifications
      const notifications = activeDocuments.map((document, index) => {
        const expirationDate =
          typeof document.dateFin === 'string'
            ? new Date(document.dateFin)
            : document.dateFin;

        const diffTime = expirationDate.getTime() - new Date().getTime();
        const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          id: 900000 + index, // Use a separate ID range for force check notifications
          title: '⚠️ Document bientôt expiré',
          body: this.generateNotificationMessage(document, daysUntilExpiration),
          schedule: {
            at: new Date(Date.now() + 3000 + index * 500), // Stagger by 0.5 second each
          },
          sound: 'default',
        };
      });

      await LocalNotifications.schedule({ notifications });
      console.log(
        `Force scheduled ${notifications.length} native notifications`,
      );
    } else {
      // Web platform - show web notifications
      for (const document of activeDocuments) {
        const expirationDate =
          typeof document.dateFin === 'string'
            ? new Date(document.dateFin)
            : document.dateFin;

        const diffTime = expirationDate.getTime() - new Date().getTime();
        const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        this.showWebNotification(
          '⚠️ Document bientôt expiré',
          this.generateNotificationMessage(document, daysUntilExpiration),
        );
      }
    }
  }
}
