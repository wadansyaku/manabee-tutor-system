import React, { useState } from 'react';
import { User, MonthlyReport } from '../../types';

interface ProgressReportProps {
    currentUser: User;
    selectedStudentId?: string;
    studentName?: string;
}

export const ProgressReport: React.FC<ProgressReportProps> = ({
    currentUser,
    selectedStudentId,
    studentName = 'お子様'
}) => {
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Demo report data
    const report: MonthlyReport = {
        month: selectedMonth,
        studentId: selectedStudentId || '',
        studentName: studentName,
        totalLessons: 8,
        totalHours: 16,
        totalAmount: 80000,
        homeworkAssigned: 24,
        homeworkCompleted: 19,
        questionsAsked: 12,
        questionsResolved: 11,
        studyLogMinutes: 1840,
        highlights: [
            '算数の図形問題が大きく改善しました',
            '国語の読解力が向上しています',
            '自主学習の時間が先月比120%に増加'
        ],
        areasToImprove: [
            '理科の暗記項目をもう少し強化しましょう',
            '計算ミスを減らすため、見直しの習慣を'
        ]
    };

    const homeworkRate = Math.round((report.homeworkCompleted / report.homeworkAssigned) * 100);
    const questionRate = Math.round((report.questionsResolved / report.questionsAsked) * 100);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        📊
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">学習レポート</h2>
                        <p className="text-sm text-gray-500">{studentName}の進捗状況</p>
                    </div>
                </div>
                <input
                    type="month"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                            📚
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">授業回数</p>
                            <p className="text-xl font-bold text-gray-900">{report.totalLessons}回</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                            ⏱️
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">合計時間</p>
                            <p className="text-xl font-bold text-gray-900">{report.totalHours}時間</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                            💴
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">月額費用</p>
                            <p className="text-xl font-bold text-gray-900">¥{report.totalAmount.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                            📖
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">自主学習</p>
                            <p className="text-xl font-bold text-gray-900">{Math.round(report.studyLogMinutes / 60)}時間</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Homework Completion */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">宿題の完了状況</h3>
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="48" cy="48" r="40"
                                    stroke="#10b981"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${homeworkRate * 2.51} ${251 - homeworkRate * 2.51}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">{homeworkRate}%</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-lg font-bold text-gray-900">
                                {report.homeworkCompleted} / {report.homeworkAssigned}
                            </p>
                            <p className="text-sm text-gray-500">完了した宿題</p>
                            {homeworkRate >= 80 && (
                                <p className="text-sm text-green-600 mt-2">🎉 素晴らしい達成率です！</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Questions */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-4">質問・回答</h3>
                    <div className="flex items-center gap-6">
                        <div className="relative w-24 h-24">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                                <circle
                                    cx="48" cy="48" r="40"
                                    stroke="#8b5cf6"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${questionRate * 2.51} ${251 - questionRate * 2.51}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900">{questionRate}%</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-lg font-bold text-gray-900">
                                {report.questionsResolved} / {report.questionsAsked}
                            </p>
                            <p className="text-sm text-gray-500">解決した質問</p>
                            <p className="text-sm text-purple-600 mt-2">💬 積極的に質問しています</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Highlights & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                        <span>✨</span> 今月のハイライト
                    </h3>
                    <ul className="space-y-3">
                        {report.highlights.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-green-700">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                    <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                        <span>🎯</span> 改善ポイント
                    </h3>
                    <ul className="space-y-3">
                        {report.areasToImprove.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-amber-700">
                                <span className="text-amber-500 mt-1">→</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
                <button className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span>💬</span>
                    講師にメッセージ
                </button>
                <button className="px-6 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors flex items-center gap-2">
                    <span>📥</span>
                    レポートをダウンロード
                </button>
            </div>
        </div>
    );
};

export default ProgressReport;
