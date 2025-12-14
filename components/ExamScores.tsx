import React, { useState, useMemo } from 'react';
import { User, UserRole, ExamScore, StudentSchool } from '../types';
import { StorageService } from '../services/storageService';

interface ExamScoresProps {
    currentUser: User;
    schools: StudentSchool[];
}

interface ScoreEntry {
    id: string;
    schoolId: string;
    schoolName: string;
    examDate: string;
    examType: string;
    subjects: { name: string; score: number; maxScore: number }[];
    totalScore: number;
    passScore?: number;
    averageScore?: number;
    rank?: string;
    notes?: string;
}

const STORAGE_KEY_SCORES = 'manabee_exam_scores_v1';

// Mock subjects for exam score entry
const EXAM_SUBJECTS = ['算数', '国語', '理科', '社会'];

export const ExamScores: React.FC<ExamScoresProps> = ({ currentUser, schools }) => {
    const [scores, setScores] = useState<ScoreEntry[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_SCORES);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });
    const [isAddingScore, setIsAddingScore] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
    const [newScore, setNewScore] = useState({
        examDate: '',
        examType: '第1回',
        subjects: EXAM_SUBJECTS.map(name => ({ name, score: 0, maxScore: 100 })),
        passScore: undefined as number | undefined,
        averageScore: undefined as number | undefined,
        rank: '',
        notes: ''
    });

    const canEdit = currentUser.role === UserRole.TUTOR || currentUser.role === UserRole.ADMIN;

    // Save scores to localStorage
    const saveScores = (newScores: ScoreEntry[]) => {
        localStorage.setItem(STORAGE_KEY_SCORES, JSON.stringify(newScores));
        setScores(newScores);
    };

    // Add new score
    const handleAddScore = () => {
        if (!selectedSchoolId || !newScore.examDate) return;

        const school = schools.find(s => s.id === selectedSchoolId);
        if (!school) return;

        const totalScore = newScore.subjects.reduce((sum, s) => sum + s.score, 0);

        const scoreEntry: ScoreEntry = {
            id: Math.random().toString(36).substring(2, 9),
            schoolId: selectedSchoolId,
            schoolName: school.name,
            examDate: newScore.examDate,
            examType: newScore.examType,
            subjects: [...newScore.subjects],
            totalScore,
            passScore: newScore.passScore,
            averageScore: newScore.averageScore,
            rank: newScore.rank || undefined,
            notes: newScore.notes || undefined
        };

        const newScores = [scoreEntry, ...scores];
        saveScores(newScores);
        setIsAddingScore(false);
        setNewScore({
            examDate: '',
            examType: '第1回',
            subjects: EXAM_SUBJECTS.map(name => ({ name, score: 0, maxScore: 100 })),
            passScore: undefined,
            averageScore: undefined,
            rank: '',
            notes: ''
        });
        setSelectedSchoolId('');

        StorageService.addLog(currentUser, 'SCORE_ADD', `${school.name} ${newScore.examType}のスコアを追加`);
    };

    // Delete score
    const handleDeleteScore = (id: string) => {
        if (!confirm('このスコアを削除しますか？')) return;
        const newScores = scores.filter(s => s.id !== id);
        saveScores(newScores);
    };

    // Update subject score in new score form
    const updateSubjectScore = (index: number, score: number) => {
        const newSubjects = [...newScore.subjects];
        newSubjects[index] = { ...newSubjects[index], score };
        setNewScore({ ...newScore, subjects: newSubjects });
    };

    // Group scores by school
    const scoresBySchool = useMemo(() => {
        const grouped: Record<string, ScoreEntry[]> = {};
        scores.forEach(score => {
            if (!grouped[score.schoolId]) {
                grouped[score.schoolId] = [];
            }
            grouped[score.schoolId].push(score);
        });
        return grouped;
    }, [scores]);

    // Calculate max score for chart
    const maxTotalScore = Math.max(...scores.map(s => s.totalScore), 400);

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">模試成績管理</h1>
                    <p className="text-gray-500 mt-1">過去問・模試の成績を記録・分析</p>
                </div>
                {canEdit && (
                    <button
                        onClick={() => setIsAddingScore(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        スコアを追加
                    </button>
                )}
            </div>

            {/* Add Score Modal */}
            {isAddingScore && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">スコアを追加</h2>

                        <div className="space-y-4">
                            {/* School Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">学校</label>
                                <select
                                    value={selectedSchoolId}
                                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">選択してください</option>
                                    {schools.map(school => (
                                        <option key={school.id} value={school.id}>{school.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date & Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">実施日</label>
                                    <input
                                        type="date"
                                        value={newScore.examDate}
                                        onChange={(e) => setNewScore({ ...newScore, examDate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
                                    <select
                                        value={newScore.examType}
                                        onChange={(e) => setNewScore({ ...newScore, examType: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option>第1回</option>
                                        <option>第2回</option>
                                        <option>第3回</option>
                                        <option>第4回</option>
                                        <option>過去問2024</option>
                                        <option>過去問2023</option>
                                        <option>過去問2022</option>
                                    </select>
                                </div>
                            </div>

                            {/* Subject Scores */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">科目別スコア</label>
                                <div className="space-y-2">
                                    {newScore.subjects.map((subject, index) => (
                                        <div key={subject.name} className="flex items-center gap-2">
                                            <span className="w-12 text-sm text-gray-600">{subject.name}</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max={subject.maxScore}
                                                value={subject.score}
                                                onChange={(e) => updateSubjectScore(index, parseInt(e.target.value) || 0)}
                                                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <span className="text-sm text-gray-400">/ {subject.maxScore}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 text-right">
                                    <span className="text-lg font-bold text-indigo-600">
                                        合計: {newScore.subjects.reduce((sum, s) => sum + s.score, 0)} / 400
                                    </span>
                                </div>
                            </div>

                            {/* Reference Scores */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">合格最低点</label>
                                    <input
                                        type="number"
                                        value={newScore.passScore || ''}
                                        onChange={(e) => setNewScore({ ...newScore, passScore: parseInt(e.target.value) || undefined })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="任意"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">受験者平均</label>
                                    <input
                                        type="number"
                                        value={newScore.averageScore || ''}
                                        onChange={(e) => setNewScore({ ...newScore, averageScore: parseInt(e.target.value) || undefined })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="任意"
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
                                <textarea
                                    value={newScore.notes}
                                    onChange={(e) => setNewScore({ ...newScore, notes: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                    placeholder="気づいたこと、課題など"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setIsAddingScore(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleAddScore}
                                disabled={!selectedSchoolId || !newScore.examDate}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                追加
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* No Data State */}
            {scores.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                    <span className="text-5xl block mb-4">📊</span>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">成績データがありません</h3>
                    <p className="text-gray-500 mb-6">過去問や模試の成績を記録して、傾向を分析しましょう</p>
                    {canEdit && (
                        <button
                            onClick={() => setIsAddingScore(true)}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            最初のスコアを追加
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {/* Score Trend Chart (Simple CSS-based) */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">📈 スコア推移</h3>
                        <div className="flex items-end gap-2 h-48">
                            {scores.slice(0, 10).reverse().map((score, index) => {
                                const height = (score.totalScore / maxTotalScore) * 100;
                                const isPassing = score.passScore && score.totalScore >= score.passScore;
                                return (
                                    <div key={score.id} className="flex-1 flex flex-col items-center">
                                        <div className="relative w-full">
                                            <div
                                                className={`w-full rounded-t-lg transition-all ${isPassing ? 'bg-green-500' : 'bg-indigo-500'
                                                    }`}
                                                style={{ height: `${height * 1.8}px` }}
                                            />
                                            {score.passScore && (
                                                <div
                                                    className="absolute w-full border-t-2 border-dashed border-amber-500"
                                                    style={{ bottom: `${(score.passScore / maxTotalScore) * 180}px` }}
                                                />
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                                            {score.examType}
                                        </span>
                                        <span className="text-xs font-bold text-gray-700">
                                            {score.totalScore}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-indigo-500 rounded" /> スコア
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-green-500 rounded" /> 合格圏
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-4 border-t-2 border-dashed border-amber-500" /> 合格ライン
                            </span>
                        </div>
                    </div>

                    {/* Scores by School */}
                    {(Object.entries(scoresBySchool) as [string, ScoreEntry[]][]).map(([schoolId, schoolScores]) => (
                        <div key={schoolId} className="bg-white rounded-xl shadow-sm border mb-6 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b">
                                <h3 className="font-bold text-gray-900">{schoolScores[0].schoolName}</h3>
                            </div>
                            <div className="divide-y">
                                {schoolScores.map((score) => (
                                    <div key={score.id} className="p-4 hover:bg-gray-50">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl font-bold text-indigo-600">{score.totalScore}</span>
                                                <span className="text-gray-400">/400</span>
                                                {score.passScore && (
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${score.totalScore >= score.passScore
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {score.totalScore >= score.passScore ? '合格圏' : `あと${score.passScore - score.totalScore}点`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">{score.examDate}</span>
                                                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{score.examType}</span>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleDeleteScore(score.id)}
                                                        className="text-red-500 hover:text-red-700 text-xs"
                                                    >
                                                        削除
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-4 text-sm">
                                            {score.subjects.map((subject) => (
                                                <div key={subject.name} className="flex items-center gap-1">
                                                    <span className="text-gray-500">{subject.name}:</span>
                                                    <span className="font-medium">{subject.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {score.notes && (
                                            <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">{score.notes}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
};
