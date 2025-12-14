import React, { useState } from 'react';
import { AchievementBadge } from '../ui/Badge';

// ===== ACHIEVEMENT DATA =====

export interface Achievement {
    id: string;
    emoji: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: string;
    category: 'study' | 'streak' | 'quiz' | 'special';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// サンプルアチーブメントデータ
export const SAMPLE_ACHIEVEMENTS: Achievement[] = [
    { id: 'first_login', emoji: '🌟', title: '初ログイン', description: '初めてManabeeにログインした', unlocked: true, unlockedAt: '2024-01-15', category: 'special', rarity: 'common' },
    { id: 'streak_3', emoji: '🔥', title: '3日連続', description: '3日連続で学習した', unlocked: true, unlockedAt: '2024-01-18', category: 'streak', rarity: 'common' },
    { id: 'streak_7', emoji: '💪', title: '1週間継続', description: '7日連続で学習した', unlocked: true, unlockedAt: '2024-01-22', category: 'streak', rarity: 'rare' },
    { id: 'streak_30', emoji: '👑', title: '30日マスター', description: '30日連続で学習した', unlocked: false, category: 'streak', rarity: 'legendary' },
    { id: 'homework_10', emoji: '📚', title: '宿題10個完了', description: '10個の宿題を完了した', unlocked: true, unlockedAt: '2024-01-20', category: 'study', rarity: 'common' },
    { id: 'homework_50', emoji: '📖', title: '宿題マスター', description: '50個の宿題を完了した', unlocked: false, category: 'study', rarity: 'rare' },
    { id: 'quiz_perfect', emoji: '💯', title: '満点ゲット！', description: 'クイズで満点を獲得した', unlocked: true, unlockedAt: '2024-01-19', category: 'quiz', rarity: 'rare' },
    { id: 'quiz_10', emoji: '🧠', title: 'クイズチャレンジャー', description: '10回クイズに挑戦した', unlocked: false, category: 'quiz', rarity: 'common' },
    { id: 'question_first', emoji: '📸', title: '初めての質問', description: '初めて写真で質問した', unlocked: true, unlockedAt: '2024-01-16', category: 'special', rarity: 'common' },
    { id: 'early_bird', emoji: '🌅', title: '早起き学習者', description: '朝6時前に学習を開始した', unlocked: false, category: 'special', rarity: 'epic' },
    { id: 'night_owl', emoji: '🦉', title: '夜の学習者', description: '夜11時以降に学習した', unlocked: true, unlockedAt: '2024-01-17', category: 'special', rarity: 'rare' },
    { id: 'exam_champion', emoji: '🏆', title: '試験チャンピオン', description: '模試で90点以上を獲得した', unlocked: false, category: 'study', rarity: 'legendary' },
];

// ===== RARITY COLORS =====

const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-blue-400 to-indigo-500',
    epic: 'from-purple-400 to-pink-500',
    legendary: 'from-yellow-400 to-orange-500',
};

const rarityLabels = {
    common: 'コモン',
    rare: 'レア',
    epic: 'エピック',
    legendary: 'レジェンダリー',
};

// ===== ACHIEVEMENT BADGES COMPONENT =====

interface AchievementBadgesProps {
    achievements?: Achievement[];
    showAll?: boolean;
    maxDisplay?: number;
    onViewAll?: () => void;
    className?: string;
}

export const AchievementBadges: React.FC<AchievementBadgesProps> = ({
    achievements = SAMPLE_ACHIEVEMENTS,
    showAll = false,
    maxDisplay = 6,
    onViewAll,
    className = '',
}) => {
    const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

    const displayAchievements = showAll ? achievements : achievements.slice(0, maxDisplay);
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;

    return (
        <div className={className}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🏅</span>
                    <h3 className="text-lg font-bold text-gray-900">実績バッジ</h3>
                    <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                        {unlockedCount}/{totalCount}
                    </span>
                </div>
                {!showAll && onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        すべて見る →
                    </button>
                )}
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {displayAchievements.map((achievement) => (
                    <div
                        key={achievement.id}
                        className="flex flex-col items-center"
                        onClick={() => setSelectedAchievement(achievement)}
                    >
                        <AchievementBadge
                            emoji={achievement.emoji}
                            title={achievement.title}
                            unlocked={achievement.unlocked}
                            size="md"
                        />
                        <span className={`text-xs mt-2 text-center truncate w-full ${achievement.unlocked ? 'text-gray-700' : 'text-gray-400'
                            }`}>
                            {achievement.title}
                        </span>
                    </div>
                ))}
            </div>

            {/* Achievement Detail Modal */}
            {selectedAchievement && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedAchievement(null)}
                >
                    <div
                        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <div className={`w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-5xl mb-4 ${selectedAchievement.unlocked
                                    ? `bg-gradient-to-br ${rarityColors[selectedAchievement.rarity]} shadow-lg`
                                    : 'bg-gray-200'
                                }`}>
                                {selectedAchievement.emoji}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{selectedAchievement.title}</h3>
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${selectedAchievement.unlocked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                {selectedAchievement.unlocked ? '獲得済み' : '未獲得'}
                            </span>
                            <p className="text-gray-600 text-sm mb-4">{selectedAchievement.description}</p>
                            <div className="flex justify-center gap-2 text-xs">
                                <span className={`px-2 py-1 rounded-full bg-gradient-to-r ${rarityColors[selectedAchievement.rarity]} text-white font-bold`}>
                                    {rarityLabels[selectedAchievement.rarity]}
                                </span>
                                {selectedAchievement.unlockedAt && (
                                    <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                        {new Date(selectedAchievement.unlockedAt).toLocaleDateString('ja-JP')}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedAchievement(null)}
                            className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                        >
                            閉じる
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
