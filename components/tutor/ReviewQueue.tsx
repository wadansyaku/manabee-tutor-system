// Tutor Review Queue Component
// A dedicated view for tutors to review and respond to student questions
// Enhanced with keyboard shortcuts and batch operations
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { QuestionJob, User, UserRole } from '../../types';
import { StorageService, DateUtils } from '../../services/storageService';

interface ReviewQueueProps {
    currentUser: User;
    questions: QuestionJob[];
    onUpdate: () => void;
}

type FilterStatus = 'all' | 'pending' | 'done';

const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
        queued: 'bg-blue-100 text-blue-700',
        processing: 'bg-yellow-100 text-yellow-700',
        needs_review: 'bg-orange-100 text-orange-700',
        done: 'bg-green-100 text-green-700',
        error: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
        queued: 'AI解析待ち',
        processing: 'AI処理中',
        needs_review: '確認待ち',
        done: '完了',
        error: 'エラー',
    };
    return (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
            {labels[status] || status}
        </span>
    );
};

// Keyboard shortcut hints
const SHORTCUTS = [
    { key: 'J', action: '次へ' },
    { key: 'K', action: '前へ' },
    { key: 'Enter', action: '開く' },
    { key: 'A', action: '承認' },
    { key: 'Esc', action: '閉じる' },
];

export const ReviewQueue: React.FC<ReviewQueueProps> = ({ currentUser, questions, onUpdate }) => {
    const [filter, setFilter] = useState<FilterStatus>('pending');
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionJob | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [comment, setComment] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [batchMode, setBatchMode] = useState(false);

    const pendingCount = useMemo(() => questions.filter(q => q.status !== 'done').length, [questions]);

    const filteredQuestions = useMemo(() => {
        const sorted = [...questions].sort((a, b) => {
            // Pending first
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            // Then by date (newest first)
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        if (filter === 'pending') return sorted.filter(q => q.status !== 'done');
        if (filter === 'done') return sorted.filter(q => q.status === 'done');
        return sorted;
    }, [questions, filter]);

    // Keep selected index within bounds
    useEffect(() => {
        if (selectedIndex >= filteredQuestions.length) {
            setSelectedIndex(Math.max(0, filteredQuestions.length - 1));
        }
    }, [filteredQuestions.length, selectedIndex]);

    const handleApprove = useCallback((question: QuestionJob) => {
        const updated: QuestionJob = {
            ...question,
            tutorComment: comment || '確認しました。',
            status: 'done',
        };
        StorageService.saveQuestion(updated);
        StorageService.addLog(currentUser, 'question_reviewed', `質問ID:${question.id} を承認しました`);
        setSelectedQuestion(null);
        setComment('');
        onUpdate();
    }, [comment, currentUser, onUpdate]);

    const handleBatchApprove = useCallback(() => {
        const selectedQuestions = filteredQuestions.filter(q => selectedIds.has(q.id));
        selectedQuestions.forEach(question => {
            const updated: QuestionJob = {
                ...question,
                tutorComment: '確認しました。',
                status: 'done',
            };
            StorageService.saveQuestion(updated);
        });
        StorageService.addLog(currentUser, 'batch_review', `${selectedQuestions.length}件の質問を一括承認しました`);
        setSelectedIds(new Set());
        setBatchMode(false);
        onUpdate();
    }, [filteredQuestions, selectedIds, currentUser, onUpdate]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        const pendingIds = filteredQuestions.filter(q => q.status !== 'done').map(q => q.id);
        setSelectedIds(new Set(pendingIds));
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') {
                    setSelectedQuestion(null);
                }
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'j':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, filteredQuestions.length - 1));
                    break;
                case 'k':
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                    break;
                case 'enter':
                    e.preventDefault();
                    if (filteredQuestions[selectedIndex] && filteredQuestions[selectedIndex].status !== 'done') {
                        setSelectedQuestion(filteredQuestions[selectedIndex]);
                    }
                    break;
                case 'a':
                    e.preventDefault();
                    if (selectedQuestion) {
                        handleApprove(selectedQuestion);
                    } else if (filteredQuestions[selectedIndex] && filteredQuestions[selectedIndex].status !== 'done') {
                        handleApprove(filteredQuestions[selectedIndex]);
                    }
                    break;
                case 'escape':
                    setSelectedQuestion(null);
                    setBatchMode(false);
                    break;
                case '?':
                    setShowShortcuts(prev => !prev);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredQuestions, selectedIndex, selectedQuestion, handleApprove]);

    if (currentUser.role !== UserRole.TUTOR) {
        return <div className="text-center p-8 text-gray-500">この機能は講師専用です</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">📝 質問レビュー</h1>
                        <p className="text-white/80 mt-1">生徒からの質問を確認・回答します</p>
                    </div>
                    <div className="text-right">
                        <p className="text-4xl font-bold">{pendingCount}</p>
                        <p className="text-sm text-white/80">件の未回答</p>
                    </div>
                </div>

                {/* Keyboard Shortcut Hint */}
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                    <button
                        onClick={() => setShowShortcuts(true)}
                        className="text-sm text-white/70 hover:text-white flex items-center gap-2"
                    >
                        <kbd className="bg-white/20 px-2 py-0.5 rounded text-xs">?</kbd>
                        <span>キーボードショートカット</span>
                    </button>
                    {batchMode ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm">{selectedIds.size}件選択中</span>
                            <button
                                onClick={handleBatchApprove}
                                disabled={selectedIds.size === 0}
                                className="bg-white text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                            >
                                一括承認
                            </button>
                            <button
                                onClick={() => { setBatchMode(false); setSelectedIds(new Set()); }}
                                className="bg-white/20 px-4 py-2 rounded-xl text-sm font-bold"
                            >
                                キャンセル
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setBatchMode(true)}
                            className="bg-white/20 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/30"
                        >
                            一括選択モード
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                {(['pending', 'done', 'all'] as FilterStatus[]).map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl transition-all ${filter === f
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {f === 'pending' && '⏳ 未回答'}
                        {f === 'done' && '✅ 回答済み'}
                        {f === 'all' && '📋 すべて'}
                        {f === 'pending' && pendingCount > 0 && (
                            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">{pendingCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Batch Mode: Select All */}
            {batchMode && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <button
                        onClick={selectAll}
                        className="text-sm font-medium text-indigo-600 hover:underline"
                    >
                        すべて選択
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-sm font-medium text-gray-600 hover:underline"
                    >
                        選択解除
                    </button>
                </div>
            )}

            {/* Question List */}
            <div className="space-y-4">
                {filteredQuestions.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <span className="text-4xl block mb-3">🎉</span>
                        <p className="text-gray-500 font-medium">
                            {filter === 'pending' ? '未回答の質問はありません！' : '該当する質問はありません'}
                        </p>
                    </div>
                ) : (
                    filteredQuestions.map((q, index) => (
                        <div
                            key={q.id}
                            onClick={() => {
                                if (batchMode && q.status !== 'done') {
                                    toggleSelection(q.id);
                                } else if (q.status !== 'done') {
                                    setSelectedQuestion(q);
                                }
                            }}
                            className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${index === selectedIndex ? 'ring-2 ring-indigo-400 ring-offset-2' : ''
                                } ${q.status !== 'done'
                                    ? 'border-orange-200 hover:border-indigo-300 hover:shadow-md cursor-pointer'
                                    : 'border-gray-100'
                                } ${selectedIds.has(q.id) ? 'bg-indigo-50' : ''}`}
                        >
                            <div className="flex">
                                {/* Batch Checkbox */}
                                {batchMode && q.status !== 'done' && (
                                    <div className="flex items-center pl-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(q.id)}
                                            onChange={() => toggleSelection(q.id)}
                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            onClick={e => e.stopPropagation()}
                                        />
                                    </div>
                                )}

                                {/* Image Thumbnail */}
                                <div className="w-32 h-32 bg-gray-100 flex-shrink-0">
                                    <img
                                        src={q.questionImageUrl}
                                        alt="質問画像"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">{q.subject}</span>
                                        {getStatusBadge(q.status)}
                                    </div>

                                    <p className="text-xs text-gray-500 mb-2">
                                        {DateUtils.formatDate(q.createdAt)} {DateUtils.formatTime(q.createdAt)}
                                    </p>

                                    {q.aiExplanation && (
                                        <p className="text-sm text-gray-700 line-clamp-2">{q.aiExplanation}</p>
                                    )}

                                    {q.tutorComment && (
                                        <div className="mt-2 flex items-center gap-2 text-green-700 text-sm">
                                            <span>👨‍🏫</span>
                                            <span className="line-clamp-1">{q.tutorComment}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                {q.status !== 'done' && !batchMode && (
                                    <div className="flex items-center pr-4">
                                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">
                                            回答する
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Review Modal */}
            {selectedQuestion && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedQuestion(null)}>
                    <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-3xl">
                            <h2 className="text-lg font-bold text-gray-900">質問をレビュー</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 hidden md:block">
                                    <kbd className="bg-gray-100 px-1.5 py-0.5 rounded">A</kbd> 承認
                                    <kbd className="bg-gray-100 px-1.5 py-0.5 rounded ml-2">Esc</kbd> 閉じる
                                </span>
                                <button
                                    onClick={() => setSelectedQuestion(null)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-4">
                            {/* Question Image */}
                            <img
                                src={selectedQuestion.questionImageUrl}
                                alt="質問画像"
                                className="w-full rounded-xl border border-gray-200"
                            />

                            {/* Meta Info */}
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span className="font-bold bg-gray-100 px-3 py-1 rounded-full">{selectedQuestion.subject}</span>
                                <span>{DateUtils.formatDate(selectedQuestion.createdAt)} {DateUtils.formatTime(selectedQuestion.createdAt)}</span>
                            </div>

                            {/* AI Explanation */}
                            {selectedQuestion.aiExplanation && (
                                <div className="bg-indigo-50 p-4 rounded-xl">
                                    <p className="text-xs font-bold text-indigo-600 mb-2">✨ AI解説</p>
                                    <p className="text-sm text-indigo-900">{selectedQuestion.aiExplanation}</p>
                                </div>
                            )}

                            {/* Quick Response Templates */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-2">クイック返信</label>
                                <div className="flex flex-wrap gap-2">
                                    {['よく理解できています！', '復習を頑張りましょう', '素晴らしい質問です', '正解です！'].map(template => (
                                        <button
                                            key={template}
                                            onClick={() => setComment(template)}
                                            className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            {template}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tutor Comment Input */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">先生からのコメント</label>
                                <textarea
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    placeholder="解説やアドバイスを入力してください..."
                                    className="w-full border border-gray-300 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                    rows={4}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-4 flex gap-3 rounded-b-3xl">
                            <button
                                onClick={() => setSelectedQuestion(null)}
                                className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={() => handleApprove(selectedQuestion)}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md"
                            >
                                承認して返信
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-4">⌨️ キーボードショートカット</h3>
                        <div className="space-y-3">
                            {SHORTCUTS.map(({ key, action }) => (
                                <div key={key} className="flex items-center justify-between">
                                    <kbd className="bg-gray-100 px-3 py-1.5 rounded-lg font-mono text-sm font-bold text-gray-700">{key}</kbd>
                                    <span className="text-gray-600">{action}</span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowShortcuts(false)}
                            className="mt-6 w-full py-2 bg-gray-100 rounded-xl font-bold text-gray-700 hover:bg-gray-200"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewQueue;

