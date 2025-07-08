# Push Notification System for Document Expiration

## Overview

This implementation provides a comprehensive push notification system that alerts users about documents approaching their expiration dates, even when the app is closed. The system works on both mobile devices (through Capacitor) and web browsers.

## Features

### 🔔 **Smart Notification Scheduling**

- **Automatic detection** of documents approaching expiration
- **Configurable notification window** (1-365 days before expiration)
- **Multiple daily notifications** at user-defined hours
- **Active document filtering** - only notifies for active documents
- **Intelligent scheduling** - prevents duplicate notifications

### ⚙️ **User Configuration**

- **Enable/disable notifications** globally
- **Set notification days** before expiration (default: 30 days)
- **Multiple notification hours** per day (default: 9:00 AM, 6:00 PM)
- **Maximum 6 notification times** per day
- **Minimum 1 notification time** required

### 🔄 **Background Processing**

- **Automatic updates** every 24 hours
- **App state monitoring** - updates when app becomes active
- **Configuration change detection** - updates when settings change
- **Document change tracking** - updates when documents are modified

## How It Works

### 1. **Initialization**

When the app starts, the notification system:

- Requests notification permissions
- Loads current configuration
- Scans all active documents
- Schedules notifications for documents within the notification window

### 2. **Document Filtering**

Only schedules notifications for documents that:

- Are marked as `documentActive: true`
- Have expiration dates within the configured notification window
- Haven't already expired

### 3. **Notification Scheduling**

For each qualifying document:

- Creates notifications for each configured hour
- Sets up daily repeating notifications
- Includes document details in the notification

### 4. **Background Updates**

The system automatically updates notifications when:

- Documents are added, edited, or deleted
- Notification settings are changed
- The app is resumed after being in background
- 24 hours have passed (periodic update)

## Configuration

### Settings Page (`/tabs/settings`)

#### **Notification Toggle**

- **Purpose**: Enable/disable all notifications
- **Effect**: When disabled, clears all scheduled notifications

#### **Notification Days**

- **Range**: 1-365 days
- **Default**: 30 days
- **Purpose**: How many days before expiration to start notifying

#### **Notification Hours**

- **Range**: 0-23 (24-hour format)
- **Default**: 9:00 AM, 6:00 PM
- **Limit**: 1-6 hours per day
- **Management**: Click chips to remove, use dropdown to add

#### **Test Notification**

- **Purpose**: Send a test notification in 5 seconds
- **Useful for**: Verifying notification permissions and functionality

## Technical Implementation

### Core Services

#### **PushNotificationService**

- Primary notification management
- Handles scheduling, updating, and canceling notifications
- Manages notification permissions and lifecycle

#### **BackgroundTaskService**

- Monitors app state changes
- Handles periodic updates
- Detects configuration changes

#### **ConfigService**

- Manages notification settings
- Provides persistent storage
- Validates configuration values

### Integration Points

#### **App Component**

- Initializes notification services on app startup
- Ensures services are ready before user interaction

#### **Documents Page**

- Triggers notification updates when documents change
- Cancels notifications for deleted documents

#### **Settings Page**

- Provides user interface for configuration
- Triggers immediate updates when settings change

## Platform Support

### **Native Mobile (iOS/Android)**

- ✅ **Full functionality** with Capacitor Local Notifications
- ✅ **Background notifications** work when app is closed
- ✅ **Notification permissions** properly requested
- ✅ **Notification actions** can open the app

### **Web Browser**

- ⚠️ **Limited functionality** - notifications only when browser is open
- ⚠️ **No background processing** when tab is closed
- ✅ **Development testing** with simulated notifications

## Usage Examples

### **Typical User Flow**

1. **Setup**: User goes to Settings and configures:

   - Enable notifications: ✅
   - Notification days: 15 days before expiration
   - Notification hours: 8:00 AM, 1:00 PM, 7:00 PM

2. **Document Management**: User adds documents with expiration dates

3. **Automatic Notifications**: System automatically:
   - Detects documents expiring within 15 days
   - Schedules notifications for 8:00 AM, 1:00 PM, and 7:00 PM daily
   - Updates notifications when documents or settings change

### **Notification Examples**

- **Immediate**: "⚠️ Assurance pour 123-ABC-456 expire demain !"
- **Week Notice**: "⚠️ Visite Technique (REF123) pour 789-DEF-012 expire dans 7 jours"
- **Month Notice**: "⚠️ Carte Grise pour 456-GHI-789 expire dans 30 jours"

## Development Notes

### **Testing**

- Use the "Test Notification" button in Settings
- Monitor browser console for notification scheduling logs
- Check local storage for saved configurations and schedules

### **Debugging**

```javascript
// Check pending notifications (in browser console)
navigator.serviceWorker.getRegistrations().then((registrations) => {
  console.log("Service workers:", registrations);
});

// Check local storage
console.log("App config:", localStorage.getItem("app_config"));
console.log("Scheduled notifications:", localStorage.getItem("scheduled_notifications"));
```

### **Customization**

To modify notification behavior:

1. Edit `generateNotificationMessage()` in `PushNotificationService`
2. Adjust `UPDATE_INTERVAL` in `BackgroundTaskService`
3. Modify default config in `ConfigService`

## Future Enhancements

- **Push notifications** via Firebase Cloud Messaging
- **Email notifications** as backup
- **SMS notifications** for critical documents
- **Calendar integration** for expiration dates
- **Advanced filtering** by document type
- **Notification history** and analytics
