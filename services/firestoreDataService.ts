// Firestore Data Service
// CRUD operations for all data types with real-time sync

import {
    Goal,
    GoalStatus,
    Attendance,
    StudyLog,
    HomeworkItem,
    AnalyticsEvent,
    NotificationItem,
    NotificationQueryOptions,
    NotificationSettings,
} from '../types';

// Dynamic import for Firebase
const getFirestoreDb = async () => {
    const { getApp } = await import('firebase/app');
    const { getFirestore } = await import('firebase/firestore');
    return getFirestore(getApp());
};

// ============ GOALS ============

export async function createGoal(goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Goal> {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const docRef = await addDoc(collection(db, 'goals'), {
        ...goal,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return {
        id: docRef.id,
        ...goal,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

export async function getGoals(studentId: string): Promise<Goal[]> {
    const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const q = query(
        collection(db, 'goals'),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as Goal[];
}

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<void> {
    const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    await updateDoc(doc(db, 'goals', goalId), {
        ...updates,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteGoal(goalId: string): Promise<void> {
    const { doc, deleteDoc } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    await deleteDoc(doc(db, 'goals', goalId));
}

// ============ HOMEWORK ============

export async function createHomework(homework: Omit<HomeworkItem, 'id'>): Promise<HomeworkItem> {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const docRef = await addDoc(collection(db, 'homework'), {
        ...homework,
        createdAt: Timestamp.now(),
    });

    return {
        id: docRef.id,
        ...homework,
    };
}

export async function getHomework(studentId?: string): Promise<HomeworkItem[]> {
    const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    let q = query(collection(db, 'homework'), orderBy('dueDate', 'asc'));

    if (studentId) {
        q = query(
            collection(db, 'homework'),
            where('studentId', '==', studentId),
            orderBy('dueDate', 'asc')
        );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    })) as HomeworkItem[];
}

export async function updateHomework(homeworkId: string, updates: Partial<HomeworkItem>): Promise<void> {
    const { doc, updateDoc } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    await updateDoc(doc(db, 'homework', homeworkId), updates);
}

// ============ ATTENDANCE ============

export async function createAttendance(attendance: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<Attendance> {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const docRef = await addDoc(collection(db, 'attendance'), {
        ...attendance,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });

    return {
        id: docRef.id,
        ...attendance,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
}

export async function getAttendance(filters: {
    tutorId?: string;
    studentId?: string;
    month?: string;
}): Promise<Attendance[]> {
    const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    let q = query(collection(db, 'attendance'), orderBy('date', 'desc'));

    if (filters.tutorId) {
        q = query(q, where('tutorId', '==', filters.tutorId));
    }
    if (filters.studentId) {
        q = query(q, where('studentId', '==', filters.studentId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
    })) as Attendance[];
}

// ============ STUDY LOGS ============

export async function createStudyLog(log: Omit<StudyLog, 'id' | 'createdAt'>): Promise<StudyLog> {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const docRef = await addDoc(collection(db, 'study_logs'), {
        ...log,
        createdAt: Timestamp.now(),
    });

    return {
        id: docRef.id,
        ...log,
        createdAt: new Date().toISOString(),
    };
}

export async function getStudyLogs(studentId: string, days: number = 7): Promise<StudyLog[]> {
    const { collection, query, where, getDocs, orderBy, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const q = query(
        collection(db, 'study_logs'),
        where('studentId', '==', studentId),
        where('date', '>=', startDate.toISOString().split('T')[0]),
        orderBy('date', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    })) as StudyLog[];
}

// ============ NOTIFICATIONS ============

export const defaultNotificationSettings: NotificationSettings = {
    homeworkReminder: { enabled: true, offsets: [24, 3] }, // hours before
    lessonReminder: { enabled: true, offsets: [180, 60] }, // minutes before
    achievement: { enabled: true, offsets: [0] },
};

const mapNotificationDoc = (doc: any): NotificationItem => ({
    id: doc.id,
    ...doc.data(),
    priority: doc.data().priority || 'normal',
    readAt: doc.data().readAt?.toDate?.()?.toISOString() || doc.data().readAt || null,
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
});

export async function createNotification(notification: Omit<NotificationItem, 'id' | 'createdAt'>): Promise<NotificationItem> {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        readAt: notification.readAt || null,
        createdAt: Timestamp.now(),
        read: Boolean(notification.readAt),
    });

    return {
        id: docRef.id,
        ...notification,
        readAt: notification.readAt || null,
        createdAt: new Date().toISOString(),
    };
}

export async function getNotifications(userId: string, options: NotificationQueryOptions = {}): Promise<NotificationItem[]> {
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(options.limit || 100)
    );

    const snapshot = await getDocs(q);
    let docs = snapshot.docs.map(mapNotificationDoc) as NotificationItem[];

    if (options.categories?.length) {
        docs = docs.filter(d => options.categories!.includes(d.type));
    }

    if (options.unreadOnly) {
        docs = docs.filter(d => !d.readAt);
    }

    if (options.sortBy === 'priority') {
        const priorityOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
        docs = [...docs].sort((a, b) => {
            const pDiff = (priorityOrder[a.priority || 'normal'] ?? 1) - (priorityOrder[b.priority || 'normal'] ?? 1);
            if (pDiff !== 0) return pDiff;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    return docs;
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    await updateDoc(doc(db, 'notifications', notificationId), { read: true, readAt: Timestamp.now() });
}

export async function markAllNotificationsRead(userId: string): Promise<string[]> {
    const { collection, query, where, getDocs, writeBatch, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    const unreadIds: string[] = [];

    snapshot.docs.forEach(docSnap => {
        unreadIds.push(docSnap.id);
        batch.update(docSnap.ref, { read: true, readAt: Timestamp.now() });
    });

    await batch.commit();
    return unreadIds;
}

export async function updateNotificationsReadState(notificationIds: string[], readAt: Date | null): Promise<void> {
    if (!notificationIds.length) return;
    const { doc, writeBatch, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();
    const batch = writeBatch(db);

    notificationIds.forEach(id => {
        batch.update(doc(db, 'notifications', id), {
            read: Boolean(readAt),
            readAt: readAt ? Timestamp.fromDate(readAt) : null,
        });
    });

    await batch.commit();
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings> {
    const { doc, getDoc } = await import('firebase/firestore');
    const db = await getFirestoreDb();
    const snapshot = await getDoc(doc(db, 'notification_settings', userId));

    if (!snapshot.exists()) return defaultNotificationSettings;

    return {
        ...defaultNotificationSettings,
        ...(snapshot.data() as Partial<NotificationSettings>),
    };
}

export async function updateNotificationSettings(userId: string, updates: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const { doc, setDoc } = await import('firebase/firestore');
    const db = await getFirestoreDb();
    const merged = {
        ...defaultNotificationSettings,
        ...updates,
    };

    await setDoc(doc(db, 'notification_settings', userId), merged, { merge: true });
    return merged;
}

// ============ ANALYTICS EVENTS ============

export async function logAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    await addDoc(collection(db, 'analytics_events'), {
        ...event,
        timestamp: Timestamp.now(),
    });
}

export async function getAnalyticsEvents(filters: {
    eventType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
}): Promise<AnalyticsEvent[]> {
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    let q = query(
        collection(db, 'analytics_events'),
        orderBy('timestamp', 'desc'),
        limit(1000)
    );

    if (filters.eventType) {
        q = query(q, where('eventType', '==', filters.eventType));
    }
    if (filters.userId) {
        q = query(q, where('userId', '==', filters.userId));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp,
    })) as AnalyticsEvent[];
}
