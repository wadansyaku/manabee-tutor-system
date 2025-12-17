import React, { useState, useEffect } from 'react';
import { User, Attendance, AttendanceStatus } from '../../types';
import { isFirebaseConfigured } from '../../services/firebaseService';
import { EmptyState, LoadingState } from '../ui/EmptyState';

interface AttendanceManagerProps {
    currentUser: User;
    selectedStudentId?: string;
}

const statusLabels: Record<AttendanceStatus, { label: string; color: string; icon: string }> = {
    scheduled: { label: '予定', color: 'bg-blue-100 text-blue-700', icon: '📅' },
    completed: { label: '完了', color: 'bg-green-100 text-green-700', icon: '✓' },
    cancelled: { label: 'キャンセル', color: 'bg-gray-100 text-gray-500', icon: '✕' },
    no_show: { label: '欠席', color: 'bg-red-100 text-red-700', icon: '⚠' }
};

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({ currentUser, selectedStudentId }) => {
    const [attendances, setAttendances] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        startTime: '16:00',
        endTime: '18:00',
        hourlyRate: 5000,
        notes: ''
    });

    useEffect(() => {
        loadAttendances();
    }, [currentUser.id, selectedStudentId, selectedMonth]);

    const loadAttendances = async () => {
        if (!isFirebaseConfigured()) {
            // Demo data for local mode
            setAttendances([
                {
                    id: '1',
                    lessonId: 'l1',
                    tutorId: currentUser.id,
                    studentId: selectedStudentId || 's1',
                    date: '2025-12-14',
                    startTime: '16:00',
                    endTime: '18:00',
                    durationMinutes: 120,
                    status: 'completed',
                    hourlyRate: 5000,
                    totalAmount: 10000,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const firebaseService = await import('../../services/firebaseService');
            // TODO: Implement getAttendances in firebaseService
            setAttendances([]);
        } catch (error) {
            console.error('Failed to load attendances:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDuration = (start: string, end: string): number => {
        const [startH, startM] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);
        return (endH * 60 + endM) - (startH * 60 + startM);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const duration = calculateDuration(formData.startTime, formData.endTime);
        const totalAmount = Math.round((duration / 60) * formData.hourlyRate);

        const newAttendance: Attendance = {
            id: Date.now().toString(),
            lessonId: '',
            tutorId: currentUser.id,
            studentId: selectedStudentId || '',
            date: formData.date,
            startTime: formData.startTime,
            endTime: formData.endTime,
            durationMinutes: duration,
            status: 'completed',
            hourlyRate: formData.hourlyRate,
            totalAmount,
            notes: formData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setAttendances([newAttendance, ...attendances]);
        setShowForm(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            startTime: '16:00',
            endTime: '18:00',
            hourlyRate: 5000,
            notes: ''
        });
    };

    const monthlyStats = {
        totalLessons: attendances.filter(a => a.status === 'completed').length,
        totalHours: attendances.filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + a.durationMinutes, 0) / 60,
        totalAmount: attendances.filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + a.totalAmount, 0),
        cancelledLessons: attendances.filter(a => a.status === 'cancelled').length
    };

    if (loading) {
        return <LoadingState message="勤怠データを読み込み中..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        📊
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">勤怠管理</h2>
                        <p className="text-sm text-gray-500">授業記録と請求管理</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                    >
                        + 授業を記録
                    </button>
                </div>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">授業回数</p>
                    <p className="text-2xl font-bold text-indigo-600">{monthlyStats.totalLessons}回</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">合計時間</p>
                    <p className="text-2xl font-bold text-green-600">{monthlyStats.totalHours.toFixed(1)}時間</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">合計金額</p>
                    <p className="text-2xl font-bold text-amber-600">¥{monthlyStats.totalAmount.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">キャンセル</p>
                    <p className="text-2xl font-bold text-gray-500">{monthlyStats.cancelledLessons}回</p>
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <h3 className="font-bold text-gray-900 mb-4">授業記録を追加</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">日付</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">開始時間</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">終了時間</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">時給 (円)</label>
                            <input
                                type="number"
                                value={formData.hourlyRate}
                                onChange={e => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            rows={2}
                            placeholder="授業内容のメモ..."
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
                        >
                            保存
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                        >
                            キャンセル
                        </button>
                    </div>
                </form>
            )}

            {/* Attendance List */}
            {attendances.length === 0 ? (
                <EmptyState
                    icon="📅"
                    title="勤怠記録がありません"
                    description="授業を記録すると、ここに表示されます。"
                    actionLabel="授業を記録"
                    onAction={() => setShowForm(true)}
                />
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">時間数</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {attendances.map(attendance => {
                                const status = statusLabels[attendance.status];
                                return (
                                    <tr key={attendance.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900">{attendance.date}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {attendance.startTime} - {attendance.endTime}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {(attendance.durationMinutes / 60).toFixed(1)}h
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            ¥{attendance.totalAmount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                                {status.icon} {status.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AttendanceManager;
