import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cardocuments.app',
  appName: 'Car Document Manager',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  plugins: {
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
