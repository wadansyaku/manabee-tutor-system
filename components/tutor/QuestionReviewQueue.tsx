import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { QuestionJob } from '../../types';

// ===== QUESTION REVIEW QUEUE =====

interface QuestionReviewQueueProps {
    questions: QuestionJob[];
    onApprove?: (questionId: string, comment?: string) => void;
    onModify?: (questionId: string) => void;
    className?: string;
}

export const QuestionReviewQueue: React.FC<QuestionReviewQueueProps> = ({
    questions,
    onApprove,
    onModify,
    className = '',
}) => {
    const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
    const [tutorComment, setTutorComment] = useState('');

    const pendingQuestions = questions.filter(q =>
        q.status === 'needs_review' || q.status === 'queued' || q.status === 'processing'
    );

    const selectedQuestion = pendingQuestions.find(q => q.id === selectedQuestionId);

    const handleApprove = () => {
        if (selectedQuestionId) {
            onApprove?.(selectedQuestionId, tutorComment);
            setSelectedQuestionId(null);
            setTutorComment('');
        }
    };

    if (pendingQuestions.length === 0) {
        return (
            <Card className={className}>
                <CardHeader icon="✅">レビュー待ち質問</CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <span className="text-5xl block mb-4">🎉</span>
                        <p className="text-lg font-bold text-gray-700">すべて確認済み！</p>
                        <p className="text-sm text-gray-500 mt-1">レビュー待ちの質問はありません</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
            {/* Question List */}
            <Card>
                <CardHeader
                    icon="❓"
                    action={
                        <Badge variant="danger" size="md">
                            {pendingQuestions.length}件待ち
                        </Badge>
                    }
                >
                    レビュー待ち
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {pendingQuestions.map((question) => (
                            <div
                                key={question.id}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedQuestionId === question.id
                                        ? 'border-indigo-500 bg-indigo-50'
                                        : 'border-gray-100 hover:border-indigo-200'
                                    }`}
                                onClick={() => setSelectedQuestionId(question.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {question.questionImageUrl ? (
                                            <img
                                                src={question.questionImageUrl}
                                                alt="質問画像"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">📷</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="info" size="sm">{question.subject}</Badge>
                                            <StatusBadge status={question.status} />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(question.createdAt).toLocaleString('ja-JP')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Question Detail & Actions */}
            <Card>
                <CardHeader icon="📝">レビュー</CardHeader>
                <CardContent>
                    {selectedQuestion ? (
                        <div className="space-y-4">
                            {/* Question Image */}
                            <div className="bg-gray-100 rounded-xl overflow-hidden">
                                {selectedQuestion.questionImageUrl ? (
                                    <img
                                        src={selectedQuestion.questionImageUrl}
                                        alt="質問画像"
                                        className="w-full h-48 object-contain"
                                    />
                                ) : (
                                    <div className="h-48 flex items-center justify-center text-gray-400">
                                        画像なし
                                    </div>
                                )}
                            </div>

                            {/* AI Explanation */}
                            {selectedQuestion.aiExplanation && (
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span>🤖</span>
                                        <span className="text-sm font-bold text-blue-700">AI解説</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{selectedQuestion.aiExplanation}</p>
                                </div>
                            )}

                            {/* Tutor Comment */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    講師コメント（任意）
                                </label>
                                <textarea
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    rows={3}
                                    placeholder="生徒へのアドバイスがあれば記入..."
                                    value={tutorComment}
                                    onChange={(e) => setTutorComment(e.target.value)}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <Button
                                    variant="success"
                                    onClick={handleApprove}
                                    className="flex-1"
                                    icon="✓"
                                >
                                    承認
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={() => onModify?.(selectedQuestion.id)}
                                    className="flex-1"
                                    icon="✏️"
                                >
                                    修正
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <span className="text-4xl block mb-3">👈</span>
                            <p>左から質問を選択してください</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// ===== STATUS BADGE HELPER =====

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
        queued: { variant: 'default', label: '待機中' },
        processing: { variant: 'info', label: '処理中' },
        needs_review: { variant: 'warning', label: '要確認' },
        done: { variant: 'success', label: '完了' },
        error: { variant: 'danger', label: 'エラー' },
    };

    const { variant, label } = config[status] || { variant: 'default', label: status };

    return <Badge variant={variant} size="sm">{label}</Badge>;
};

// ===== TODAY'S SCHEDULE =====

interface ScheduleItem {
    id: string;
    time: string;
    studentName: string;
    subject: string;
    status: 'upcoming' | 'in-progress' | 'completed';
}

interface TodayScheduleProps {
    items: ScheduleItem[];
    className?: string;
}

export const TodaySchedule: React.FC<TodayScheduleProps> = ({
    items,
    className = '',
}) => {
    return (
        <Card className={className}>
            <CardHeader icon="📅">今日の授業</CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-4 p-3 rounded-xl ${item.status === 'in-progress' ? 'bg-indigo-50 border-2 border-indigo-200' :
                                    item.status === 'completed' ? 'bg-gray-50' : 'bg-white border border-gray-100'
                                }`}
                        >
                            <div className={`text-center ${item.status === 'completed' ? 'opacity-50' : ''}`}>
                                <span className="text-lg font-bold text-gray-900">{item.time}</span>
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${item.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                    {item.studentName}
                                </p>
                                <p className="text-xs text-gray-500">{item.subject}</p>
                            </div>
                            {item.status === 'in-progress' && (
                                <Badge variant="success" animate>進行中</Badge>
                            )}
                            {item.status === 'completed' && (
                                <span className="text-green-500">✓</span>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

// ===== SAMPLE DATA =====

export const getSampleSchedule = (): ScheduleItem[] => [
    { id: '1', time: '16:00', studentName: '山田 花子', subject: '算数・図形', status: 'completed' },
    { id: '2', time: '18:00', studentName: '鈴木 太郎', subject: '国語・記述', status: 'in-progress' },
    { id: '3', time: '20:00', studentName: '佐藤 美咲', subject: '理科・実験', status: 'upcoming' },
];
