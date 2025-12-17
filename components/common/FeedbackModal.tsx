import React, { useState } from 'react';
import { User } from '../../types';
import { feedbackService, Feedback } from '../../services/feedbackService';

interface FeedbackModalProps {
    currentUser: User;
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = [
    { id: 'gamification', label: 'ゲーミフィケーション', icon: '🎮' },
    { id: 'homework', label: '宿題・タスク', icon: '📝' },
    { id: 'ai', label: 'AI機能', icon: '🤖' },
    { id: 'ui', label: 'デザイン・操作性', icon: '🎨' },
    { id: 'performance', label: 'パフォーマンス', icon: '⚡' },
    { id: 'other', label: 'その他', icon: '💭' }
];

const TYPES: { id: Feedback['type']; label: string; icon: string }[] = [
    { id: 'feature', label: '新機能リクエスト', icon: '💡' },
    { id: 'improvement', label: '改善提案', icon: '📈' },
    { id: 'bug', label: 'バグ報告', icon: '🐛' },
    { id: 'other', label: 'その他', icon: '💬' }
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ currentUser, isOpen, onClose }) => {
    const [type, setType] = useState<Feedback['type']>('feature');
    const [category, setCategory] = useState('gamification');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError('タイトルを入力してください');
            return;
        }
        if (!description.trim()) {
            setError('詳細を入力してください');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await feedbackService.submitFeedback({
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            type,
            category,
            title: title.trim(),
            description: description.trim()
        });

        setIsSubmitting(false);

        if (result.success) {
            setSubmitted(true);
            setTimeout(() => {
                onClose();
                // Reset form
                setType('feature');
                setCategory('gamification');
                setTitle('');
                setDescription('');
                setSubmitted(false);
            }, 2000);
        } else {
            setError(result.error || '送信に失敗しました');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                {submitted ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">✨</span>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">フィードバックを送信しました！</h2>
                        <p className="text-gray-500">ご意見ありがとうございます。開発チームが確認いたします。</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">📣 フィードバックを送信</h2>
                                    <p className="text-sm text-gray-500 mt-1">あなたのご意見が機能改善につながります</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-5">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">種類</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TYPES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setType(t.id)}
                                            className={`p-3 rounded-xl border text-left transition-all ${type === t.id
                                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            <span className="text-lg block mb-1">{t.icon}</span>
                                            <span className="text-xs font-medium">{t.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setCategory(cat.id)}
                                            className={`px-3 py-1.5 rounded-full text-sm border transition-all ${category === cat.id
                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            {cat.icon} {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">タイトル</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="簡潔にまとめてください"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">詳細</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="詳しい説明をお願いします..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200">
                                    ⚠️ {error}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            送信中...
                                        </>
                                    ) : '送信する'}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Floating Feedback Button component
export const FeedbackButton: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-40"
                title="フィードバックを送信"
            >
                💬
            </button>
            <FeedbackModal
                currentUser={currentUser}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
};

export default FeedbackModal;
