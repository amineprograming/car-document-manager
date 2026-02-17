import { Injectable } from '@angular/core';
import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class BiometricService {
  private isAvailable = false;
  private biometryType: BiometryType = BiometryType.NONE;

  constructor() {}

  /**
   * Check if biometric authentication is available on the device
   */
  async checkAvailability(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Biometric: Not a native platform, skipping');
      return false;
    }

    try {
      const result = await NativeBiometric.isAvailable();
      this.isAvailable = result.isAvailable;
      this.biometryType = result.biometryType;

      console.log('Biometric available:', this.isAvailable);
      console.log('Biometry type:', this.getBiometryTypeName());

      return this.isAvailable;
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Get the name of the biometry type
   */
  getBiometryTypeName(): string {
    switch (this.biometryType) {
      case BiometryType.FINGERPRINT:
        return 'Empreinte digitale';
      case BiometryType.FACE_AUTHENTICATION:
        return 'Reconnaissance faciale';
      case BiometryType.FACE_ID:
        return 'Face ID';
      case BiometryType.TOUCH_ID:
        return 'Touch ID';
      case BiometryType.MULTIPLE:
        return 'Multiple';
      default:
        return 'Non disponible';
    }
  }

  /**
   * Perform biometric authentication
   */
  async authenticate(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Biometric: Not a native platform, auto-authenticated');
      return true;
    }

    try {
      // Check availability first
      const available = await this.checkAvailability();

      if (!available) {
        console.log('Biometric not available, skipping authentication');
        return true; // Allow access if biometric is not available
      }

      // Perform authentication
      await NativeBiometric.verifyIdentity({
        reason: "Veuillez vous authentifier pour accéder à l'application",
        title: 'Authentification requise',
        subtitle: 'Gestionnaire de Véhicules',
        description:
          'Utilisez votre empreinte digitale ou reconnaissance faciale',
        negativeButtonText: 'Annuler',
      });

      console.log('Biometric authentication successful');
      return true;
    } catch (error: any) {
      console.error('Biometric authentication failed:', error);

      // Check if user cancelled
      if (
        error?.code === 'authenticationCanceled' ||
        error?.message?.includes('cancel') ||
        error?.message?.includes('Cancel')
      ) {
        return false;
      }

      // For other errors, we might want to allow access or show retry
      return false;
    }
  }

  /**
   * Check if biometric is available
   */
  getIsAvailable(): boolean {
    return this.isAvailable;
  }
}
