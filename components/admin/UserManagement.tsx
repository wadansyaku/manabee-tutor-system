// Admin User Management Component
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';

interface UserManagementProps {
    currentUser: User;
    onAudit: (action: string, summary: string) => void;
    onMasquerade?: (user: User) => void;
}

// Extended user with metadata for admin
interface AdminUser extends User {
    createdAt?: string;
    lastLogin?: string;
    isActive: boolean;
}

const STORAGE_KEY_ADMIN_USERS = 'manabee_admin_users_v1';

// Load/save functions
const loadAdminUsers = (): AdminUser[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_ADMIN_USERS);
        if (stored) return JSON.parse(stored);

        // Initialize from StorageService users
        const baseUsers = StorageService.loadUsers();
        return baseUsers.map(u => ({
            ...u,
            createdAt: new Date().toISOString(),
            isActive: true
        }));
    } catch { return []; }
};

const saveAdminUsers = (users: AdminUser[]) => {
    localStorage.setItem(STORAGE_KEY_ADMIN_USERS, JSON.stringify(users));
};

const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: '管理者',
    [UserRole.TUTOR]: '講師',
    [UserRole.GUARDIAN]: '保護者',
    [UserRole.STUDENT]: '生徒'
};

const ROLE_COLORS: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-700',
    [UserRole.TUTOR]: 'bg-blue-100 text-blue-700',
    [UserRole.GUARDIAN]: 'bg-pink-100 text-pink-700',
    [UserRole.STUDENT]: 'bg-green-100 text-green-700'
};

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onAudit, onMasquerade }) => {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';

    // Form state
    const [formName, setFormName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formRole, setFormRole] = useState<UserRole>(UserRole.STUDENT);

    const loadUsers = async () => {
        setIsLoading(true);
        try {
            if (isFirebaseMode) {
                const { firestoreOperations } = await import('../../services/firebaseService');
                const fbUsers = await firestoreOperations.getAllUsers();
                setUsers(fbUsers.map(u => ({ ...u, isActive: true } as AdminUser))); // Assume active for now
            } else {
                setUsers(loadAdminUsers());
            }
        } catch (error) {
            console.error('Failed to load users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [isFirebaseMode]);

    const filteredUsers = users
        .filter(u => roleFilter === 'all' || u.role === roleFilter)
        .filter(u =>
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handleAddUser = async () => {
        if (!formName.trim() || !formEmail.trim()) return;

        const newUser: AdminUser = {
            id: StorageService.generateId(),
            name: formName.trim(),
            email: formEmail.trim(),
            role: formRole,
            createdAt: new Date().toISOString(),
            isActive: true,
            isInitialPassword: true
        };

        if (isFirebaseMode) {
            try {
                const { firestoreOperations } = await import('../../services/firebaseService');
                await firestoreOperations.createUser(newUser);
                await loadUsers(); // Refresh
                onAudit('user_created', `${formName} (${ROLE_LABELS[formRole]}) を追加 (Firebase)`);
            } catch (e) {
                alert('ユーザー作成に失敗しました');
                console.error(e);
            }
        } else {
            const updated = [...users, newUser];
            setUsers(updated);
            saveAdminUsers(updated);
            onAudit('user_created', `${formName} (${ROLE_LABELS[formRole]}) を追加`);
        }

        setShowAddModal(false);
        resetForm();
    };

    const handleUpdateUser = async () => {
        if (!editingUser || !formName.trim() || !formEmail.trim()) return;

        if (isFirebaseMode) {
            try {
                const { firestoreOperations } = await import('../../services/firebaseService');
                await firestoreOperations.updateUser(editingUser.id, {
                    name: formName.trim(),
                    email: formEmail.trim(),
                    role: formRole
                });
                await loadUsers();
                onAudit('user_updated', `${formName} の情報を更新 (Firebase)`);
            } catch (e) {
                alert('更新失敗');
            }
        } else {
            const updated = users.map(u =>
                u.id === editingUser.id
                    ? { ...u, name: formName.trim(), email: formEmail.trim(), role: formRole }
                    : u
            );
            setUsers(updated);
            saveAdminUsers(updated);
            onAudit('user_updated', `${formName} の情報を更新`);
        }

        setEditingUser(null);
        resetForm();
    };

    const handleToggleActive = async (user: AdminUser) => {
        // Active status logic might need a field in Firestore 'isActive' which standard User model might lack
        // For now, assume it's local state or add field if needed.
        // If User model doesn't have isActive, we can't persist it easily in Firebase without schema change.
        // Let's assume we skip persisting detailed active/inactive state to Firebase for this MVP unless schema supports it.
        // Or we update 'updatedAt' as a keep-alive.

        // Local logic preserved:
        const updated = users.map(u =>
            u.id === user.id ? { ...u, isActive: !u.isActive } : u
        );
        setUsers(updated);

        if (!isFirebaseMode) {
            saveAdminUsers(updated);
        }
        onAudit('user_status_changed', `${user.name} を${user.isActive ? '無効化' : '有効化'}`);
    };

    const handleDeleteUser = async (user: AdminUser) => {
        if (user.id === currentUser.id) {
            alert('自分自身は削除できません');
            return;
        }
        if (!confirm(`${user.name} を削除しますか？この操作は取り消せません。`)) return;

        if (isFirebaseMode) {
            try {
                const { firestoreOperations } = await import('../../services/firebaseService');
                await firestoreOperations.deleteUser(user.id);
                await loadUsers();
                onAudit('user_deleted', `${user.name} を削除 (Firebase)`);
            } catch (e) {
                alert('削除失敗');
            }
        } else {
            const updated = users.filter(u => u.id !== user.id);
            setUsers(updated);
            saveAdminUsers(updated);
            onAudit('user_deleted', `${user.name} を削除`);
        }
    };

    const openEditModal = (user: AdminUser) => {
        setEditingUser(user);
        setFormName(user.name);
        setFormEmail(user.email);
        setFormRole(user.role);
    };

    const resetForm = () => {
        setFormName('');
        setFormEmail('');
        setFormRole(UserRole.STUDENT);
    };

    const stats = {
        total: users.length,
        active: users.filter(u => u.isActive).length,
        byRole: {
            [UserRole.ADMIN]: users.filter(u => u.role === UserRole.ADMIN).length,
            [UserRole.TUTOR]: users.filter(u => u.role === UserRole.TUTOR).length,
            [UserRole.GUARDIAN]: users.filter(u => u.role === UserRole.GUARDIAN).length,
            [UserRole.STUDENT]: users.filter(u => u.role === UserRole.STUDENT).length,
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm opacity-80">システム管理</p>
                        <h1 className="text-2xl font-bold">ユーザー管理</h1>
                        <p className="opacity-80 text-sm mt-1">全ユーザーの追加・編集・権限管理</p>
                    </div>
                    <span className="text-4xl">👥</span>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                    <div className="bg-white/15 rounded-2xl p-3">
                        <p className="text-xs opacity-80">総ユーザー</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="bg-white/15 rounded-2xl p-3">
                        <p className="text-xs opacity-80">アクティブ</p>
                        <p className="text-2xl font-bold text-green-300">{stats.active}</p>
                    </div>
                    {Object.entries(stats.byRole).map(([role, count]) => (
                        <div key={role} className="bg-white/15 rounded-2xl p-3">
                            <p className="text-xs opacity-80">{ROLE_LABELS[role as UserRole]}</p>
                            <p className="text-xl font-bold">{count}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setRoleFilter('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${roleFilter === 'all'
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            すべて
                        </button>
                        {Object.values(UserRole).map(role => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${roleFilter === role
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {ROLE_LABELS[role]}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="名前またはメールで検索..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="border border-gray-200 rounded-xl px-4 py-2 text-sm w-64"
                        />
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:from-green-600 hover:to-emerald-600 transition"
                        >
                            + ユーザー追加
                        </button>
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ユーザー</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ロール</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">ステータス</th>
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">登録日</th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">アクション</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{user.name}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                                            {ROLE_LABELS[user.role]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {user.isActive ? 'アクティブ' : '無効'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP') : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => onMasquerade && onMasquerade(user)}
                                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                                                title="このユーザーとして表示"
                                            >
                                                👁️ 表示
                                            </button>
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                            >
                                                編集
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(user)}
                                                className="text-xs text-orange-600 hover:text-orange-800 font-semibold"
                                            >
                                                {user.isActive ? '無効化' : '有効化'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                className="text-xs text-red-600 hover:text-red-800 font-semibold"
                                            >
                                                削除
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <span className="text-4xl block mb-2">👤</span>
                        <p>ユーザーが見つかりません</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || editingUser) && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingUser ? 'ユーザー編集' : '新規ユーザー追加'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">名前</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={e => setFormName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2"
                                    placeholder="山田太郎"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">メールアドレス</label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={e => setFormEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2"
                                    placeholder="user@manabee.com"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">ロール</label>
                                <div className="flex gap-2 flex-wrap">
                                    {Object.values(UserRole).map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setFormRole(role)}
                                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${formRole === role
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {ROLE_LABELS[role]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowAddModal(false); setEditingUser(null); resetForm(); }}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={editingUser ? handleUpdateUser : handleAddUser}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                            >
                                {editingUser ? '更新' : '追加'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
