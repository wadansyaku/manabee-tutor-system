import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LinearProgress } from '../ui/Progress';

// ===== CHALLENGE TYPES =====

export interface Challenge {
    id: string;
    type: 'homework' | 'quiz' | 'question' | 'review' | 'streak';
    title: string;
    description: string;
    xpReward: number;
    progress: number;
    target: number;
    expiresAt?: string; // ISO date string
    completed: boolean;
    icon: string;
}

// サンプルチャレンジデータ
const getSampleChallenges = (): Challenge[] => [
    {
        id: 'daily_homework',
        type: 'homework',
        title: '宿題を1つ完了する',
        description: '今日の宿題を1つ終わらせよう！',
        xpReward: 50,
        progress: 0,
        target: 1,
        completed: false,
        icon: '📝',
    },
    {
        id: 'daily_quiz',
        type: 'quiz',
        title: 'クイズに挑戦',
        description: '復習クイズに挑戦して知識を確認！',
        xpReward: 30,
        progress: 0,
        target: 1,
        completed: false,
        icon: '🧩',
    },
    {
        id: 'streak_continue',
        type: 'streak',
        title: '連続学習を継続',
        description: '今日も学習して記録を伸ばそう！',
        xpReward: 20,
        progress: 1,
        target: 1,
        completed: true,
        icon: '🔥',
    },
];

// ===== TIME REMAINING HELPER =====

const getTimeRemaining = (): string => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const diff = endOfDay.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}時間${minutes}分`;
};

// ===== DAILY CHALLENGE COMPONENT =====

interface DailyChallengeProps {
    challenges?: Challenge[];
    className?: string;
}

export const DailyChallenge: React.FC<DailyChallengeProps> = ({
    challenges: propChallenges,
    className = '',
}) => {
    const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining());
    const challenges = propChallenges || getSampleChallenges();

    // Update countdown every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeRemaining(getTimeRemaining());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    const completedCount = challenges.filter(c => c.completed).length;
    const totalXP = challenges.filter(c => c.completed).reduce((sum, c) => sum + c.xpReward, 0);
    const potentialXP = challenges.reduce((sum, c) => sum + c.xpReward, 0);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                        🎯
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">今日のチャレンジ</h3>
                        <p className="text-sm text-gray-500">
                            残り <span className="font-bold text-orange-600">{timeRemaining}</span>
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-indigo-600">{completedCount}/{challenges.length}</span>
                    <p className="text-xs text-gray-500">完了</p>
                </div>
            </div>

            {/* XP Summary */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3 mb-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">獲得XP</span>
                    <span className="font-bold text-orange-600">+{totalXP} / {potentialXP} XP</span>
                </div>
                <LinearProgress
                    value={totalXP}
                    max={potentialXP}
                    size="sm"
                    variant="gradient"
                    className="mt-2"
                />
            </div>

            {/* Challenge List */}
            <div className="space-y-3">
                {challenges.map((challenge) => (
                    <ChallengeItem key={challenge.id} challenge={challenge} />
                ))}
            </div>

            {/* All Complete Bonus */}
            {completedCount === challenges.length && (
                <div className="mt-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl p-4 text-white text-center">
                    <span className="text-3xl block mb-1">🎉</span>
                    <p className="font-bold">全チャレンジ完了！</p>
                    <p className="text-sm opacity-90">ボーナス +100 XP 獲得！</p>
                </div>
            )}
        </div>
    );
};

// ===== SINGLE CHALLENGE ITEM =====

interface ChallengeItemProps {
    challenge: Challenge;
}

const ChallengeItem: React.FC<ChallengeItemProps> = ({ challenge }) => {
    const percentage = Math.min((challenge.progress / challenge.target) * 100, 100);

    // Get action link based on challenge type
    const getActionLink = () => {
        switch (challenge.type) {
            case 'homework': return '/homework';
            case 'quiz': return '/lessons/l1';
            case 'question': return '/questions';
            default: return '/';
        }
    };

    return (
        <div className={`p-4 rounded-xl border-2 transition-all ${challenge.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'
            }`}>
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${challenge.completed
                        ? 'bg-green-200'
                        : 'bg-gradient-to-br from-indigo-100 to-purple-100'
                    }`}>
                    {challenge.completed ? '✓' : challenge.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className={`font-bold ${challenge.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {challenge.title}
                        </p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${challenge.completed
                                ? 'bg-green-200 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            +{challenge.xpReward} XP
                        </span>
                    </div>
                    {!challenge.completed && (
                        <>
                            <p className="text-xs text-gray-500 mt-1">{challenge.description}</p>
                            <div className="mt-2">
                                <LinearProgress
                                    value={challenge.progress}
                                    max={challenge.target}
                                    size="sm"
                                    variant="default"
                                />
                            </div>
                        </>
                    )}
                </div>
                {!challenge.completed && (
                    <Link
                        to={getActionLink()}
                        className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all"
                    >
                        やる！
                    </Link>
                )}
            </div>
        </div>
    );
};

// ===== COMPACT CHALLENGE WIDGET =====

interface CompactChallengeWidgetProps {
    challenges?: Challenge[];
    className?: string;
}

export const CompactChallengeWidget: React.FC<CompactChallengeWidgetProps> = ({
    challenges: propChallenges,
    className = '',
}) => {
    const challenges = propChallenges || getSampleChallenges();
    const completedCount = challenges.filter(c => c.completed).length;
    const nextChallenge = challenges.find(c => !c.completed);

    return (
        <Link
            to="/"
            className={`block p-4 bg-gradient-to-r from-orange-400 to-pink-500 rounded-2xl text-white hover:shadow-lg transition-all ${className}`}
        >
            <div className="flex items-center gap-3">
                <span className="text-3xl">🎯</span>
                <div className="flex-1 min-w-0">
                    <p className="font-bold">今日のチャレンジ</p>
                    <p className="text-sm opacity-90 truncate">
                        {nextChallenge ? nextChallenge.title : 'すべて完了！'}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold">{completedCount}/{challenges.length}</span>
                </div>
            </div>
        </Link>
    );
};
