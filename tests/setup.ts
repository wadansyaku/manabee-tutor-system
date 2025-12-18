import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage with in-memory map for stateful tests
const localStore = new Map<string, string>();
const localStorageMock = {
    getItem: vi.fn((key: string) => localStore.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { localStore.set(key, value); }),
    removeItem: vi.fn((key: string) => { localStore.delete(key); }),
    clear: vi.fn(() => localStore.clear()),
    length: 0,
    key: vi.fn()
};
global.localStorage = localStorageMock as Storage;

// Mock Firebase
vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(),
    getApps: vi.fn(() => []),
    getApp: vi.fn()
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChanged: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    onSnapshot: vi.fn()
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn()
}));

// Mock import.meta.env
vi.stubGlobal('import.meta', {
    env: {
        VITE_APP_MODE: 'local',
        VITE_FIREBASE_API_KEY: 'test-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'test-project',
        VITE_FIREBASE_STORAGE_BUCKET: 'test.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
        VITE_FIREBASE_APP_ID: '1:123:web:abc'
    }
});
