@echo off
echo Building APK for Car Document Manager...
echo.

cd /d "C:\Users\Amine\Desktop\Ionic\car-document-manager"

echo Step 1: Building web assets...
call ionic build --prod

echo Step 2: Syncing with Android...
call npx cap sync android

echo Step 3: Building Android APK...
cd android
call gradlew assembleDebug

echo.
if exist "app\build\outputs\apk\debug\app-debug.apk" (
    echo SUCCESS! APK built successfully!
    echo Location: app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Opening APK folder...
    start explorer "app\build\outputs\apk\debug"
    echo.
    echo To install on your Android phone:
    echo 1. Copy app-debug.apk to your phone
    echo 2. Enable "Install unknown apps" in phone settings
    echo 3. Tap the APK file to install
) else (
    echo Build may have failed. Check the output above for errors.
)

echo.
pause
