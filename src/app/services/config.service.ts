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

  constructor() {}

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): AppConfig {
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
   * Sauvegarde la configuration
   */
  saveConfig(config: AppConfig): boolean {
    try {
      localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      return false;
    }
  }

  /**
   * Met à jour le nombre de jours pour les notifications
   */
  updateNotificationDays(days: number): boolean {
    if (days < 1 || days > 365) {
      return false;
    }
    const config = this.getConfig();
    config.notificationDays = days;
    return this.saveConfig(config);
  }

  /**
   * Met à jour les heures de notifications
   */
  updateNotificationHours(hours: number[]): boolean {
    if (!hours || hours.length === 0) {
      return false;
    }
    // Valider que toutes les heures sont entre 0 et 23
    if (hours.some((hour) => hour < 0 || hour > 23)) {
      return false;
    }
    const config = this.getConfig();
    config.notificationHours = [...hours].sort((a, b) => a - b);
    return this.saveConfig(config);
  }

  /**
   * Active/désactive les notifications
   */
  toggleNotifications(enabled: boolean): boolean {
    const config = this.getConfig();
    config.enableNotifications = enabled;
    return this.saveConfig(config);
  }

  /**
   * Remet la configuration aux valeurs par défaut
   */
  resetToDefaults(): boolean {
    return this.saveConfig({ ...this.defaultConfig });
  }

  /**
   * Formate une heure en format 24h
   */
  formatHour(hour: number): string {
    return hour.toString().padStart(2, '0') + ':00';
  }
}
