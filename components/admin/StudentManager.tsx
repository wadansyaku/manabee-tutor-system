import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { isFirebaseConfigured } from '../../services/firebaseService';
import { EmptyState, LoadingState, NoStudentsState } from '../ui/EmptyState';

interface StudentManagerProps {
    currentUser: User;
    onStudentCreated?: (student: User) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ currentUser, onStudentCreated }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        grade: ''
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    // Only admins and tutors can manage students
    const canManageStudents = currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TUTOR;

    useEffect(() => {
        loadStudents();
    }, [currentUser.id]);

    const loadStudents = async () => {
        if (!isFirebaseConfigured()) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const firebaseService = await import('../../services/firebaseService');

            if (currentUser.role === UserRole.ADMIN) {
                const allStudents = await firebaseService.firestoreOperations.getAllStudents();
                setStudents(allStudents);
            } else if (currentUser.role === UserRole.TUTOR) {
                const linkedStudents = await firebaseService.firestoreOperations.getLinkedStudents(
                    currentUser.id,
                    currentUser.role
                );
                setStudents(linkedStudents);
            }
        } catch (error) {
            console.error('Failed to load students:', error);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = '名前を入力してください';
        } else if (formData.name.length < 2) {
            newErrors.name = '名前は2文字以上で入力してください';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'メールアドレスを入力してください';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '有効なメールアドレスを入力してください';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;
        if (!isFirebaseConfigured()) {
            alert('ローカルモードでは生徒を追加できません');
            return;
        }

        try {
            setSubmitting(true);
            const firebaseService = await import('../../services/firebaseService');

            const tutorId = currentUser.role === UserRole.TUTOR ? currentUser.id : undefined;
            const newStudent = await firebaseService.firestoreOperations.createStudent(
                {
                    name: formData.name,
                    email: formData.email
                },
                tutorId
            );

            if (newStudent) {
                setStudents([...students, newStudent]);
                setFormData({ name: '', email: '', grade: '' });
                setShowAddForm(false);
                onStudentCreated?.(newStudent);
            }
        } catch (error) {
            console.error('Failed to create student:', error);
            alert('生徒の追加に失敗しました');
        } finally {
            setSubmitting(false);
        }
    };

    if (!canManageStudents) {
        return null;
    }

    if (loading) {
        return <LoadingState message="生徒リストを読み込み中..." />;
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                        👥
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">生徒管理</h3>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    <span>+</span>
                    <span>生徒を追加</span>
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-4">新しい生徒を追加</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                名前 <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="山田 太郎"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                メールアドレス <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="student@example.com"
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {submitting ? '追加中...' : '追加する'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setShowAddForm(false);
                                setErrors({});
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            )}

            {students.length === 0 ? (
                <NoStudentsState onAdd={() => setShowAddForm(true)} />
            ) : (
                <div className="space-y-3">
                    {students.map(student => (
                        <div
                            key={student.id}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                                {student.name[0] || '?'}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-gray-900">{student.name}</p>
                                <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium text-indigo-600">Lv.{student.level || 1}</p>
                                <p className="text-xs text-gray-500">{student.xp || 0} XP</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentManager;
