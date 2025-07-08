import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonChip,
  IonAvatar,
  IonFab,
  IonFabButton,
  IonFabList,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  refresh,
  logOut,
  car,
  documentText,
  alertCircle,
  warning,
  time,
  flash,
  add,
  carSport,
  document,
  shield,
  checkmarkCircle,
  medkit,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import {
  DashboardService,
  DashboardStats,
} from '../services/dashboard.service';
import { NotificationService } from '../services/notification.service';
import { DatabaseService } from '../services/firebase-database.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonChip,
    IonAvatar,
    IonFab,
    IonFabButton,
    IonFabList,
    CommonModule,
  ],
})
export class Tab1Page implements OnInit, OnDestroy {
  user: User | null = null;
  stats: DashboardStats = {
    totalCars: 0,
    activeDocuments: 0,
    expiredDocuments: 0,
    expiringInSevenDays: 0,
    soonToExpireDocuments: [],
  };

  private authSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
    private notificationService: NotificationService,
    private databaseService: DatabaseService,
    private router: Router,
    private alertController: AlertController
  ) {
    addIcons({
      refresh,
      logOut,
      car,
      documentText,
      alertCircle,
      warning,
      time,
      flash,
      add,
      carSport,
      document,
      shield,
      checkmarkCircle,
      medkit,
    });
  }

  ngOnInit() {
    this.authSubscription = this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.loadDashboardData();
      }
    });
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async loadDashboardData() {
    try {
      this.stats = await this.dashboardService.getDashboardStats();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  async refresh() {
    await this.loadDashboardData();
    await this.dashboardService.checkDailyExpirations();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Déconnexion',
          handler: async () => {
            await this.authService.signOut();
            this.router.navigate(['/auth']);
          },
        },
      ],
    });

    await alert.present();
  }

  getDocumentIcon(documentType: string): string {
    switch (documentType.toLowerCase()) {
      case 'assurance':
        return 'shield';
      case 'carte grise':
        return 'document';
      case 'contrôle technique':
        return 'checkmarkCircle';
      case 'vignette':
        return 'medkit';
      default:
        return 'documentText';
    }
  }

  getExpirationStatus(expirationDate: Date) {
    return this.notificationService.getExpirationStatus(expirationDate);
  }

  getDaysUntilExpiration(expirationDate: Date): number {
    return this.notificationService.getDaysUntilExpiration(expirationDate);
  }
}
