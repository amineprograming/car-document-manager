import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as XLSX from 'xlsx';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonCheckbox,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonChip,
  IonSpinner,
  IonToggle,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  notifications,
  settingsOutline,
  closeCircle,
  add,
  refreshOutline,
  refresh,
  saveOutline,
  calendar,
  time,
  timeOutline,
  addCircle,
  repeatOutline,
  cogOutline,
  chevronForward,
  informationCircleOutline,
  checkmarkCircle,
  logOutOutline,
  exitOutline,
  downloadOutline,
  cloudDownloadOutline,
} from 'ionicons/icons';
import { ConfigService, AppConfig } from '../services/config.service';
import { PushNotificationService } from '../services/push-notification.service';
import { DatabaseService } from '../services/firebase-database.service';
import { AuthService } from '../services/auth.service';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonCheckbox,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonChip,
    IonSpinner,
    IonToggle,
    CommonModule,
    FormsModule,
  ],
})
export class SettingsPage implements OnInit {
  config: AppConfig = {
    notificationDays: 30,
    notificationHours: [9, 18],
    enableNotifications: true,
  };

  isLoading: boolean = true;
  showHourSelector: boolean = false;
  selectedHour: number | null = null;
  availableHours: number[] = [];

  constructor(
    private configService: ConfigService,
    private toastController: ToastController,
    private alertController: AlertController,
    private pushNotificationService: PushNotificationService,
    private databaseService: DatabaseService,
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({
      settingsOutline,
      notifications,
      calendar,
      time,
      notificationsOutline,
      timeOutline,
      closeCircle,
      addCircle,
      repeatOutline,
      cogOutline,
      chevronForward,
      refresh,
      informationCircleOutline,
      checkmarkCircle,
      add,
      refreshOutline,
      saveOutline,
      logOutOutline,
      exitOutline,
      downloadOutline,
      cloudDownloadOutline,
    });

    // Inject DatabaseService to ConfigService to avoid circular dependency
    this.configService.setDatabaseService(this.databaseService);
  }

  ngOnInit() {
    this.loadConfiguration();
    this.generateAvailableHours();
  }

  /**
   * Charge la configuration depuis le service
   */
  async loadConfiguration() {
    this.isLoading = true;
    try {
      this.config = await this.configService.getConfigAsync();
      this.generateAvailableHours();
    } catch (error) {
      console.error('Error loading configuration:', error);
      this.showToast('Erreur lors du chargement des paramètres', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Génère la liste des heures disponibles (non sélectionnées)
   */
  generateAvailableHours() {
    this.availableHours = [];
    for (let i = 0; i < 24; i++) {
      if (!this.config.notificationHours.includes(i)) {
        this.availableHours.push(i);
      }
    }
  }

  /**
   * Gère le changement d'état des notifications
   */
  async onNotificationToggle() {
    try {
      await this.configService.toggleNotifications(
        this.config.enableNotifications,
      );
      await this.pushNotificationService.updateNotifications();
      this.showToast(
        this.config.enableNotifications
          ? 'Notifications activées'
          : 'Notifications désactivées',
      );
    } catch (error) {
      console.error('Error toggling notifications:', error);
      this.showToast('Erreur lors de la mise à jour', 'danger');
    }
  }

  /**
   * Gère le changement du nombre de jours
   */
  async onNotificationDaysChange() {
    if (this.config.notificationDays < 1) {
      this.config.notificationDays = 1;
    } else if (this.config.notificationDays > 365) {
      this.config.notificationDays = 365;
    }

    try {
      const updated = await this.configService.updateNotificationDays(
        this.config.notificationDays,
      );
      if (updated) {
        await this.pushNotificationService.updateNotifications();
        this.showToast('Nombre de jours mis à jour');
      } else {
        this.showToast('Erreur lors de la mise à jour', 'danger');
      }
    } catch (error) {
      console.error('Error updating notification days:', error);
      this.showToast('Erreur lors de la mise à jour', 'danger');
    }
  }

  /**
   * Affiche le sélecteur d'heure
   */
  showHourPicker() {
    this.showHourSelector = true;
    this.selectedHour = null;
  }

  /**
   * Ajoute une heure de notification
   */
  async addNotificationHour() {
    if (
      this.selectedHour !== null &&
      !this.config.notificationHours.includes(this.selectedHour)
    ) {
      this.config.notificationHours.push(this.selectedHour);
      this.config.notificationHours.sort((a, b) => a - b);

      try {
        const updated = await this.configService.updateNotificationHours(
          this.config.notificationHours,
        );
        if (updated) {
          this.generateAvailableHours();
          this.showHourSelector = false;
          this.selectedHour = null;
          await this.pushNotificationService.updateNotifications();
          this.showToast('Heure de notification ajoutée');
        } else {
          this.showToast("Erreur lors de l'ajout de l'heure", 'danger');
        }
      } catch (error) {
        console.error('Error adding notification hour:', error);
        this.showToast("Erreur lors de l'ajout de l'heure", 'danger');
      }
    }
  }

  /**
   * Supprime une heure de notification
   */
  async removeNotificationHour(index: number) {
    if (this.config.notificationHours.length > 1) {
      this.config.notificationHours.splice(index, 1);

      try {
        const updated = await this.configService.updateNotificationHours(
          this.config.notificationHours,
        );
        if (updated) {
          this.generateAvailableHours();
          await this.pushNotificationService.updateNotifications();
          this.showToast('Heure de notification supprimée');
        } else {
          this.showToast('Erreur lors de la suppression', 'danger');
        }
      } catch (error) {
        console.error('Error removing notification hour:', error);
        this.showToast('Erreur lors de la suppression', 'danger');
      }
    } else {
      this.showToast(
        'Au moins une heure de notification est requise',
        'warning',
      );
    }
  }

  /**
   * Formate une heure pour l'affichage
   */
  formatHour(hour: number): string {
    return this.configService.formatHour(hour);
  }

  /**
   * Retourne le texte des heures de notification
   */
  getNotificationHoursText(): string {
    if (this.config.notificationHours.length === 0) {
      return 'Aucune';
    }
    return this.config.notificationHours
      .map((hour) => this.formatHour(hour))
      .join(', ');
  }

  /**
   * Remet la configuration aux valeurs par défaut
   */
  async resetToDefaults() {
    const alert = await this.alertController.create({
      header: 'Réinitialiser la configuration',
      message:
        'Êtes-vous sûr de vouloir remettre tous les paramètres aux valeurs par défaut ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Réinitialiser',
          role: 'destructive',
          handler: async () => {
            try {
              const reset = await this.configService.resetToDefaults();
              if (reset) {
                await this.loadConfiguration();
                await this.pushNotificationService.updateNotifications();
                this.showToast('Configuration réinitialisée');
              } else {
                this.showToast('Erreur lors de la réinitialisation', 'danger');
              }
            } catch (error) {
              console.error('Error resetting to defaults:', error);
              this.showToast('Erreur lors de la réinitialisation', 'danger');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Sauvegarde la configuration
   */
  async saveConfiguration() {
    try {
      const saved = await this.configService.saveConfig(this.config);
      if (saved) {
        await this.pushNotificationService.updateNotifications();
        this.showToast('Configuration sauvegardée avec succès');
      } else {
        this.showToast('Erreur lors de la sauvegarde', 'danger');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      this.showToast('Erreur lors de la sauvegarde', 'danger');
    }
  }

  /**
   * Test notification (for development/debugging)
   */
  async testNotification() {
    try {
      await this.pushNotificationService.testNotification();
      this.showToast('Notification de test programmée dans 5 secondes');
    } catch (error) {
      console.error('Error testing notification:', error);
      this.showToast('Erreur lors du test de notification', 'danger');
    }
  }

  /**
   * Check if current hour matches configured hours and show notifications
   */
  async checkCurrentHourNotifications() {
    try {
      const currentHour = new Date().getHours();
      const isConfigured = this.config.notificationHours.includes(currentHour);

      if (isConfigured) {
        await this.pushNotificationService.forceCheckNotifications();
        this.showToast(
          `Heure actuelle (${currentHour}:00) configurée - Notifications vérifiées!`,
        );
      } else {
        const configuredHours = this.config.notificationHours
          .map((h) => `${h}:00`)
          .join(', ');
        this.showToast(
          `Heure actuelle (${currentHour}:00) non configurée. Heures: ${configuredHours}`,
          'warning',
          4000,
        );
      }
    } catch (error) {
      console.error('Error checking current hour notifications:', error);
      this.showToast('Erreur lors de la vérification', 'danger');
    }
  }

  /**
   * Affiche un toast
   */
  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success',
    duration: number = 2000,
  ) {
    const toast = await this.toastController.create({
      message,
      duration,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  /**
   * Déconnexion et fermeture de l'application
   */
  async logout() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: "Voulez-vous vous déconnecter et quitter l'application ?",
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel',
        },
        {
          text: 'Déconnexion',
          role: 'destructive',
          handler: async () => {
            try {
              await this.authService.signOut();
              this.router.navigate(['/auth']);

              // Close app on native platforms
              if (Capacitor.isNativePlatform()) {
                setTimeout(() => {
                  App.exitApp();
                }, 500);
              }
            } catch (error) {
              console.error('Error during logout:', error);
              this.showToast('Erreur lors de la déconnexion', 'danger');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  /**
   * Export all data (vehicles and documents) to Excel file
   */
  async exportToExcel() {
    try {
      this.showToast("Préparation de l'export...", 'warning');

      // Get all data
      const cars = await this.databaseService.getCars();
      const documents = await this.databaseService.getDocuments();

      // Prepare vehicles data
      const vehiclesData = cars.map((car) => ({
        Matricule: car.matricule,
        Marque: car.marque || '',
        Modèle: car.model || '',
        Type: car.typeVehicule || 'voiture',
        Chauffeur: car.chauffeur || '',
        Téléphone: car.tel || '',
        'Date de création': car.createdAt
          ? new Date(car.createdAt).toLocaleDateString('fr-FR')
          : '',
      }));

      // Prepare documents data
      const documentsData = documents.map((doc) => ({
        Référence: doc.reference || '',
        Type: doc.typeDocument,
        'Matricule Véhicule': doc.matriculeCar,
        'Date Début': doc.dateDebut
          ? new Date(doc.dateDebut).toLocaleDateString('fr-FR')
          : '',
        'Date Fin': doc.dateFin
          ? new Date(doc.dateFin).toLocaleDateString('fr-FR')
          : '',
        Actif: doc.documentActive ? 'Oui' : 'Non',
        Statut: this.getDocumentStatus(doc.dateFin),
        'Date de création': doc.createdAt
          ? new Date(doc.createdAt).toLocaleDateString('fr-FR')
          : '',
      }));

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Add vehicles sheet
      const vehiclesSheet = XLSX.utils.json_to_sheet(vehiclesData);
      XLSX.utils.book_append_sheet(workbook, vehiclesSheet, 'Véhicules');

      // Add documents sheet
      const documentsSheet = XLSX.utils.json_to_sheet(documentsData);
      XLSX.utils.book_append_sheet(workbook, documentsSheet, 'Documents');

      // Generate filename with date
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const filename = `backup_vehicules_${dateStr}.xlsx`;

      // Export the file
      XLSX.writeFile(workbook, filename);

      this.showToast(`Export réussi: ${filename}`, 'success');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      this.showToast("Erreur lors de l'export", 'danger');
    }
  }

  /**
   * Get document status based on expiration date
   */
  private getDocumentStatus(dateFin: Date | string): string {
    const expirationDate =
      typeof dateFin === 'string' ? new Date(dateFin) : dateFin;
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Expiré';
    } else if (diffDays <= 7) {
      return 'Expire bientôt';
    } else {
      return 'Valide';
    }
  }
}
