import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { MOCK_SCHOOLS, MOCK_LESSON, MOCK_USERS } from '../constants';

// Firebase imports
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';

interface DatabaseSeederProps {
    currentUser: User;
}

// Initial seed data with passwords
const SEED_USERS = [
    { id: 'admin1', name: '管理者', role: UserRole.ADMIN, email: 'admin@manabee.com', password: 'admin123' },
    { id: 't1', name: '佐藤 先生', role: UserRole.TUTOR, email: 'tutor@manabee.com', password: 'tutor123', students: ['s1'] },
    { id: 's1', name: '山田 花子', role: UserRole.STUDENT, email: 'student@manabee.com' },
    { id: 'g1', name: '山田 母', role: UserRole.GUARDIAN, email: 'mom@manabee.com', password: 'mom123', children: ['s1'] },
];

export const DatabaseSeeder: React.FC<DatabaseSeederProps> = ({ currentUser }) => {
    const [status, setStatus] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
    };

    const getFirebaseConfig = () => {
        return {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
    };

    const initFirebase = () => {
        const config = getFirebaseConfig();
        if (!config.apiKey) {
            throw new Error('Firebase configuration not found in environment variables');
        }
        if (getApps().length === 0) {
            initializeApp(config);
        }
        return { db: getFirestore(), auth: getAuth() };
    };

    const seedUsers = async () => {
        setIsLoading(true);
        setStatus('ユーザーデータをシード中...');
        addLog('Starting user seeding...');

        try {
            const { db, auth } = initFirebase();

            for (const userData of SEED_USERS) {
                try {
                    // Create auth user if password exists
                    if (userData.password) {
                        try {
                            await createUserWithEmailAndPassword(auth, userData.email, userData.password);
                            addLog(`Auth user created: ${userData.email}`);
                        } catch (authError: any) {
                            if (authError.code === 'auth/email-already-in-use') {
                                addLog(`Auth user already exists: ${userData.email}`);
                            } else {
                                throw authError;
                            }
                        }
                    }

                    // Create Firestore user document
                    const { password, ...userDoc } = userData;
                    await setDoc(doc(db, 'users', userData.id), {
                        ...userDoc,
                        isInitialPassword: true,
                        createdAt: new Date().toISOString()
                    });
                    addLog(`Firestore user created: ${userData.name}`);
                } catch (error: any) {
                    addLog(`Error creating ${userData.email}: ${error.message}`);
                }
            }

            setStatus('ユーザーシード完了 ✅');
        } catch (error: any) {
            setStatus(`エラー: ${error.message}`);
            addLog(`Fatal error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const seedSchools = async () => {
        setIsLoading(true);
        setStatus('受験校データをシード中...');
        addLog('Starting schools seeding...');

        try {
            const { db } = initFirebase();

            for (const school of MOCK_SCHOOLS) {
                await setDoc(doc(db, 'schools', school.id), {
                    ...school,
                    createdAt: new Date().toISOString()
                });
                addLog(`School created: ${school.name}`);
            }

            setStatus('受験校シード完了 ✅');
        } catch (error: any) {
            setStatus(`エラー: ${error.message}`);
            addLog(`Fatal error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const seedLesson = async () => {
        setIsLoading(true);
        setStatus('授業データをシード中...');
        addLog('Starting lesson seeding...');

        try {
            const { db } = initFirebase();

            await setDoc(doc(db, 'lessons', MOCK_LESSON.id), {
                ...MOCK_LESSON,
                createdAt: new Date().toISOString()
            });
            addLog(`Lesson created: ${MOCK_LESSON.id}`);

            setStatus('授業シード完了 ✅');
        } catch (error: any) {
            setStatus(`エラー: ${error.message}`);
            addLog(`Fatal error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const seedAll = async () => {
        setLogs([]);
        await seedUsers();
        await seedSchools();
        await seedLesson();
        setStatus('全データシード完了 ✅');
    };

    const clearCollection = async (collectionName: string) => {
        setIsLoading(true);
        setStatus(`${collectionName}コレクションをクリア中...`);
        addLog(`Clearing ${collectionName} collection...`);

        try {
            const { db } = initFirebase();
            const snapshot = await getDocs(collection(db, collectionName));

            for (const docRef of snapshot.docs) {
                await deleteDoc(docRef.ref);
                addLog(`Deleted: ${docRef.id}`);
            }

            setStatus(`${collectionName}クリア完了 ✅`);
        } catch (error: any) {
            setStatus(`エラー: ${error.message}`);
            addLog(`Fatal error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (currentUser.role !== UserRole.ADMIN) {
        return (
            <div className="p-8 text-center text-gray-500">
                管理者のみアクセス可能です
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">データベースシーダー</h1>
                <p className="text-gray-500 mb-6">
                    Firestoreに初期データを投入します。本番環境での使用に注意してください。
                </p>

                {/* Status */}
                {status && (
                    <div className={`mb-6 p-4 rounded-lg ${status.includes('エラー') ? 'bg-red-50 text-red-800' :
                            status.includes('✅') ? 'bg-green-50 text-green-800' :
                                'bg-blue-50 text-blue-800'
                        }`}>
                        {status}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <button
                        onClick={seedUsers}
                        disabled={isLoading}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        👥 ユーザー
                    </button>
                    <button
                        onClick={seedSchools}
                        disabled={isLoading}
                        className="px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                        🏫 受験校
                    </button>
                    <button
                        onClick={seedLesson}
                        disabled={isLoading}
                        className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                        📖 授業
                    </button>
                    <button
                        onClick={seedAll}
                        disabled={isLoading}
                        className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-colors font-bold"
                    >
                        ⚡ 全て
                    </button>
                </div>

                {/* Danger Zone */}
                <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-red-600 mb-3">⚠️ 危険ゾーン</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => clearCollection('users')}
                            disabled={isLoading}
                            className="px-3 py-2 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                        >
                            ユーザークリア
                        </button>
                        <button
                            onClick={() => clearCollection('schools')}
                            disabled={isLoading}
                            className="px-3 py-2 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                        >
                            受験校クリア
                        </button>
                        <button
                            onClick={() => clearCollection('lessons')}
                            disabled={isLoading}
                            className="px-3 py-2 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                        >
                            授業クリア
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs */}
            {logs.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 text-sm font-mono">
                    <h3 className="text-gray-400 mb-2">実行ログ</h3>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {logs.map((log, i) => (
                            <div key={i} className={`${log.includes('Error') || log.includes('error') ? 'text-red-400' :
                                    log.includes('created') || log.includes('完了') ? 'text-green-400' :
                                        'text-gray-300'
                                }`}>
                                {log}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <h3 className="font-bold mb-2">📋 使用手順</h3>
                <ol className="list-decimal list-inside space-y-1">
                    <li><code className="bg-amber-100 px-1 rounded">.env</code>のVITE_APP_MODEを<code className="bg-amber-100 px-1 rounded">firebase</code>に変更</li>
                    <li>アプリを再起動（npm run dev）</li>
                    <li>「⚡ 全て」ボタンでデータをシード</li>
                    <li>Firebase Consoleでデータを確認</li>
                </ol>
            </div>
        </div>
    );
};
