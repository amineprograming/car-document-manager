export interface UserSettings {
  id?: string;
  notificationDays: number;
  notificationHours: number[];
  enableNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_USER_SETTINGS: Omit<
  UserSettings,
  'id' | 'createdAt' | 'updatedAt'
> = {
  notificationDays: 30,
  notificationHours: [9, 18],
  enableNotifications: true,
};
