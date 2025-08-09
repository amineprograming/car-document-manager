import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cardocuments.app',
  appName: 'Car Document Manager',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId:
        '603137695665-n8uers128dma1cm45b6310s1seud989l.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF',
      sound: 'beep.wav',
    },
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
