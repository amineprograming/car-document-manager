// Google Auth Configuration
// ========================
//
// TO FIX THE CONNECTION ERROR, YOU NEED TO:
// 1. Go to Firebase Console: https://console.firebase.google.com
// 2. Select your project
// 3. Go to Authentication > Sign-in method
// 4. Enable Google provider
// 5. Copy the Web client ID from the Google provider configuration
// 6. Replace CLIENT_ID below with your real client ID
// 7. Generate SHA-1 fingerprint and add it to Firebase project settings

export const GOOGLE_AUTH_CONFIG = {
  // Real Client ID from Firebase Console
  CLIENT_ID:
    '603137695665-n8uers128dma1cm45b6310s1seud989l.apps.googleusercontent.com',

  // Standard scopes for profile and email
  SCOPES: ['profile', 'email'],

  // Grant offline access for refresh tokens
  GRANT_OFFLINE_ACCESS: true,
};

// Instructions to get your real Client ID:
// ========================================
// 1. Go to: https://console.firebase.google.com
// 2. Select your project
// 3. Go to Authentication > Sign-in method
// 4. Click on Google provider
// 5. Copy the "Web client ID" (it should end with .apps.googleusercontent.com)
// 6. Replace CLIENT_ID above
//
// Also need to add SHA-1 fingerprint:
// ==================================
// Run in terminal: keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
// Copy the SHA-1 fingerprint
// Add it to Firebase Console > Project Settings > Your apps > Android app
