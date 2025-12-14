// Firebase Cloud Messaging (FCM) Service
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';

let messaging: Messaging | null = null;

// Firebase config
const getFirebaseConfig = () => ({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
});

// Initialize FCM
const initializeMessaging = (): Messaging | null => {
    if (messaging) return messaging;

    try {
        const config = getFirebaseConfig();
        if (!config.apiKey) return null;

        let app;
        if (getApps().length === 0) {
            app = initializeApp(config);
        } else {
            app = getApps()[0];
        }

        messaging = getMessaging(app);
        return messaging;
    } catch (error) {
        console.error('FCM initialization failed:', error);
        return null;
    }
};

// Request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
    try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return null;
        }

        // Request permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.log('Notification permission denied');
            return null;
        }

        // Get FCM token
        const fcmMessaging = initializeMessaging();
        if (!fcmMessaging) return null;

        // VAPID key would be set here for web push
        // For now, we'll use a placeholder - in production, this should be your actual VAPID key
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

        if (!vapidKey) {
            console.log('VAPID key not configured, using local notifications only');
            return null;
        }

        const token = await getToken(fcmMessaging, { vapidKey });
        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('Error getting FCM token:', error);
        return null;
    }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
    const fcmMessaging = initializeMessaging();
    if (!fcmMessaging) return () => { };

    return onMessage(fcmMessaging, (payload) => {
        console.log('Foreground message received:', payload);
        callback(payload);
    });
};

// Show local notification (for browsers without FCM)
export const showLocalNotification = (title: string, options?: NotificationOptions): boolean => {
    try {
        if (!('Notification' in window)) return false;
        if (Notification.permission !== 'granted') return false;

        new Notification(title, {
            icon: '/vite.svg',
            badge: '/vite.svg',
            ...options
        });
        return true;
    } catch (error) {
        console.error('Error showing notification:', error);
        return false;
    }
};

// Schedule local notification (for homework reminders)
export const scheduleHomeworkReminder = (
    homeworkTitle: string,
    daysRemaining: number
): void => {
    if (daysRemaining <= 0) {
        showLocalNotification('宿題の期限です！', {
            body: `「${homeworkTitle}」の期限が今日です。`,
            tag: 'homework-due',
            requireInteraction: true
        });
    } else if (daysRemaining === 1) {
        showLocalNotification('宿題の期限が明日です', {
            body: `「${homeworkTitle}」の期限は明日です。`,
            tag: 'homework-reminder'
        });
    }
};

// Notification permission status
export const getNotificationPermissionStatus = (): 'granted' | 'denied' | 'default' | 'unsupported' => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
};

export default {
    requestNotificationPermission,
    onForegroundMessage,
    showLocalNotification,
    scheduleHomeworkReminder,
    getNotificationPermissionStatus
};
