export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Settings {
  notificationDays: number; // Number of days before expiration to notify
}
