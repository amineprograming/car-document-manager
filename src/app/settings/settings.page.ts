import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
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
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  settingsOutline,
  closeCircle,
  add,
  refreshOutline,
  saveOutline,
} from 'ionicons/icons';
import { ConfigService, AppConfig } from '../services/config.service';
import { PushNotificationService } from '../services/push-notification.service';

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

  showHourSelector: boolean = false;
  selectedHour: number | null = null;
  availableHours: number[] = [];

  constructor(
    private configService: ConfigService,
    private toastController: ToastController,
    private alertController: AlertController,
    private pushNotificationService: PushNotificationService
  ) {
    addIcons({
      notificationsOutline,
      settingsOutline,
      closeCircle,
      add,
      refreshOutline,
      saveOutline,
    });
  }

  ngOnInit() {
    this.loadConfiguration();
    this.generateAvailableHours();
  }

  /**
   * Charge la configuration depuis le service
   */
  loadConfiguration() {
    this.config = this.configService.getConfig();
    this.generateAvailableHours();
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
    this.configService.toggleNotifications(this.config.enableNotifications);
    await this.pushNotificationService.updateNotifications();
    this.showToast(
      this.config.enableNotifications
        ? 'Notifications activées'
        : 'Notifications désactivées'
    );
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

    if (
      this.configService.updateNotificationDays(this.config.notificationDays)
    ) {
      await this.pushNotificationService.updateNotifications();
      this.showToast('Nombre de jours mis à jour');
    } else {
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

      if (
        this.configService.updateNotificationHours(
          this.config.notificationHours
        )
      ) {
        this.generateAvailableHours();
        this.showHourSelector = false;
        this.selectedHour = null;
        await this.pushNotificationService.updateNotifications();
        this.showToast('Heure de notification ajoutée');
      } else {
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

      if (
        this.configService.updateNotificationHours(
          this.config.notificationHours
        )
      ) {
        this.generateAvailableHours();
        await this.pushNotificationService.updateNotifications();
        this.showToast('Heure de notification supprimée');
      } else {
        this.showToast('Erreur lors de la suppression', 'danger');
      }
    } else {
      this.showToast(
        'Au moins une heure de notification est requise',
        'warning'
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
            if (this.configService.resetToDefaults()) {
              this.loadConfiguration();
              await this.pushNotificationService.updateNotifications();
              this.showToast('Configuration réinitialisée');
            } else {
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
    if (this.configService.saveConfig(this.config)) {
      await this.pushNotificationService.updateNotifications();
      this.showToast('Configuration sauvegardée avec succès');
    } else {
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
   * Affiche un toast
   */
  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }
}
