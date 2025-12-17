// Real-time Firestore Sync Hooks
// Custom React hooks for subscribing to Firestore data changes

import { useState, useEffect, useCallback } from 'react';
import { User, Goal, Attendance, StudyLog } from '../types';

interface FirestoreHookState<T> {
    data: T[];
    loading: boolean;
    error: string | null;
}

// Generic hook for real-time Firestore collection subscription
export function useFirestoreCollection<T>(
    collectionName: string,
    queryConstraints: {
        field?: string;
        operator?: '==' | '!=' | '<' | '<=' | '>' | '>=';
        value?: any;
        orderByField?: string;
        orderDirection?: 'asc' | 'desc';
        limitCount?: number;
    } = {}
): FirestoreHookState<T> & { refetch: () => void } {
    const [state, setState] = useState<FirestoreHookState<T>>({
        data: [],
        loading: true,
        error: null,
    });

    const subscribe = useCallback(async () => {
        if (import.meta.env.VITE_APP_MODE !== 'firebase') {
            setState({ data: [], loading: false, error: null });
            return () => { };
        }

        try {
            const { getFirestore } = await import('firebase/firestore');
            const { getApp } = await import('firebase/app');
            const { collection, query, where, orderBy, limit, onSnapshot } = await import('firebase/firestore');

            const db = getFirestore(getApp());
            let q = query(collection(db, collectionName));

            if (queryConstraints.field && queryConstraints.operator && queryConstraints.value !== undefined) {
                q = query(q, where(queryConstraints.field, queryConstraints.operator, queryConstraints.value));
            }
            if (queryConstraints.orderByField) {
                q = query(q, orderBy(queryConstraints.orderByField, queryConstraints.orderDirection || 'desc'));
            }
            if (queryConstraints.limitCount) {
                q = query(q, limit(queryConstraints.limitCount));
            }

            const unsubscribe = onSnapshot(
                q,
                (snapshot) => {
                    const docs = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        // Convert Firestore timestamps
                        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
                        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
                    })) as T[];

                    setState({ data: docs, loading: false, error: null });
                },
                (error) => {
                    console.error(`Firestore subscription error for ${collectionName}:`, error);
                    setState(prev => ({ ...prev, loading: false, error: error.message }));
                }
            );

            return unsubscribe;
        } catch (error: any) {
            console.error('Failed to set up Firestore subscription:', error);
            setState({ data: [], loading: false, error: error.message });
            return () => { };
        }
    }, [collectionName, JSON.stringify(queryConstraints)]);

    useEffect(() => {
        let unsubscribe: (() => void) | void;

        subscribe().then(unsub => {
            unsubscribe = unsub;
        });

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [subscribe]);

    const refetch = () => {
        setState(prev => ({ ...prev, loading: true }));
        subscribe();
    };

    return { ...state, refetch };
}

// Specialized hooks for specific data types

export function useGoals(studentId: string) {
    return useFirestoreCollection<Goal>('goals', {
        field: 'studentId',
        operator: '==',
        value: studentId,
        orderByField: 'createdAt',
        orderDirection: 'desc',
    });
}

export function useAttendance(tutorId: string) {
    return useFirestoreCollection<Attendance>('attendance', {
        field: 'tutorId',
        operator: '==',
        value: tutorId,
        orderByField: 'date',
        orderDirection: 'desc',
        limitCount: 50,
    });
}

export function useStudyLogs(studentId: string) {
    return useFirestoreCollection<StudyLog>('study_logs', {
        field: 'studentId',
        operator: '==',
        value: studentId,
        orderByField: 'date',
        orderDirection: 'desc',
        limitCount: 30,
    });
}

export function useNotifications(userId: string) {
    interface Notification {
        id: string;
        userId: string;
        type: string;
        title: string;
        body: string;
        read: boolean;
        createdAt: string;
    }

    return useFirestoreCollection<Notification>('notifications', {
        field: 'userId',
        operator: '==',
        value: userId,
        orderByField: 'createdAt',
        orderDirection: 'desc',
        limitCount: 50,
    });
}

// Hook for single document subscription
export function useFirestoreDocument<T>(
    collectionName: string,
    documentId: string | null
): { data: T | null; loading: boolean; error: string | null } {
    const [state, setState] = useState<{
        data: T | null;
        loading: boolean;
        error: string | null;
    }>({
        data: null,
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!documentId || import.meta.env.VITE_APP_MODE !== 'firebase') {
            setState({ data: null, loading: false, error: null });
            return;
        }

        let unsubscribe: (() => void) | undefined;

        const subscribe = async () => {
            try {
                const { getFirestore } = await import('firebase/firestore');
                const { getApp } = await import('firebase/app');
                const { doc, onSnapshot } = await import('firebase/firestore');

                const db = getFirestore(getApp());
                const docRef = doc(db, collectionName, documentId);

                unsubscribe = onSnapshot(
                    docRef,
                    (snapshot) => {
                        if (snapshot.exists()) {
                            setState({
                                data: { id: snapshot.id, ...snapshot.data() } as T,
                                loading: false,
                                error: null,
                            });
                        } else {
                            setState({ data: null, loading: false, error: 'Document not found' });
                        }
                    },
                    (error) => {
                        setState({ data: null, loading: false, error: error.message });
                    }
                );
            } catch (error: any) {
                setState({ data: null, loading: false, error: error.message });
            }
        };

        subscribe();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [collectionName, documentId]);

    return state;
}

// Presence tracking
export function usePresence(userId: string) {
    useEffect(() => {
        if (import.meta.env.VITE_APP_MODE !== 'firebase' || !userId) return;

        const updatePresence = async (online: boolean) => {
            try {
                const { getDatabase, ref, set, onDisconnect, serverTimestamp } = await import('firebase/database');
                const { getApp } = await import('firebase/app');

                const db = getDatabase(getApp());
                const presenceRef = ref(db, `presence/${userId}`);

                if (online) {
                    await set(presenceRef, {
                        online: true,
                        lastSeen: serverTimestamp(),
                    });

                    onDisconnect(presenceRef).set({
                        online: false,
                        lastSeen: serverTimestamp(),
                    });
                }
            } catch (error) {
                console.error('Presence update failed:', error);
            }
        };

        updatePresence(true);

        const handleVisibilityChange = () => {
            updatePresence(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            updatePresence(false);
        };
    }, [userId]);
}
