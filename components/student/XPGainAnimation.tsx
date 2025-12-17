// XP Gain Animation Component
// Shows celebratory animations when students earn XP
import React, { useEffect, useState } from 'react';

interface XPGainAnimationProps {
    xpAmount: number;
    isVisible: boolean;
    onComplete?: () => void;
    bonusMultiplier?: number; // e.g., 1.25 for 25% bonus
    message?: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    rotation: number;
    scale: number;
    color: string;
    type: 'star' | 'sparkle' | 'confetti';
}

const CELEBRATION_COLORS = [
    '#FFD700', // Gold
    '#FF6B6B', // Coral
    '#4ECDC4', // Teal
    '#A855F7', // Purple
    '#10B981', // Emerald
    '#F59E0B', // Amber
];

export const XPGainAnimation: React.FC<XPGainAnimationProps> = ({
    xpAmount,
    isVisible,
    onComplete,
    bonusMultiplier = 1,
    message = '獲得！'
}) => {
    const [particles, setParticles] = useState<Particle[]>([]);
    const [showMain, setShowMain] = useState(false);
    const [animationPhase, setAnimationPhase] = useState<'enter' | 'display' | 'exit'>('enter');

    const totalXP = Math.round(xpAmount * bonusMultiplier);
    const hasBonus = bonusMultiplier > 1;

    useEffect(() => {
        if (isVisible) {
            // Generate particles for confetti effect
            const newParticles: Particle[] = Array.from({ length: 30 }, (_, i) => ({
                id: i,
                x: Math.random() * 100,
                y: Math.random() * 100,
                rotation: Math.random() * 360,
                scale: 0.5 + Math.random() * 0.5,
                color: CELEBRATION_COLORS[Math.floor(Math.random() * CELEBRATION_COLORS.length)],
                type: ['star', 'sparkle', 'confetti'][Math.floor(Math.random() * 3)] as Particle['type'],
            }));
            setParticles(newParticles);

            // Animation sequence
            setAnimationPhase('enter');
            setTimeout(() => setShowMain(true), 100);
            setTimeout(() => setAnimationPhase('display'), 200);
            setTimeout(() => setAnimationPhase('exit'), 2000);
            setTimeout(() => {
                setShowMain(false);
                setParticles([]);
                onComplete?.();
            }, 2500);
        }
    }, [isVisible, onComplete]);

    if (!isVisible && !showMain) return null;

    const renderParticle = (particle: Particle) => {
        const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            color: particle.color,
            animation: `float-up 2s ease-out forwards, fade-out 2s ease-out forwards`,
            pointerEvents: 'none',
        };

        if (particle.type === 'star') {
            return <span key={particle.id} style={baseStyle} className="text-2xl">⭐</span>;
        }
        if (particle.type === 'sparkle') {
            return <span key={particle.id} style={baseStyle} className="text-xl">✨</span>;
        }
        return (
            <div
                key={particle.id}
                style={{
                    ...baseStyle,
                    width: '8px',
                    height: '8px',
                    backgroundColor: particle.color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '0',
                }}
            />
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {/* Backdrop with blur */}
            <div
                className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${animationPhase === 'exit' ? 'opacity-0' : 'opacity-100'
                    }`}
            />

            {/* Particles */}
            <div className="absolute inset-0 overflow-hidden">
                {particles.map(renderParticle)}
            </div>

            {/* Main XP Display */}
            {showMain && (
                <div
                    className={`relative z-10 text-center transform transition-all duration-500 ${animationPhase === 'enter' ? 'scale-0 opacity-0' :
                            animationPhase === 'exit' ? 'scale-150 opacity-0 -translate-y-10' :
                                'scale-100 opacity-100'
                        }`}
                >
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 blur-3xl opacity-50 rounded-full scale-150" />

                    {/* XP Badge */}
                    <div className="relative bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 rounded-3xl p-8 shadow-2xl border-4 border-yellow-300">
                        {/* Star decorations */}
                        <span className="absolute -top-4 -left-4 text-4xl animate-spin" style={{ animationDuration: '3s' }}>⭐</span>
                        <span className="absolute -top-4 -right-4 text-4xl animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>⭐</span>
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-3xl animate-bounce">🎉</span>

                        {/* XP Amount */}
                        <div className="text-7xl font-black text-white drop-shadow-lg animate-pulse">
                            +{totalXP}
                        </div>
                        <div className="text-2xl font-bold text-white/90 mt-2">
                            XP {message}
                        </div>

                        {/* Bonus indicator */}
                        {hasBonus && (
                            <div className="mt-3 inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1">
                                <span className="text-lg">🔥</span>
                                <span className="text-white font-bold text-sm">
                                    {Math.round((bonusMultiplier - 1) * 100)}% ボーナス！
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Motivational message */}
                    <p className="mt-6 text-2xl font-bold text-white drop-shadow-lg animate-bounce">
                        すごい！がんばったね！ 🌟
                    </p>
                </div>
            )}

            {/* CSS Keyframes */}
            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) rotate(0deg); }
                    100% { transform: translateY(-200px) rotate(720deg); }
                }
                @keyframes fade-out {
                    0% { opacity: 1; }
                    70% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    );
};

// Level Up Animation Component
export const LevelUpAnimation: React.FC<{
    newLevel: number;
    isVisible: boolean;
    onComplete?: () => void;
    newRank?: string;
}> = ({ newLevel, isVisible, onComplete, newRank }) => {
    const [phase, setPhase] = useState<'hidden' | 'enter' | 'display' | 'exit'>('hidden');

    useEffect(() => {
        if (isVisible) {
            setPhase('enter');
            setTimeout(() => setPhase('display'), 300);
            setTimeout(() => setPhase('exit'), 3500);
            setTimeout(() => {
                setPhase('hidden');
                onComplete?.();
            }, 4000);
        }
    }, [isVisible, onComplete]);

    if (phase === 'hidden') return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            {/* Golden overlay */}
            <div
                className={`absolute inset-0 bg-gradient-to-b from-amber-500/40 to-orange-600/40 backdrop-blur-md transition-opacity duration-500 ${phase === 'exit' ? 'opacity-0' : 'opacity-100'
                    }`}
            />

            {/* Main content */}
            <div
                className={`relative z-10 text-center transform transition-all duration-700 ${phase === 'enter' ? 'scale-0 rotate-180' :
                        phase === 'exit' ? 'scale-0 -rotate-180 opacity-0' :
                            'scale-100 rotate-0'
                    }`}
            >
                {/* Rays background */}
                <div className="absolute inset-0 -z-10">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-2 h-40 bg-gradient-to-t from-yellow-300 to-transparent origin-bottom"
                            style={{
                                transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                                animation: 'ray-pulse 2s ease-in-out infinite',
                                animationDelay: `${i * 0.1}s`,
                            }}
                        />
                    ))}
                </div>

                {/* Level badge */}
                <div className="relative">
                    <div className="w-40 h-40 mx-auto bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl border-8 border-yellow-200 animate-pulse">
                        <div className="text-center">
                            <div className="text-6xl font-black text-white drop-shadow-lg">{newLevel}</div>
                            <div className="text-sm font-bold text-white/80 uppercase tracking-wider">Level</div>
                        </div>
                    </div>

                    {/* Crown */}
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-6xl animate-bounce">👑</span>
                </div>

                <h2 className="mt-6 text-4xl font-black text-white drop-shadow-lg">
                    レベルアップ！
                </h2>

                {newRank && (
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/30 backdrop-blur rounded-full px-6 py-2">
                        <span className="text-2xl">🏅</span>
                        <span className="text-white font-bold text-lg">{newRank}ランクに昇格！</span>
                    </div>
                )}

                <p className="mt-4 text-xl text-white/90 drop-shadow">
                    おめでとう！次のレベルに進化したよ！ 🚀
                </p>
            </div>

            <style>{`
                @keyframes ray-pulse {
                    0%, 100% { opacity: 0.3; transform: translate(-50%, -100%) scaleY(1); }
                    50% { opacity: 0.6; transform: translate(-50%, -100%) scaleY(1.2); }
                }
            `}</style>
        </div>
    );
};

export default XPGainAnimation;
