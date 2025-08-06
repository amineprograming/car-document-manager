import { Injectable } from '@angular/core';

export interface AppConfig {
  notificationDays: number;
  notificationHours: number[];
  enableNotifications: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private readonly CONFIG_KEY = 'app_config';

  private defaultConfig: AppConfig = {
    notificationDays: 30, // Notifier 30 jours avant expiration par défaut
    notificationHours: [9, 18], // Notifications à 9h et 18h par défaut
    enableNotifications: true,
  };

  private databaseService?: any; // Will be injected later to avoid circular dependency
  private currentConfig: AppConfig | null = null;

  constructor() {}

  // Method to inject DatabaseService after creation to avoid circular dependency
  setDatabaseService(databaseService: any) {
    this.databaseService = databaseService;
    this.loadFromFirebase();
  }

  /**
   * Load configuration from Firebase
   */
  private async loadFromFirebase(): Promise<void> {
    if (this.databaseService && this.databaseService.getUserSettings) {
      try {
        this.currentConfig = await this.databaseService.getUserSettings();
      } catch (error) {
        console.error('Error loading settings from Firebase:', error);
        this.currentConfig = this.getLocalConfig();
      }
    }
  }

  /**
   * Get configuration from localStorage (fallback)
   */
  private getLocalConfig(): AppConfig {
    try {
      const savedConfig = localStorage.getItem(this.CONFIG_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Fusionner avec la config par défaut pour s'assurer que toutes les propriétés existent
        return { ...this.defaultConfig, ...parsedConfig };
      }
    } catch (error) {
      console.error('Erreur lors de la lecture de la configuration:', error);
    }
    return { ...this.defaultConfig };
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): AppConfig {
    if (this.currentConfig) {
      return { ...this.currentConfig };
    }
    return this.getLocalConfig();
  }

  /**
   * Sauvegarde la configuration
   */
  async saveConfig(config: AppConfig): Promise<boolean> {
    try {
      // Save to Firebase first
      if (this.databaseService && this.databaseService.saveUserSettings) {
        const firebaseSaved = await this.databaseService.saveUserSettings(
          config
        );
        if (firebaseSaved) {
          this.currentConfig = { ...config };
        }
      }

      // Also save to localStorage as fallback
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      // Try to save locally at least
      try {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
        return true;
      } catch (localError) {
        console.error('Erreur lors de la sauvegarde locale:', localError);
        return false;
      }
    }
  }

  /**
   * Met à jour le nombre de jours pour les notifications
   */
  async updateNotificationDays(days: number): Promise<boolean> {
    if (days < 1 || days > 365) {
      return false;
    }
    const config = this.getConfig();
    config.notificationDays = days;
    return await this.saveConfig(config);
  }

  /**
   * Met à jour les heures de notifications
   */
  async updateNotificationHours(hours: number[]): Promise<boolean> {
    if (!hours || hours.length === 0) {
      return false;
    }
    // Valider que toutes les heures sont entre 0 et 23
    if (hours.some((hour) => hour < 0 || hour > 23)) {
      return false;
    }
    const config = this.getConfig();
    config.notificationHours = [...hours].sort((a, b) => a - b);
    return await this.saveConfig(config);
  }

  /**
   * Active/désactive les notifications
   */
  async toggleNotifications(enabled: boolean): Promise<boolean> {
    const config = this.getConfig();
    config.enableNotifications = enabled;
    return await this.saveConfig(config);
  }

  /**
   * Remet la configuration aux valeurs par défaut
   */
  async resetToDefaults(): Promise<boolean> {
    return await this.saveConfig({ ...this.defaultConfig });
  }

  /**
   * Formate une heure en format 24h
   */
  formatHour(hour: number): string {
    return hour.toString().padStart(2, '0') + ':00';
  }
}
