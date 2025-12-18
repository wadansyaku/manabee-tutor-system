// Mobile Bottom Navigation Component
// Enhanced with role-based theming, notification badges, and improved animations
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';

interface BottomNavProps {
    currentUser: User;
    notificationCounts?: Record<string, number>; // { '/questions': 3, '/homework': 1 }
}

interface NavItem {
    name: string;
    path: string;
    icon: string;
    badgeKey?: string; // Key for notification count
}

// Get role-specific active colors
const getActiveColors = (role: UserRole): { text: string; bg: string; indicator: string } => {
    switch (role) {
        case UserRole.STUDENT:
            return { text: 'text-emerald-600', bg: 'bg-emerald-50', indicator: 'bg-emerald-500' };
        case UserRole.GUARDIAN:
            return { text: 'text-rose-600', bg: 'bg-rose-50', indicator: 'bg-rose-500' };
        case UserRole.TUTOR:
            return { text: 'text-blue-600', bg: 'bg-blue-50', indicator: 'bg-blue-500' };
        case UserRole.ADMIN:
            return { text: 'text-gray-700', bg: 'bg-gray-100', indicator: 'bg-gray-600' };
        default:
            return { text: 'text-indigo-600', bg: 'bg-indigo-50', indicator: 'bg-indigo-500' };
    }
};

const getNavItems = (role: UserRole): NavItem[] => {
    const dashboard = { name: 'ホーム', path: '/', icon: '🏠' };

    if (role === UserRole.STUDENT) {
        return [
            dashboard,
            { name: 'AI', path: '/ai-assistant', icon: '✨' },
            { name: '宿題', path: '/homework', icon: '📝', badgeKey: 'homework' },
            { name: '目標', path: '/goals', icon: '🎯' },
        ];
    }

    if (role === UserRole.TUTOR) {
        return [
            dashboard,
            { name: 'レビュー', path: '/questions', icon: '📋', badgeKey: 'questions' },
            { name: '宿題', path: '/homework', icon: '📝' },
            { name: '成績', path: '/scores', icon: '📊' },
            { name: '録音', path: '/recording', icon: '🎙️' },
        ];
    }

    if (role === UserRole.ADMIN) {
        return [
            dashboard,
            { name: 'ユーザー', path: '/admin/users', icon: '👥' },
            { name: '設定', path: '/admin/settings', icon: '⚙️' },
            { name: '監視', path: '/admin/usage', icon: '📈' },
        ];
    }

    // Guardian
    return [
        dashboard,
        { name: '進捗', path: '/homework', icon: '📚', badgeKey: 'homework' },
        { name: '成績', path: '/scores', icon: '📊' },
        { name: 'レポート', path: '/reports', icon: '📥' },
    ];
};

// Haptic feedback for touch devices
const triggerHaptic = () => {
    if ('vibrate' in navigator) {
        navigator.vibrate(10); // Light haptic feedback
    }
};

export const BottomNav: React.FC<BottomNavProps> = ({ currentUser, notificationCounts = {} }) => {
    const location = useLocation();
    const navItems = getNavItems(currentUser.role);
    const colors = getActiveColors(currentUser.role);

    const handleClick = () => {
        triggerHaptic();
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/80 md:hidden z-50 safe-area-bottom shadow-lg">
            <div className="flex justify-around items-center h-16 px-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                    const badgeCount = item.badgeKey ? notificationCounts[item.badgeKey] || 0 : 0;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleClick}
                            className={`relative flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-xl mx-0.5 transition-all duration-200 active:scale-95 ${isActive
                                ? `${colors.text} ${colors.bg}`
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {/* Icon with animation */}
                            <span
                                className={`text-2xl mb-0.5 transition-all duration-300 ${isActive
                                    ? 'scale-110 drop-shadow-sm'
                                    : 'opacity-70 group-hover:opacity-100'
                                    }`}
                            >
                                {item.icon}
                            </span>

                            {/* Label */}
                            <span
                                className={`text-[10px] font-medium truncate max-w-full transition-all duration-200 ${isActive ? 'font-bold opacity-100' : 'opacity-60'
                                    }`}
                            >
                                {item.name}
                            </span>

                            {/* Active indicator dot */}
                            {isActive && (
                                <div
                                    className={`absolute -bottom-0.5 w-1 h-1 ${colors.indicator} rounded-full animate-pulse`}
                                />
                            )}

                            {/* Notification Badge */}
                            {badgeCount > 0 && (
                                <span
                                    className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-lg animate-bounce"
                                    style={{ animationDuration: '2s' }}
                                >
                                    {badgeCount > 9 ? '9+' : badgeCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
