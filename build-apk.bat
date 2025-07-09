@echo off
echo Setting up Android SDK and building APK...
echo.

:: Set variables
set SDK_PATH=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PROJECT_PATH=C:\Users\Amine\Desktop\Ionic\car-document-manager

echo Checking Android Studio installation...
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo Android Studio found!
    echo Opening project in Android Studio...
    start "Android Studio" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "%PROJECT_PATH%\android"
    echo.
    echo In Android Studio:
    echo 1. Wait for Gradle sync to complete
    echo 2. Go to Build ^> Build Bundle^(s^) / APK^(s^) ^> Build APK^(s^)
    echo 3. The APK will be in android\app\build\outputs\apk\debug\
    echo.
    pause
) else (
    echo Android Studio not found in default location.
    echo Please install Android Studio from: https://developer.android.com/studio
    pause
    exit /b 1
)

:: Alternative: Try Gradle build if SDK is properly configured
echo.
echo Alternatively, trying Gradle build...
cd /d "%PROJECT_PATH%\android"

if exist "local.properties" (
    echo local.properties found
    gradlew.bat assembleDebug
    if errorlevel 1 (
        echo Build failed. Please use Android Studio method above.
        pause
    ) else (
        echo Build successful!
        echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
        if exist "app\build\outputs\apk\debug\app-debug.apk" (
            echo Opening APK folder...
            start explorer "app\build\outputs\apk\debug"
        )
        pause
    )
) else (
    echo local.properties not found. Using Android Studio method.
)

echo.
echo Script completed.
pause
