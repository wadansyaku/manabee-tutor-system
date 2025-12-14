// Mobile Bottom Navigation Component
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';

interface BottomNavProps {
    currentUser: User;
}

interface NavItem {
    name: string;
    path: string;
    icon: string;
}

const getNavItems = (role: UserRole): NavItem[] => {
    const dashboard = { name: 'ホーム', path: '/', icon: '🏠' };

    if (role === UserRole.STUDENT) {
        return [
            dashboard,
            { name: '質問', path: '/questions', icon: '📸' },
            { name: '宿題', path: '/homework', icon: '📝' },
            { name: '授業', path: '/lessons/l1', icon: '📖' },
        ];
    }

    if (role === UserRole.TUTOR) {
        return [
            dashboard,
            { name: 'レビュー', path: '/questions', icon: '❓' },
            { name: '宿題', path: '/homework', icon: '📝' },
            { name: '成績', path: '/scores', icon: '📊' },
            { name: '学校', path: '/schools', icon: '🏫' },
        ];
    }

    if (role === UserRole.ADMIN) {
        return [
            dashboard,
            { name: 'ユーザー', path: '/admin/users', icon: '👥' },
            { name: '設定', path: '/admin/settings', icon: '⚙️' },
            { name: '使用状況', path: '/admin/usage', icon: '📈' },
        ];
    }

    // Guardian
    return [
        dashboard,
        { name: '宿題', path: '/homework', icon: '📝' },
        { name: '成績', path: '/scores', icon: '📊' },
        { name: '学校', path: '/schools', icon: '🏫' },
    ];
};

export const BottomNav: React.FC<BottomNavProps> = ({ currentUser }) => {
    const location = useLocation();
    const navItems = getNavItems(currentUser.role);

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex flex-col items-center justify-center flex-1 py-2 px-1 transition-colors ${isActive
                                    ? 'text-indigo-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className={`text-xl mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`}>
                                {item.icon}
                            </span>
                            <span className={`text-xs font-medium truncate max-w-full ${isActive ? 'font-bold' : ''}`}>
                                {item.name}
                            </span>
                            {isActive && (
                                <div className="absolute bottom-1 w-8 h-1 bg-indigo-600 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
