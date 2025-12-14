import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge, StatusBadge, NotificationBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LinearProgress } from '../ui/Progress';
import { UserRole } from '../../types';

// ===== STUDENT DATA TYPE =====

interface StudentData {
    id: string;
    name: string;
    avatar: string;
    grade: string;
    lastActive: string;
    status: 'online' | 'offline' | 'away';
    homeworkProgress: number;
    pendingQuestions: number;
    upcomingExamDays?: number;
    targetSchool?: string;
}

// ===== STUDENT ROSTER =====

interface StudentRosterProps {
    students: StudentData[];
    onSelectStudent?: (id: string) => void;
    selectedStudentId?: string;
    className?: string;
}

export const StudentRoster: React.FC<StudentRosterProps> = ({
    students,
    onSelectStudent,
    selectedStudentId,
    className = '',
}) => {
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filter === 'all' ||
            (filter === 'active' && s.status !== 'offline') ||
            (filter === 'inactive' && s.status === 'offline');
        return matchesSearch && matchesFilter;
    });

    return (
        <Card className={className}>
            <CardHeader icon="👥" action={
                <span className="text-sm text-gray-500">{students.length}名</span>
            }>
                担当生徒
            </CardHeader>

            {/* Filters */}
            <div className="mb-4 space-y-3">
                <input
                    type="text"
                    placeholder="🔍 生徒を検索..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="flex gap-2">
                    {(['all', 'active', 'inactive'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f
                                    ? 'bg-indigo-100 text-indigo-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f === 'all' ? '全員' : f === 'active' ? 'アクティブ' : '非アクティブ'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Student List */}
            <CardContent>
                <div className="space-y-3">
                    {filteredStudents.map((student) => (
                        <StudentCard
                            key={student.id}
                            student={student}
                            isSelected={selectedStudentId === student.id}
                            onClick={() => onSelectStudent?.(student.id)}
                        />
                    ))}
                </div>

                {filteredStudents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl block mb-2">🔍</span>
                        該当する生徒が見つかりません
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

// ===== SINGLE STUDENT CARD =====

interface StudentCardProps {
    student: StudentData;
    isSelected?: boolean;
    onClick?: () => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
    student,
    isSelected,
    onClick,
}) => {
    return (
        <div
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm'
                }`}
            onClick={onClick}
        >
            <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        {student.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${student.status === 'online' ? 'bg-green-500' :
                            student.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-900 truncate">{student.name}</h4>
                        <Badge variant="default" size="sm">{student.grade}</Badge>
                        {student.pendingQuestions > 0 && (
                            <NotificationBadge count={student.pendingQuestions} />
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        最終アクセス: {student.lastActive}
                    </p>
                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">宿題</span>
                            <LinearProgress
                                value={student.homeworkProgress}
                                size="sm"
                                variant={student.homeworkProgress >= 80 ? 'success' : student.homeworkProgress >= 50 ? 'warning' : 'danger'}
                                className="flex-1"
                            />
                            <span className="text-xs font-medium text-gray-700">{student.homeworkProgress}%</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col items-end gap-1">
                    {student.upcomingExamDays !== undefined && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                            試験まで{student.upcomingExamDays}日
                        </span>
                    )}
                </div>
            </div>

            {/* Target School */}
            {student.targetSchool && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                    <span className="text-xs text-gray-500">🎯 志望校:</span>
                    <span className="text-xs font-medium text-gray-700 truncate">{student.targetSchool}</span>
                </div>
            )}
        </div>
    );
};

// ===== QUICK ACTION PANEL =====

interface QuickActionPanelProps {
    studentId: string;
    studentName: string;
    pendingQuestions: number;
    className?: string;
}

export const QuickActionPanel: React.FC<QuickActionPanelProps> = ({
    studentId,
    studentName,
    pendingQuestions,
    className = '',
}) => {
    const actions = [
        { icon: '📝', label: '宿題を追加', link: '/homework', color: 'from-indigo-500 to-purple-500' },
        { icon: '❓', label: '質問を確認', link: '/questions', badge: pendingQuestions, color: 'from-red-500 to-orange-500' },
        { icon: '📊', label: '成績を見る', link: '/scores', color: 'from-green-500 to-teal-500' },
        { icon: '🎓', label: '授業記録', link: '/lessons/l1', color: 'from-blue-500 to-cyan-500' },
    ];

    return (
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
            {actions.map((action) => (
                <Link
                    key={action.label}
                    to={action.link}
                    className={`relative p-4 bg-gradient-to-br ${action.color} rounded-2xl text-white text-center hover:shadow-lg transition-all group`}
                >
                    <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
                    <span className="text-sm font-medium">{action.label}</span>
                    {action.badge && action.badge > 0 && (
                        <span className="absolute top-2 right-2 w-6 h-6 bg-white text-red-600 rounded-full text-xs font-bold flex items-center justify-center">
                            {action.badge}
                        </span>
                    )}
                </Link>
            ))}
        </div>
    );
};

// ===== SAMPLE DATA =====

export const getSampleStudents = (): StudentData[] => [
    {
        id: 's1',
        name: '山田 花子',
        avatar: '👧',
        grade: '小6',
        lastActive: '2時間前',
        status: 'online',
        homeworkProgress: 75,
        pendingQuestions: 2,
        upcomingExamDays: 34,
        targetSchool: '洛南高等学校附属中学校',
    },
    {
        id: 's2',
        name: '鈴木 太郎',
        avatar: '👦',
        grade: '小5',
        lastActive: '1日前',
        status: 'offline',
        homeworkProgress: 60,
        pendingQuestions: 0,
        targetSchool: '開成中学校',
    },
    {
        id: 's3',
        name: '佐藤 美咲',
        avatar: '👧',
        grade: '小6',
        lastActive: '30分前',
        status: 'away',
        homeworkProgress: 90,
        pendingQuestions: 1,
        upcomingExamDays: 28,
        targetSchool: '女子学院中学校',
    },
];
