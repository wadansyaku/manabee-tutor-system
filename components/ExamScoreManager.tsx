// Exam Score Management Component
import React, { useState, useMemo } from 'react';
import { ExamScore, User, UserRole, StudentSchool } from '../types';
import { StorageService, DateUtils } from '../services/storageService';

interface ExamScoreManagerProps {
    currentUser: User;
    schools: StudentSchool[];
    onAudit: (action: string, summary: string) => void;
    studentId?: string; // For Guardian multi-child support
}

const STORAGE_KEY_SCORES = 'manabee_exam_scores_v1';

// Local storage helpers
const loadScores = (): ExamScore[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SCORES);
        return stored ? JSON.parse(stored) : [];
    } catch { return []; }
};

const saveScores = (scores: ExamScore[]) => {
    localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(scores));
};

export const ExamScoreManager: React.FC<ExamScoreManagerProps> = ({ currentUser, schools, onAudit }) => {
    const [scores, setScores] = useState<ExamScore[]>(loadScores());
    const [selectedSchool, setSelectedSchool] = useState<string>(schools[0]?.id || '');
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [formYear, setFormYear] = useState(new Date().getFullYear());
    const [formExamType, setFormExamType] = useState('第1回');
    const [formSubjects, setFormSubjects] = useState<Record<string, number>>({
        '算数': 0, '国語': 0, '理科': 0, '社会': 0
    });
    const [formPassScore, setFormPassScore] = useState<number | undefined>();
    const [formAverage, setFormAverage] = useState<number | undefined>();

    const canEdit = currentUser.role === UserRole.TUTOR || currentUser.role === UserRole.ADMIN;

    // Filter scores by selected school
    const filteredScores = useMemo(() => {
        return scores
            .filter(s => s.schoolId === selectedSchool)
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return a.examType.localeCompare(b.examType);
            });
    }, [scores, selectedSchool]);

    // Calculate trends
    const trends = useMemo(() => {
        if (filteredScores.length < 2) return null;
        const latest = filteredScores[0];
        const previous = filteredScores[1];
        const diff = latest.totalScore - previous.totalScore;
        return {
            diff,
            percentage: ((diff / previous.totalScore) * 100).toFixed(1),
            isUp: diff > 0
        };
    }, [filteredScores]);

    // Calculate subject averages
    const subjectAverages = useMemo(() => {
        if (filteredScores.length === 0) return {};
        const subjects = Object.keys(filteredScores[0]?.subjectScores || {});
        const averages: Record<string, number> = {};

        subjects.forEach(subject => {
            const total = filteredScores.reduce((sum, s) => sum + (s.subjectScores[subject] || 0), 0);
            averages[subject] = Math.round(total / filteredScores.length);
        });

        return averages;
    }, [filteredScores]);

    const handleAddScore = () => {
        const totalScore = (Object.values(formSubjects) as number[]).reduce((a, b) => a + b, 0);
        const newScore: ExamScore = {
            id: StorageService.generateId(),
            studentId: 's1', // TODO: Make dynamic for multi-student
            schoolId: selectedSchool,
            year: formYear,
            examType: formExamType,
            subjectScores: { ...formSubjects },
            totalScore,
            passScore: formPassScore,
            averageScore: formAverage,
            status: 'draft' as const
        };

        const updated = [newScore, ...scores];
        setScores(updated);
        saveScores(updated);
        onAudit('exam_score_added', `${schools.find(s => s.id === selectedSchool)?.name || ''} ${formYear}年 ${formExamType} 追加(総合: ${totalScore}点)`);

        // Reset form
        setShowAddForm(false);
        setFormSubjects({ '算数': 0, '国語': 0, '理科': 0, '社会': 0 });
        setFormPassScore(undefined);
        setFormAverage(undefined);
    };

    const handleDeleteScore = (id: string) => {
        if (!confirm('この成績を削除しますか？')) return;
        const score = scores.find(s => s.id === id);
        const updated = scores.filter(s => s.id !== id);
        setScores(updated);
        saveScores(updated);
        if (score) {
            onAudit('exam_score_deleted', `${score.year}年 ${score.examType} 削除`);
        }
    };

    const handleVerifyScore = (id: string) => {
        const updated = scores.map(s =>
            s.id === id ? { ...s, status: 'verified' as const } : s
        );
        setScores(updated);
        saveScores(updated);
        onAudit('exam_score_verified', `成績を確定しました`);
    };

    const getSubjectColor = (subject: string) => {
        switch (subject) {
            case '算数': return 'from-blue-500 to-indigo-600';
            case '国語': return 'from-green-500 to-emerald-600';
            case '理科': return 'from-purple-500 to-violet-600';
            case '社会': return 'from-orange-500 to-amber-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm opacity-80">成績管理</p>
                        <h1 className="text-2xl font-bold">模試・過去問スコア</h1>
                        <p className="opacity-80 text-sm mt-1">合格への軌跡を見える化します</p>
                    </div>
                    <span className="text-4xl">📊</span>
                </div>

                {/* Quick Stats */}
                {filteredScores.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-white/15 rounded-2xl p-4">
                            <p className="text-xs opacity-80">最新スコア</p>
                            <p className="text-2xl font-bold">{filteredScores[0]?.totalScore}点</p>
                        </div>
                        <div className="bg-white/15 rounded-2xl p-4">
                            <p className="text-xs opacity-80">受験回数</p>
                            <p className="text-2xl font-bold">{filteredScores.length}回</p>
                        </div>
                        <div className="bg-white/15 rounded-2xl p-4">
                            <p className="text-xs opacity-80">前回比</p>
                            {trends ? (
                                <p className={`text - 2xl font - bold ${trends.isUp ? 'text-green-300' : 'text-red-300'} `}>
                                    {trends.isUp ? '↑' : '↓'} {Math.abs(trends.diff)}点
                                </p>
                            ) : (
                                <p className="text-lg font-bold">-</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* School Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex flex-wrap gap-2">
                    {schools.map(school => (
                        <button
                            key={school.id}
                            onClick={() => setSelectedSchool(school.id)}
                            className={`px - 4 py - 2 rounded - xl text - sm font - semibold transition ${selectedSchool === school.id
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                } `}
                        >
                            {school.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Subject Averages */}
            {Object.keys(subjectAverages).length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(subjectAverages).map(([subject, avg]) => (
                        <div key={subject} className={`bg - gradient - to - br ${getSubjectColor(subject)} rounded - 2xl p - 4 text - white shadow - lg`}>
                            <p className="text-sm opacity-90">{subject}</p>
                            <p className="text-3xl font-bold">{avg}<span className="text-lg">点</span></p>
                            <p className="text-xs opacity-80">平均</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Score Button */}
            {canEdit && (
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-2xl font-semibold flex items-center justify-center gap-2 hover:from-green-600 hover:to-emerald-600 transition shadow-lg"
                >
                    {showAddForm ? '✕ キャンセル' : '＋ 成績を追加'}
                </button>
            )}

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                    <h3 className="font-bold text-gray-900 text-lg">成績を入力</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500">年度</label>
                            <input
                                type="number"
                                value={formYear}
                                onChange={e => setFormYear(parseInt(e.target.value))}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">回次</label>
                            <input
                                type="text"
                                value={formExamType}
                                onChange={e => setFormExamType(e.target.value)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="第1回"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3">
                        {Object.keys(formSubjects).map(subject => (
                            <div key={subject}>
                                <label className="text-xs font-bold text-gray-500">{subject}</label>
                                <input
                                    type="number"
                                    value={formSubjects[subject]}
                                    onChange={e => setFormSubjects({
                                        ...formSubjects,
                                        [subject]: parseInt(e.target.value) || 0
                                    })}
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    min={0}
                                    max={100}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500">合格最低点（任意）</label>
                            <input
                                type="number"
                                value={formPassScore || ''}
                                onChange={e => setFormPassScore(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500">受験者平均（任意）</label>
                            <input
                                type="number"
                                value={formAverage || ''}
                                onChange={e => setFormAverage(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <p className="text-sm text-gray-500 mb-2">
                            総合: <span className="font-bold text-indigo-600">{(Object.values(formSubjects) as number[]).reduce((a, b) => a + b, 0)}点</span>
                        </p>
                        <button
                            onClick={handleAddScore}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
                        >
                            保存する
                        </button>
                    </div>
                </div>
            )}

            {/* Score History */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4">📈 スコア履歴</h3>

                {filteredScores.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <span className="text-4xl block mb-2">📝</span>
                        <p>まだ成績が登録されていません</p>
                        <p className="text-sm">上のボタンから成績を追加してください</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredScores.map((score, idx) => (
                            <div key={score.id} className={`p - 4 rounded - xl border ${score.status === 'verified' ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
                                } `}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{score.year}年 {score.examType}</span>
                                            {score.status === 'verified' && (
                                                <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">確定</span>
                                            )}
                                            {idx === 0 && (
                                                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">最新</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-indigo-600">{score.totalScore}<span className="text-sm font-normal">点</span></p>
                                        {score.passScore && (
                                            <p className={`text - xs ${score.totalScore >= score.passScore ? 'text-green-600' : 'text-red-600'} `}>
                                                合格最低点: {score.passScore}点
                                                {score.totalScore >= score.passScore ? ' ✓' : ' △'}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {Object.entries(score.subjectScores).map(([subject, value]) => (
                                        <div key={subject} className="bg-white rounded-lg p-2 text-center border border-gray-200">
                                            <p className="text-xs text-gray-500">{subject}</p>
                                            <p className="font-bold text-gray-900">{value}</p>
                                        </div>
                                    ))}
                                </div>

                                {canEdit && (
                                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                                        {score.status === 'draft' && (
                                            <button
                                                onClick={() => handleVerifyScore(score.id)}
                                                className="text-xs text-green-600 hover:text-green-800 font-semibold"
                                            >
                                                ✓ 確定
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeleteScore(score.id)}
                                            className="text-xs text-red-600 hover:text-red-800 font-semibold"
                                        >
                                            削除
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamScoreManager;
