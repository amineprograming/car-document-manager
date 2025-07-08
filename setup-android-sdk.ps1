# Android SDK Setup Script
# Run this script in PowerShell as Administrator

Write-Host "Setting up Android SDK for Car Document Manager..." -ForegroundColor Green

# Create SDK directory
$sdkPath = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
Write-Host "Creating SDK directory at: $sdkPath"
New-Item -ItemType Directory -Force -Path $sdkPath | Out-Null

# Change to SDK directory
Set-Location $sdkPath

# Download command line tools
Write-Host "Downloading Android Command Line Tools..."
$url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
Invoke-WebRequest -Uri $url -OutFile "commandlinetools.zip"

# Extract tools
Write-Host "Extracting command line tools..."
Expand-Archive -Path "commandlinetools.zip" -DestinationPath "." -Force

# Create proper directory structure
New-Item -ItemType Directory -Force -Path "cmdline-tools\latest" | Out-Null
Get-ChildItem "cmdline-tools" | Where-Object { $_.Name -ne "latest" } | Move-Item -Destination "cmdline-tools\latest"

# Accept licenses
Write-Host "Accepting SDK licenses..."
$env:JAVA_HOME = "C:\Program Files\Android\jdk\microsoft_dist_openjdk_11.0.16.8"
$licenseCommand = ".\cmdline-tools\latest\bin\sdkmanager.bat --licenses"
$process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c echo y | $licenseCommand" -Wait -PassThru

# Install required SDK components
Write-Host "Installing SDK components..."
$installCommand = ".\cmdline-tools\latest\bin\sdkmanager.bat `"platform-tools`" `"platforms;android-34`" `"build-tools;34.0.0`""
Start-Process -FilePath "cmd.exe" -ArgumentList "/c $installCommand" -Wait

Write-Host "Android SDK setup complete!" -ForegroundColor Green
Write-Host "You can now build the APK using:" -ForegroundColor Yellow
Write-Host "cd 'C:\Users\Amine\Desktop\Ionic\car-document-manager\android'" -ForegroundColor Cyan
Write-Host ".\gradlew assembleDebug" -ForegroundColor Cyan

# Set environment variable for current session
$env:ANDROID_HOME = $sdkPath
Write-Host "ANDROID_HOME set to: $env:ANDROID_HOME" -ForegroundColor Green

# Return to project directory
Set-Location "C:\Users\Amine\Desktop\Ionic\car-document-manager"
