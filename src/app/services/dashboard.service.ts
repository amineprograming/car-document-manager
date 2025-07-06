import { Injectable } from '@angular/core';
import { DatabaseService } from './firebase-database.service';
import { NotificationService } from './notification.service';
import { Car } from '../models/car.model';
import { Document } from '../models/document.model';

export interface DashboardStats {
  totalCars: number;
  activeDocuments: number;
  expiredDocuments: number;
  expiringInSevenDays: number;
  soonToExpireDocuments: Document[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  constructor(
    private databaseService: DatabaseService,
    private notificationService: NotificationService
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [cars, documents, expiredDocs, expiringDocs] = await Promise.all([
        this.databaseService.getCars(),
        this.databaseService.getDocuments(),
        this.databaseService.getExpiredDocuments(),
        this.databaseService.getExpiringDocuments(7),
      ]);

      const activeDocuments = documents.filter((doc) => doc.documentActive);

      return {
        totalCars: cars.length,
        activeDocuments: activeDocuments.length,
        expiredDocuments: expiredDocs.length,
        expiringInSevenDays: expiringDocs.length,
        soonToExpireDocuments: expiringDocs.slice(0, 5), // Show only first 5
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalCars: 0,
        activeDocuments: 0,
        expiredDocuments: 0,
        expiringInSevenDays: 0,
        soonToExpireDocuments: [],
      };
    }
  }

  async checkDailyExpirations(): Promise<void> {
    try {
      const documents = await this.databaseService.getDocuments();
      await this.notificationService.checkAndNotifyTodaysExpirations(documents);

      const settings = await this.databaseService.getSettings();
      await this.notificationService.scheduleExpirationNotifications(
        documents,
        settings.notificationDays
      );
    } catch (error) {
      console.error('Error checking daily expirations:', error);
    }
  }

  async initializeDailyCheck(): Promise<void> {
    // Check immediately
    await this.checkDailyExpirations();

    // Set up daily check (every 24 hours)
    setInterval(async () => {
      await this.checkDailyExpirations();
    }, 24 * 60 * 60 * 1000);
  }
}
