// Firebase initialization and service - LAZY LOADING VERSION
// All Firebase SDK imports are dynamic to prevent page load crashes

import { StudentSchool, AuditLog, User, Lesson, QuestionJob, UserRole } from '../types';

// Firebase instances - lazy loaded
let app: any = null;
let auth: any = null;
let db: any = null;
let firebaseModulesLoaded = false;

// Check if Firebase is configured AND enabled (no SDK import needed)
export function isFirebaseConfigured(): boolean {
    try {
        const appMode = import.meta.env.VITE_APP_MODE;
        if (appMode !== 'firebase') {
            return false;
        }
        if (import.meta.env.VITE_FIREBASE_API_KEY) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

// Lazy load Firebase SDK modules
const loadFirebaseModules = async () => {
    if (firebaseModulesLoaded && app && auth && db) {
        return { app, auth, db };
    }

    if (!isFirebaseConfigured()) {
        throw new Error('Firebase is not configured. Please set VITE_APP_MODE=firebase');
    }

    // Dynamic imports - only load when actually needed
    const [firebaseApp, firebaseAuth, firebaseFirestore] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore')
    ]);

    const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    app = firebaseApp.initializeApp(firebaseConfig);
    auth = firebaseAuth.getAuth(app);
    db = firebaseFirestore.getFirestore(app);
    firebaseModulesLoaded = true;

    return { app, auth, db };
};

// Auth functions
export const firebaseLogin = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
        const { auth, db } = await loadFirebaseModules();
        const firebaseAuth = await import('firebase/auth');
        const firebaseFirestore = await import('firebase/firestore');

        const userCredential = await firebaseAuth.signInWithEmailAndPassword(auth, email, password);

        // Get user profile from Firestore
        const userDoc = await firebaseFirestore.getDoc(
            firebaseFirestore.doc(db, 'users', userCredential.user.uid)
        );

        if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            return { success: true, user: userData };
        } else {
            // Create default user profile
            const newUser: User = {
                id: userCredential.user.uid,
                name: userCredential.user.email?.split('@')[0] || 'User',
                email: userCredential.user.email || '',
                role: UserRole.STUDENT
            };
            await firebaseFirestore.setDoc(
                firebaseFirestore.doc(db, 'users', userCredential.user.uid),
                newUser
            );
            return { success: true, user: newUser };
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.code === 'auth/wrong-password' ? 'パスワードが違います' :
                error.code === 'auth/user-not-found' ? 'ユーザーが見つかりません' :
                    error.code === 'auth/invalid-credential' ? 'メールアドレスまたはパスワードが間違っています' :
                        error.message
        };
    }
};

// New user registration
export const firebaseRegister = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = UserRole.STUDENT
): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
        const { auth, db } = await loadFirebaseModules();
        const firebaseAuth = await import('firebase/auth');
        const firebaseFirestore = await import('firebase/firestore');

        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(auth, email, password);

        // Create user profile in Firestore
        const newUser: User = {
            id: userCredential.user.uid,
            name: name || email.split('@')[0],
            email: email,
            role: role
        };

        await firebaseFirestore.setDoc(
            firebaseFirestore.doc(db, 'users', userCredential.user.uid),
            newUser
        );

        return { success: true, user: newUser };
    } catch (error: any) {
        return {
            success: false,
            error: error.code === 'auth/email-already-in-use' ? 'このメールアドレスは既に登録されています' :
                error.code === 'auth/weak-password' ? 'パスワードは6文字以上にしてください' :
                    error.code === 'auth/invalid-email' ? 'メールアドレスの形式が正しくありません' :
                        error.message
        };
    }
};

// Password reset
export const firebaseResetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const { auth } = await loadFirebaseModules();
        const firebaseAuth = await import('firebase/auth');

        await firebaseAuth.sendPasswordResetEmail(auth, email);
        return { success: true };
    } catch (error: any) {
        return {
            success: false,
            error: error.code === 'auth/user-not-found' ? 'このメールアドレスは登録されていません' :
                error.code === 'auth/invalid-email' ? 'メールアドレスの形式が正しくありません' :
                    error.message
        };
    }
};

export const firebaseLogout = async () => {
    const { auth } = await loadFirebaseModules();
    const firebaseAuth = await import('firebase/auth');
    await firebaseAuth.signOut(auth);
};

// Listen to auth state changes
export const onAuthChange = async (callback: (user: any | null) => void) => {
    const { auth } = await loadFirebaseModules();
    const firebaseAuth = await import('firebase/auth');
    return firebaseAuth.onAuthStateChanged(auth, callback);
};

// Get user from Firestore
export const getUser = async (userId: string): Promise<User | null> => {
    const { db } = await loadFirebaseModules();
    const firebaseFirestore = await import('firebase/firestore');
    const docSnap = await firebaseFirestore.getDoc(
        firebaseFirestore.doc(db, 'users', userId)
    );
    return docSnap.exists() ? docSnap.data() as User : null;
};

// Update user in Firestore
export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
    const { db } = await loadFirebaseModules();
    const firebaseFirestore = await import('firebase/firestore');
    await firebaseFirestore.updateDoc(
        firebaseFirestore.doc(db, 'users', userId),
        data
    );
};

// Firestore CRUD operations
export const firestoreOperations = {
    getUser,
    updateUser,

    async getSchools(studentId: string): Promise<StudentSchool[]> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        const q = fs.query(fs.collection(db, 'schools'), fs.where('studentId', '==', studentId));
        const snapshot = await fs.getDocs(q);
        return snapshot.docs.map(d => {
            const data = d.data() as Record<string, unknown>;
            return { id: d.id, ...data } as StudentSchool;
        });
    },

    async saveSchool(school: StudentSchool): Promise<void> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        await fs.setDoc(fs.doc(db, 'schools', school.id), school);
    },

    async deleteSchool(schoolId: string): Promise<void> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        await fs.deleteDoc(fs.doc(db, 'schools', schoolId));
    },

    async getLesson(lessonId: string): Promise<Lesson | null> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        const docSnap = await fs.getDoc(fs.doc(db, 'lessons', lessonId));
        return docSnap.exists() ? docSnap.data() as Lesson : null;
    },

    async saveLesson(lesson: Lesson): Promise<void> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        await fs.setDoc(fs.doc(db, 'lessons', lesson.id), lesson);
    },

    async getQuestions(studentId?: string): Promise<QuestionJob[]> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        let q;
        if (studentId) {
            q = fs.query(fs.collection(db, 'questions'), fs.where('studentId', '==', studentId), fs.orderBy('createdAt', 'desc'));
        } else {
            q = fs.query(fs.collection(db, 'questions'), fs.orderBy('createdAt', 'desc'));
        }
        const snapshot = await fs.getDocs(q);
        return snapshot.docs.map(d => {
            const data = d.data() as Record<string, unknown>;
            return { id: d.id, ...data } as QuestionJob;
        });
    },

    async saveQuestion(question: QuestionJob): Promise<void> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        await fs.setDoc(fs.doc(db, 'questions', question.id), question);
    },

    async addAuditLog(log: AuditLog): Promise<void> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        await fs.setDoc(fs.doc(db, 'audit_logs', log.id), log);
    },

    async getAuditLogs(limit: number = 100): Promise<AuditLog[]> {
        const { db } = await loadFirebaseModules();
        const fs = await import('firebase/firestore');
        const q = fs.query(fs.collection(db, 'audit_logs'), fs.orderBy('at', 'desc'));
        const snapshot = await fs.getDocs(q);
        return snapshot.docs.slice(0, limit).map(d => d.data() as AuditLog);
    }
};

export default {
    isFirebaseConfigured,
    firebaseLogin,
    firebaseLogout,
    onAuthChange,
    getUser,
    updateUser,
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
