import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Document } from '../models/document.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor() {
    this.initializeNotifications();
  }

  private async initializeNotifications() {
    try {
      // Request permission for notifications
      await LocalNotifications.requestPermissions();
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
    }
  }

  async scheduleExpirationNotifications(
    documents: Document[],
    notificationDays: number = 7
  ): Promise<void> {
    try {
      // Clear existing notifications
      await LocalNotifications.cancel({
        notifications: await this.getAllScheduledNotifications(),
      });

      const now = new Date();
      const notifications: any[] = [];

      documents.forEach((doc, index) => {
        const daysUntilExpiration = this.getDaysUntilExpiration(doc.dateFin);

        if (
          daysUntilExpiration <= notificationDays &&
          daysUntilExpiration >= 0
        ) {
          const notificationDate = new Date(doc.dateFin);
          notificationDate.setDate(
            notificationDate.getDate() - notificationDays
          );

          // Only schedule if notification date is in the future
          if (notificationDate > now) {
            notifications.push({
              id: index + 1,
              title: 'Document bientôt expiré',
              body: `Le document ${doc.typeDocument} pour le véhicule ${doc.matriculeCar} expire dans ${daysUntilExpiration} jour(s)`,
              schedule: { at: notificationDate },
              sound: 'default',
              attachments: [],
              actionTypeId: '',
              extra: {
                documentId: doc.id,
                matricule: doc.matriculeCar,
              },
            });
          }
        }
      });

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }

  async sendImmediateNotification(title: string, body: string): Promise<void> {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 10000),
            title,
            body,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second from now
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: {},
          },
        ],
      });
    } catch (error) {
      console.error('Error sending immediate notification:', error);
    }
  }

  private async getAllScheduledNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications.map((n) => ({ id: n.id }));
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  getDaysUntilExpiration(expirationDate: Date): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const expiry = new Date(expirationDate);
    expiry.setHours(0, 0, 0, 0);

    const timeDiff = expiry.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  getExpirationStatus(expirationDate: Date): {
    status: string;
    message: string;
    color: string;
  } {
    const days = this.getDaysUntilExpiration(expirationDate);

    if (days < 0) {
      return {
        status: 'expired',
        message: `Expiré depuis ${Math.abs(days)} jour(s)`,
        color: 'danger',
      };
    } else if (days === 0) {
      return {
        status: 'expires-today',
        message: "Expire aujourd'hui",
        color: 'danger',
      };
    } else if (days <= 7) {
      return {
        status: 'expires-soon',
        message: `Expire dans ${days} jour(s)`,
        color: 'warning',
      };
    } else {
      return {
        status: 'valid',
        message: `Expire dans ${days} jour(s)`,
        color: 'success',
      };
    }
  }

  async checkAndNotifyTodaysExpirations(documents: Document[]): Promise<void> {
    const todaysExpirations = documents.filter((doc) => {
      const days = this.getDaysUntilExpiration(doc.dateFin);
      return days === 0 && doc.documentActive;
    });

    for (const doc of todaysExpirations) {
      await this.sendImmediateNotification(
        "Document expiré aujourd'hui!",
        `Le document ${doc.typeDocument} pour ${doc.matriculeCar} expire aujourd'hui`
      );
    }
  }
}
