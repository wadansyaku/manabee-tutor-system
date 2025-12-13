// Admin Database Seeder Component
// A web-based tool to seed initial data into Firestore (Admin only)
import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { isFirebaseConfigured } from '../../services/firebaseService';

interface DatabaseSeederProps {
    currentUser: User;
    onAudit: (action: string, summary: string) => void;
}

// Initial seed data matching local storage users
const SEED_USERS = [
    {
        id: 'admin-001',
        email: 'admin@manabee.com',
        name: '管理者',
        role: 'ADMIN' as UserRole,
        isActive: true,
    },
    {
        id: 'tutor-001',
        email: 'sensei@manabee.com',
        name: '鈴木先生',
        role: 'TUTOR' as UserRole,
        isActive: true,
    },
    {
        id: 'guardian-001',
        email: 'mom@manabee.com',
        name: '山田母',
        role: 'GUARDIAN' as UserRole,
        studentIds: ['student-001', 'student-002'],
        isActive: true,
    },
    {
        id: 'student-001',
        email: 'taro@manabee.com',
        name: '山田太郎',
        role: 'STUDENT' as UserRole,
        guardianId: 'guardian-001',
        grade: 6,
        avatar: '🎒',
        isActive: true,
    },
    {
        id: 'student-002',
        email: 'hanako@manabee.com',
        name: '山田花子',
        role: 'STUDENT' as UserRole,
        guardianId: 'guardian-001',
        grade: 4,
        avatar: '🌸',
        isActive: true,
    }
];

export const DatabaseSeeder: React.FC<DatabaseSeederProps> = ({ currentUser, onAudit }) => {
    const [status, setStatus] = useState<'idle' | 'seeding' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (log: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
    };

    const handleSeed = async () => {
        if (!isFirebaseConfigured()) {
            setStatus('error');
            setMessage('Firebase is not configured. Please set up Firebase first.');
            return;
        }

        if (!confirm('データベースに初期データを投入しますか？既存データが上書きされる可能性があります。')) {
            return;
        }

        setStatus('seeding');
        setMessage('');
        setLogs([]);

        try {
            // Dynamic import of Firestore
            const { getFirestore, doc, setDoc, collection, addDoc } = await import('firebase/firestore');
            const { getApp } = await import('firebase/app');

            const db = getFirestore(getApp());
            addLog('Firestore接続成功');

            // Seed users
            addLog('ユーザーデータ投入中...');
            for (const user of SEED_USERS) {
                await setDoc(doc(db, 'users', user.id), {
                    ...user,
                    createdAt: new Date().toISOString()
                });
                addLog(`✓ 作成: ${user.name} (${user.role})`);
            }

            // Seed system config
            addLog('システム設定投入中...');
            await setDoc(doc(db, 'system_config', 'global'), {
                maintenanceMode: false,
                maintenanceMessage: 'システムメンテナンス中です。',
                aiRateLimit: 10,
                maxStudentsPerGuardian: 5,
                sessionTimeoutMinutes: 60,
                enableNotifications: true,
                enableAIFeatures: true,
                updatedAt: new Date().toISOString()
            });
            addLog('✓ システム設定完了');

            // Create audit log
            addLog('監査ログ作成中...');
            await addDoc(collection(db, 'audit_logs'), {
                userId: currentUser.id,
                userName: currentUser.name,
                userRole: currentUser.role,
                action: 'database_seeded',
                summary: `初期データ投入完了 (${SEED_USERS.length}ユーザー)`,
                at: new Date().toISOString()
            });
            addLog('✓ 監査ログ作成完了');

            setStatus('success');
            setMessage(`データベース初期化完了！ ${SEED_USERS.length}ユーザー作成`);
            onAudit('database_seeded', `Firestoreに初期データを投入 (${SEED_USERS.length}ユーザー)`);

        } catch (error: any) {
            console.error('Seed error:', error);
            setStatus('error');
            setMessage(`エラー: ${error.message}`);
            addLog(`❌ エラー: ${error.message}`);
        }
    };

    const handleClearLogs = () => {
        setLogs([]);
        setStatus('idle');
        setMessage('');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm opacity-80">システム管理</p>
                        <h1 className="text-2xl font-bold">データベース初期化</h1>
                        <p className="opacity-80 text-sm mt-1">Firestoreに初期データを投入</p>
                    </div>
                    <span className="text-4xl">🗄️</span>
                </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="font-semibold text-yellow-800">注意</p>
                        <p className="text-sm text-yellow-700">
                            この操作はFirestoreに初期データを投入します。既存の同IDデータは上書きされます。
                        </p>
                    </div>
                </div>
            </div>

            {/* Status */}
            {status !== 'idle' && (
                <div className={`rounded-2xl p-4 ${status === 'seeding' ? 'bg-blue-50 border border-blue-200' :
                        status === 'success' ? 'bg-green-50 border border-green-200' :
                            'bg-red-50 border border-red-200'
                    }`}>
                    <p className={`font-semibold ${status === 'seeding' ? 'text-blue-700' :
                            status === 'success' ? 'text-green-700' :
                                'text-red-700'
                        }`}>
                        {status === 'seeding' ? '⏳ 処理中...' :
                            status === 'success' ? '✅ 成功' :
                                '❌ エラー'}
                    </p>
                    {message && <p className="text-sm mt-1">{message}</p>}
                </div>
            )}

            {/* Seed Data Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📦 投入予定データ</h3>
                <div className="space-y-3">
                    {SEED_USERS.map(user => (
                        <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-lg">
                                {user.avatar || user.name[0]}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                    user.role === 'TUTOR' ? 'bg-blue-100 text-blue-700' :
                                        user.role === 'GUARDIAN' ? 'bg-pink-100 text-pink-700' :
                                            'bg-green-100 text-green-700'
                                }`}>
                                {user.role}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logs */}
            {logs.length > 0 && (
                <div className="bg-gray-900 rounded-2xl p-4 font-mono text-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400">実行ログ</span>
                        <button
                            onClick={handleClearLogs}
                            className="text-xs text-gray-500 hover:text-white"
                        >
                            クリア
                        </button>
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                        {logs.map((log, i) => (
                            <p key={i} className="text-green-400">{log}</p>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleSeed}
                    disabled={status === 'seeding'}
                    className={`flex-1 py-4 rounded-xl font-semibold text-lg transition ${status === 'seeding'
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg'
                        }`}
                >
                    {status === 'seeding' ? '処理中...' : '🚀 データベース初期化を実行'}
                </button>
            </div>
        </div>
    );
};

export default DatabaseSeeder;
