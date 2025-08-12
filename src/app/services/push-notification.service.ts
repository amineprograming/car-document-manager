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
    private databaseService: DatabaseService
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
          permissionStatus.display
        );

        // Listen for notification actions
        await LocalNotifications.addListener(
          'localNotificationActionPerformed',
          (notification) => {
            console.log('Notification action performed:', notification);
            // Handle notification tap - could navigate to documents page
          }
        );

        // Start the notification scheduling process
        await this.scheduleAllNotifications();
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
          doc.documentActive && this.shouldScheduleNotification(doc, config)
      );

      console.log(
        `Scheduling notifications for ${activeDocuments.length} documents`
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
    config: AppConfig
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
   */
  private async scheduleDocumentNotifications(
    document: Document,
    config: AppConfig
  ): Promise<void> {
    const expirationDate =
      typeof document.dateFin === 'string'
        ? new Date(document.dateFin)
        : document.dateFin;

    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const totalDaysUntilExpiration = Math.ceil(
      diffTime / (1000 * 60 * 60 * 24)
    );

    // Use notification intervals from config instead of hardcoded values
    const notificationIntervals = config.notificationIntervals || [7, 3, 1, 0];

    // Schedule notifications for each interval and each configured hour
    for (const interval of notificationIntervals) {
      if (totalDaysUntilExpiration >= interval) {
        // Calculate the date when notification should be sent
        const notificationDate = new Date(expirationDate);
        notificationDate.setDate(notificationDate.getDate() - interval);

        // Only schedule if notification date is in the future
        if (notificationDate.getTime() > now.getTime()) {
          const daysUntilExpiration =
            interval === 0 ? totalDaysUntilExpiration : interval;
          for (const hour of config.notificationHours) {
            await this.scheduleNotificationForDateTime(
              document,
              notificationDate,
              hour,
              daysUntilExpiration
            );
          }
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
    daysUntilExpiration: number
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
              daysUntilExpiration
            ),
            schedule: {
              at: scheduledDate,
            },
            sound: 'default',
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
        }) on ${scheduledDate.toLocaleDateString()} at ${hour}:00 (${daysUntilExpiration} days until expiration)`
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
    daysUntilExpiration: number
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
        (s) => s.documentId === documentId
      );

      if (documentSchedules.length > 0) {
        const ids = documentSchedules.map((s) => s.id);
        await LocalNotifications.cancel({
          notifications: ids.map((id) => ({ id })),
        });

        // Remove from stored schedules
        const remainingSchedules = schedules.filter(
          (s) => s.documentId !== documentId
        );
        this.saveAllNotificationSchedules(remainingSchedules);

        console.log(
          `Cancelled ${ids.length} notifications for document ${documentId}`
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
    schedules: NotificationSchedule[]
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
          // You could implement web notifications here for testing
        }
      });
    }
  }

  /**
   * Test notification (for development/debugging)
   */
  async testNotification(): Promise<void> {
    try {
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
    } catch (error) {
      console.error('Error scheduling test notification:', error);
    }
  }
}
