import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface UserWithPassword extends User {
    password?: string;
    isInitialPassword?: boolean;
}

interface UserManagementProps {
    currentUser: User;
}

const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.ADMIN]: '管理者',
    [UserRole.TUTOR]: '講師',
    [UserRole.GUARDIAN]: '保護者',
    [UserRole.STUDENT]: '生徒'
};

const ROLE_COLORS: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
    [UserRole.TUTOR]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    [UserRole.GUARDIAN]: 'bg-teal-100 text-teal-800 border-teal-200',
    [UserRole.STUDENT]: 'bg-blue-100 text-blue-800 border-blue-200'
};

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
    const [users, setUsers] = useState<UserWithPassword[]>([]);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [editingUser, setEditingUser] = useState<UserWithPassword | null>(null);
    const [assigningRelations, setAssigningRelations] = useState<UserWithPassword | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: UserRole.STUDENT,
        password: '123'
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Get all students for relation assignment
    const availableStudents = useMemo(() =>
        users.filter(u => u.role === UserRole.STUDENT),
        [users]
    );

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = () => {
        const loaded = StorageService.loadUsers();
        setUsers(loaded);
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddUser = () => {
        if (!newUser.name || !newUser.email) {
            showMessage('error', '名前とメールアドレスを入力してください');
            return;
        }

        if (users.some(u => u.email === newUser.email)) {
            showMessage('error', 'このメールアドレスは既に使用されています');
            return;
        }

        const user: UserWithPassword = {
            id: StorageService.generateId(),
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            password: newUser.password,
            isInitialPassword: true
        };

        const updatedUsers = [...users, user];
        StorageService.saveUsers(updatedUsers);
        setUsers(updatedUsers);
        setIsAddingUser(false);
        setNewUser({ name: '', email: '', role: UserRole.STUDENT, password: '123' });
        showMessage('success', 'ユーザーを追加しました');
        StorageService.addLog(currentUser, 'USER_CREATE', `ユーザー「${user.name}」を作成`);
    };

    const handleUpdateUser = () => {
        if (!editingUser) return;

        const updatedUsers = users.map(u =>
            u.id === editingUser.id ? editingUser : u
        );
        StorageService.saveUsers(updatedUsers);
        setUsers(updatedUsers);
        setEditingUser(null);
        showMessage('success', 'ユーザー情報を更新しました');
        StorageService.addLog(currentUser, 'USER_UPDATE', `ユーザー「${editingUser.name}」を更新`);
    };

    const handleDeleteUser = (user: UserWithPassword) => {
        if (user.id === currentUser.id) {
            showMessage('error', '自分自身は削除できません');
            return;
        }

        if (!confirm(`「${user.name}」を削除しますか？`)) return;

        const updatedUsers = users.filter(u => u.id !== user.id);
        StorageService.saveUsers(updatedUsers);
        setUsers(updatedUsers);
        showMessage('success', 'ユーザーを削除しました');
        StorageService.addLog(currentUser, 'USER_DELETE', `ユーザー「${user.name}」を削除`);
    };

    const handleResetPassword = (user: UserWithPassword) => {
        if (!confirm(`「${user.name}」のパスワードを「123」にリセットしますか？`)) return;

        const updatedUsers = users.map(u =>
            u.id === user.id ? { ...u, password: '123', isInitialPassword: true } : u
        );
        StorageService.saveUsers(updatedUsers);
        setUsers(updatedUsers);
        showMessage('success', 'パスワードをリセットしました');
        StorageService.addLog(currentUser, 'PASSWORD_RESET', `ユーザー「${user.name}」のパスワードをリセット`);
    };

    // Open relation assignment dialog
    const openRelationDialog = (user: UserWithPassword) => {
        setAssigningRelations(user);
        // Pre-select existing relations
        if (user.role === UserRole.GUARDIAN) {
            setSelectedStudentIds(user.children || []);
        } else if (user.role === UserRole.TUTOR) {
            setSelectedStudentIds(user.students || []);
        }
    };

    // Save relations
    const handleSaveRelations = () => {
        if (!assigningRelations) return;

        const updatedUsers = users.map(u => {
            if (u.id !== assigningRelations.id) return u;
            if (u.role === UserRole.GUARDIAN) {
                return { ...u, children: selectedStudentIds };
            } else if (u.role === UserRole.TUTOR) {
                return { ...u, students: selectedStudentIds };
            }
            return u;
        });

        StorageService.saveUsers(updatedUsers);
        setUsers(updatedUsers);
        setAssigningRelations(null);
        setSelectedStudentIds([]);
        showMessage('success', '生徒の紐付けを保存しました');
        StorageService.addLog(currentUser, 'RELATION_UPDATE', `「${assigningRelations.name}」の生徒紐付けを更新`);
    };

    // Toggle student selection
    const toggleStudentSelection = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    // Get related students display
    const getRelatedStudentsDisplay = (user: UserWithPassword): string => {
        const relatedIds = user.role === UserRole.GUARDIAN ? user.children : user.students;
        if (!relatedIds || relatedIds.length === 0) return '-';
        const names = relatedIds
            .map(id => users.find(u => u.id === id)?.name)
            .filter(Boolean);
        return names.length > 0 ? names.join(', ') : '-';
    };

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">ユーザー管理</h1>
                    <p className="text-gray-500 mt-1">システム利用者の追加・編集・削除・生徒紐付け</p>
                </div>
                <button
                    onClick={() => setIsAddingUser(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ユーザーを追加
                </button>
            </div>

            {/* Message Toast */}
            {message && (
                <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Add User Modal */}
            {isAddingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">新規ユーザー追加</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="山田 太郎"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value={UserRole.STUDENT}>生徒</option>
                                    <option value={UserRole.GUARDIAN}>保護者</option>
                                    <option value={UserRole.TUTOR}>講師</option>
                                    <option value={UserRole.ADMIN}>管理者</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">初期パスワード</label>
                                <input
                                    type="text"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="123"
                                />
                                <p className="text-xs text-gray-500 mt-1">※生徒はパスワード不要</p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsAddingUser(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleAddUser}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                追加
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">ユーザー編集</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">名前</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    disabled={editingUser.id === currentUser.id}
                                >
                                    <option value={UserRole.STUDENT}>生徒</option>
                                    <option value={UserRole.GUARDIAN}>保護者</option>
                                    <option value={UserRole.TUTOR}>講師</option>
                                    <option value={UserRole.ADMIN}>管理者</option>
                                </select>
                                {editingUser.id === currentUser.id && (
                                    <p className="text-xs text-amber-600 mt-1">※自分のロールは変更できません</p>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleUpdateUser}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Relations Modal */}
            {assigningRelations && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-2">生徒の紐付け</h2>
                        <p className="text-gray-500 text-sm mb-4">
                            {ROLE_LABELS[assigningRelations.role]}「{assigningRelations.name}」に紐付ける生徒を選択してください
                        </p>

                        {availableStudents.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <span className="text-3xl block mb-2">👤</span>
                                生徒が登録されていません
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availableStudents.map((student) => (
                                    <label
                                        key={student.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedStudentIds.includes(student.id)
                                            ? 'bg-indigo-50 border-indigo-300'
                                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={() => toggleStudentSelection(student.id)}
                                            className="w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setAssigningRelations(null);
                                    setSelectedStudentIds([]);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSaveRelations}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                保存 ({selectedStudentIds.length}名)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ユーザー
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ロール
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                紐付け生徒
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ステータス
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role]}`}>
                                        {ROLE_LABELS[user.role]}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {(user.role === UserRole.GUARDIAN || user.role === UserRole.TUTOR) ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-600 truncate max-w-[120px]">
                                                {getRelatedStudentsDisplay(user)}
                                            </span>
                                            <button
                                                onClick={() => openRelationDialog(user)}
                                                className="text-xs text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                                            >
                                                変更
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.isInitialPassword ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                            要パスワード変更
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            アクティブ
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setEditingUser(user)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                                    >
                                        編集
                                    </button>
                                    {user.role !== UserRole.STUDENT && (
                                        <button
                                            onClick={() => handleResetPassword(user)}
                                            className="text-amber-600 hover:text-amber-900 mr-3"
                                        >
                                            PW
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDeleteUser(user)}
                                        className="text-red-600 hover:text-red-900"
                                        disabled={user.id === currentUser.id}
                                    >
                                        削除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-4 gap-4">
                {Object.values(UserRole).map((role) => {
                    const count = users.filter(u => u.role === role).length;
                    return (
                        <div key={role} className={`p-4 rounded-xl border ${ROLE_COLORS[role]}`}>
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-sm">{ROLE_LABELS[role]}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
