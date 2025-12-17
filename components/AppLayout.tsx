import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import { RoleBadge } from './RoleBadge';
import { BottomNav } from './BottomNav';
import { OfflineIndicator } from './ui/OfflineIndicator';

interface AppLayoutProps {
    children: React.ReactNode;
    currentUser: User;
    onLogout: () => void;
    originalRole?: UserRole;
    onToggleStudentView?: () => void;
    isStudentView?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
    children,
    currentUser,
    onLogout,
    originalRole,
    onToggleStudentView,
    isStudentView
}) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Role based navigation
    const getNavItems = () => {
        const common = [
            { name: 'ダッシュボード', path: '/' },
        ];

        if (currentUser.role === UserRole.STUDENT) {
            return [
                ...common,
                { name: '写真で質問', path: '/questions' },
                { name: '宿題リスト', path: '/homework' },
            ];
        }

        if (currentUser.role === UserRole.TUTOR) {
            return [
                ...common,
                { name: '質問レビュー', path: '/questions' },
                { name: '宿題管理', path: '/homework' },
                { name: '成績管理', path: '/scores' },
                { name: '授業記録', path: '/lessons/l1' },
                { name: '受験校管理', path: '/schools' },
            ];
        }

        // Admin - System management only
        if (currentUser.role === UserRole.ADMIN) {
            return [
                ...common,
                { name: 'ユーザー管理', path: '/admin/users' },
                { name: 'システム設定', path: '/admin/settings' },
                { name: '使用状況', path: '/admin/usage' },
                { name: 'DB初期化', path: '/admin/database' },
            ];
        }

        // Guardian only
        return [
            ...common,
            { name: '宿題', path: '/homework' },
            { name: '成績', path: '/scores' },
            { name: '学習状況', path: '/lessons/l1' },
            { name: '受験校', path: '/schools' },
        ];
    };

    const navItems = getNavItems();

    // Close mobile menu on navigation
    const handleNavClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen flex bg-gray-100">
            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar (Desktop) + Mobile Drawer */}
            <div className={`w-64 bg-white shadow-xl fixed inset-y-0 z-50 border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
                    <div className="flex items-center">
                        <span className="text-xl font-bold text-indigo-600">Manabee</span>
                        {isStudentView && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">生徒View</span>}
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="md:hidden text-gray-500 hover:text-gray-700"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <nav className="p-4 space-y-1">
                    {navItems.map((item, index) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={handleNavClick}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
                    {/* Student View Toggle for Guardians */}
                    {originalRole === UserRole.GUARDIAN && (
                        <button
                            onClick={onToggleStudentView}
                            className={`w-full text-xs mb-3 py-2 rounded border font-bold flex items-center justify-center gap-2 transition-all ${isStudentView ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'}`}
                        >
                            {isStudentView ? '保護者に戻る' : '生徒として表示'}
                        </button>
                    )}

                    <div className="flex items-center gap-2 mb-4 px-2">
                        <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {currentUser.name[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{currentUser.name}</p>
                            <RoleBadge role={currentUser.role} />
                        </div>
                    </div>
                    <button onClick={onLogout} className="w-full text-xs text-gray-500 hover:text-red-600 border border-gray-200 rounded py-2 transition-colors">
                        ログアウト
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col">
                <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 md:hidden">
                    {/* Hamburger Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="text-lg font-bold text-indigo-600">Manabee</span>
                    <button onClick={onLogout} className="text-xs text-gray-500">ログアウト</button>
                </header>

                <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-y-auto">
                    {children}
                </main>

                {/* Bottom Navigation for Mobile */}
                <BottomNav currentUser={currentUser} />

                {/* Offline Status Indicator */}
                <OfflineIndicator />
            </div>
        </div>
    );
};
