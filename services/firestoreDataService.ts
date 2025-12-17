// Firestore Data Service
// CRUD operations for all data types with real-time sync

import { Goal, GoalStatus, Attendance, StudyLog, HomeworkItem, AnalyticsEvent } from '../types';

// Dynamic import for Firebase
const getFirestoreDb = async () => {
    const { getFirestore, getApp } = await import('firebase/app');
    const { getFirestore: getFs } = await import('firebase/firestore');
    return getFs(getApp());
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

interface Notification {
    id?: string;
    userId: string;
    type: 'homework' | 'lesson' | 'message' | 'achievement' | 'system';
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
    actionUrl?: string;
}

export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const { collection, addDoc, Timestamp } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const docRef = await addDoc(collection(db, 'notifications'), {
        ...notification,
        createdAt: Timestamp.now(),
    });

    return {
        id: docRef.id,
        ...notification,
        createdAt: new Date().toISOString(),
    };
}

export async function getNotifications(userId: string): Promise<Notification[]> {
    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
    })) as Notification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
    const { doc, updateDoc } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
    const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
    const db = await getFirestoreDb();

    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(docSnap => {
        batch.update(docSnap.ref, { read: true });
    });

    await batch.commit();
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
