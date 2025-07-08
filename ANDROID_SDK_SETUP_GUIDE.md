# Android SDK Setup Guide

This guide will help you set up the Android SDK properly to build the APK for your Car Document Manager app.

## Current Status

The app is ready to build, but the Android SDK needs to be properly configured. I've created the `local.properties` file in the `android` directory, but the Android SDK components need to be installed.

## Option 1: Using Android Studio (Recommended)

### Step 1: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Install Android Studio with the default settings
3. During setup, make sure to install:
   - Android SDK
   - Android SDK Platform-Tools
   - Android Virtual Device (AVD)

### Step 2: Configure SDK Location

1. Open Android Studio
2. Go to File → Settings (or Android Studio → Preferences on Mac)
3. Navigate to Appearance & Behavior → System Settings → Android SDK
4. Note the SDK Location path (usually `C:\Users\YourUsername\AppData\Local\Android\Sdk`)
5. Update the `android/local.properties` file with the correct path:
   ```
   sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
   ```

### Step 3: Install Required SDK Components

In Android Studio SDK Manager, ensure these are installed:

- Android SDK Platform 34 (or latest)
- Android SDK Build-Tools 34.0.0 (or latest)
- Android SDK Platform-Tools
- Android SDK Command-line Tools

## Option 2: Command Line SDK Installation

If you prefer not to install Android Studio, you can install just the SDK:

### Step 1: Download Command Line Tools

1. Go to: https://developer.android.com/studio#downloads
2. Scroll down to "Command line tools only"
3. Download the Windows version
4. Extract to `C:\Android\Sdk\cmdline-tools\latest`

### Step 2: Install SDK Components

Open PowerShell as Administrator and run:

```powershell
cd "C:\Android\Sdk"
.\cmdline-tools\latest\bin\sdkmanager.bat --licenses
.\cmdline-tools\latest\bin\sdkmanager.bat "platform-tools" "platforms;android-34" "build-tools;34.0.0"
```

## Step 3: Set Environment Variables (Optional but Recommended)

Add these to your system environment variables:

- `ANDROID_HOME`: `C:\Android\Sdk` (or your SDK path)
- Add to `PATH`: `%ANDROID_HOME%\platform-tools`

## Step 4: Build the APK

Once the SDK is properly installed:

### Using Ionic CLI (Recommended)

```powershell
cd "C:\Users\Amine\Desktop\Ionic\car-document-manager"
ionic build --prod
npx cap copy android
npx cap open android
```

Then in Android Studio:

1. Build → Build Bundle(s) / APK(s) → Build APK(s)
2. The APK will be in `android/app/build/outputs/apk/debug/`

### Using Gradle Directly

```powershell
cd "C:\Users\Amine\Desktop\Ionic\car-document-manager\android"
.\gradlew assembleDebug
```

## Troubleshooting

### If you get "SDK location not found" error:

1. Check that `android/local.properties` exists and has the correct SDK path
2. Verify the SDK path exists and contains the necessary folders
3. Make sure the path uses double backslashes: `C\:\\Path\\To\\Sdk`

### If you get "Build Tools not found" error:

1. Open Android Studio SDK Manager
2. Install the latest Build Tools version
3. Update `android/app/build.gradle` to use the correct build tools version

### If you get Java version errors:

Make sure you're using Java 11 or higher (you currently have Java 11.0.16.1).

## Expected Output

After successful build, you should find the APK at:
`android/app/build/outputs/apk/debug/app-debug.apk`

This APK can be installed on any Android device for testing.

## Current App Features

The APK will include:

- ✅ Document management with vehicle assignment
- ✅ Push notifications for document expiration
- ✅ Configurable notification settings
- ✅ Vehicle management
- ✅ Authentication system
- ✅ Firebase integration

The notifications will work even when the app is closed, alerting users about documents expiring soon based on their configured settings.
