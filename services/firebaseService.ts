// Firebase initialization and service
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
    getAuth,
    Auth,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import {
    getFirestore,
    Firestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { StudentSchool, AuditLog, User, Lesson, QuestionJob, UserRole } from '../types';

// Firebase config - will be loaded from environment or config file
let firebaseConfig: any = null;
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
    try {
        // Try to load config from environment variables (Vite style)
        if (import.meta.env.VITE_FIREBASE_API_KEY) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

// Initialize Firebase (lazy)
const initializeFirebase = () => {
    if (app) return { app, auth: auth!, db: db! };

    if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured. Please set up firebase.config.ts');
    }

    firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    return { app, auth, db };
};

// Auth functions
export const firebaseLogin = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
        const { auth } = initializeFirebase();
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Get user profile from Firestore
        const { db } = initializeFirebase();
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            return { success: true, user: userData };
        } else {
            // Create default user profile
            const newUser: User = {
                id: userCredential.user.uid,
                name: userCredential.user.email?.split('@')[0] || 'User',
                email: userCredential.user.email || '',
                role: UserRole.STUDENT // Default role
            };
            await setDoc(doc(db, 'users', userCredential.user.uid), newUser);
            return { success: true, user: newUser };
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.code === 'auth/wrong-password' ? 'パスワードが違います' :
                error.code === 'auth/user-not-found' ? 'ユーザーが見つかりません' :
                    error.message
        };
    }
};

export const firebaseLogout = async () => {
    const { auth } = initializeFirebase();
    await firebaseSignOut(auth);
};

// Listen to auth state changes
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
    const { auth } = initializeFirebase();
    return onAuthStateChanged(auth, callback);
};

// Firestore CRUD operations
export const firestoreOperations = {
    // Users
    async getUser(userId: string): Promise<User | null> {
        const { db } = initializeFirebase();
        const docSnap = await getDoc(doc(db, 'users', userId));
        return docSnap.exists() ? docSnap.data() as User : null;
    },

    async updateUser(userId: string, data: Partial<User>): Promise<void> {
        const { db } = initializeFirebase();
        await updateDoc(doc(db, 'users', userId), data);
    },

    // Schools
    async getSchools(studentId: string): Promise<StudentSchool[]> {
        const { db } = initializeFirebase();
        const q = query(collection(db, 'schools'), where('studentId', '==', studentId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => {
            const data = d.data() as Record<string, unknown>;
            return { id: d.id, ...data } as StudentSchool;
        });
    },

    async saveSchool(school: StudentSchool): Promise<void> {
        const { db } = initializeFirebase();
        await setDoc(doc(db, 'schools', school.id), school);
    },

    async deleteSchool(schoolId: string): Promise<void> {
        const { db } = initializeFirebase();
        await deleteDoc(doc(db, 'schools', schoolId));
    },

    // Lessons
    async getLesson(lessonId: string): Promise<Lesson | null> {
        const { db } = initializeFirebase();
        const docSnap = await getDoc(doc(db, 'lessons', lessonId));
        return docSnap.exists() ? docSnap.data() as Lesson : null;
    },

    async saveLesson(lesson: Lesson): Promise<void> {
        const { db } = initializeFirebase();
        await setDoc(doc(db, 'lessons', lesson.id), lesson);
    },

    // Questions
    async getQuestions(studentId?: string): Promise<QuestionJob[]> {
        const { db } = initializeFirebase();
        let q;
        if (studentId) {
            q = query(collection(db, 'questions'), where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
        } else {
            q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => {
            const data = d.data() as Record<string, unknown>;
            return { id: d.id, ...data } as QuestionJob;
        });
    },

    async saveQuestion(question: QuestionJob): Promise<void> {
        const { db } = initializeFirebase();
        await setDoc(doc(db, 'questions', question.id), question);
    },

    // Audit Logs
    async addAuditLog(log: AuditLog): Promise<void> {
        const { db } = initializeFirebase();
        await setDoc(doc(db, 'audit_logs', log.id), log);
    },

    async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
        const { db } = initializeFirebase();
        const q = query(collection(db, 'audit_logs'), orderBy('at', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.slice(0, limit).map(d => d.data() as AuditLog);
    }
};

export default {
    isFirebaseConfigured,
    firebaseLogin,
    firebaseLogout,
    onAuthChange,
    getUser: firestoreOperations.getUser,
    updateUser: firestoreOperations.updateUser,
    getSchools: firestoreOperations.getSchools,
    saveSchool: firestoreOperations.saveSchool,
    deleteSchool: firestoreOperations.deleteSchool,
    getLesson: firestoreOperations.getLesson,
    saveLesson: firestoreOperations.saveLesson,
    getQuestions: firestoreOperations.getQuestions,
    saveQuestion: firestoreOperations.saveQuestion,
    addAuditLog: firestoreOperations.addAuditLog,
    getAuditLogs: firestoreOperations.getAuditLogs
};
