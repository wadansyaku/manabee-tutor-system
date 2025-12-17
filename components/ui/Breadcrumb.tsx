// Breadcrumb Navigation Component
// Provides visual hierarchy and easy navigation between pages
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../../types';
import { getTheme } from '../../theme';

interface BreadcrumbProps {
    role: UserRole;
    customTitle?: string;
}

interface BreadcrumbItem {
    label: string;
    path: string;
}

// Route configuration for breadcrumbs
const routeConfig: Record<string, { label: string; parent?: string }> = {
    '/': { label: 'ダッシュボード' },
    '/questions': { label: '質問ボード', parent: '/' },
    '/homework': { label: '宿題', parent: '/' },
    '/calendar': { label: 'カレンダー', parent: '/' },
    '/goals': { label: '目標', parent: '/' },
    '/chat': { label: 'AIチャット', parent: '/' },
    '/lessons': { label: '授業', parent: '/' },
    '/lessons/l1': { label: '授業詳細', parent: '/lessons' },
    '/schools': { label: '受験校', parent: '/' },
    '/scores': { label: '成績管理', parent: '/' },
    '/reports': { label: 'レポート', parent: '/' },
    '/recording': { label: '授業録音', parent: '/' },
    '/notifications': { label: '通知', parent: '/' },
    '/admin/users': { label: 'ユーザー管理', parent: '/' },
    '/admin/settings': { label: 'システム設定', parent: '/' },
    '/admin/usage': { label: '使用状況', parent: '/' },
    '/admin/database': { label: 'データベース', parent: '/' },
};

const getBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];
    let currentPath = pathname;

    while (currentPath) {
        const config = routeConfig[currentPath];
        if (config) {
            items.unshift({ label: config.label, path: currentPath });
            currentPath = config.parent || '';
        } else {
            // Handle dynamic routes like /lessons/:id
            const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
            const parentConfig = routeConfig[parentPath];
            if (parentConfig) {
                items.unshift({ label: 'ページ', path: currentPath });
                currentPath = parentPath;
            } else {
                break;
            }
        }
    }

    return items;
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ role, customTitle }) => {
    const location = useLocation();
    const theme = getTheme(role);
    const breadcrumbs = getBreadcrumbs(location.pathname);

    // Don't show breadcrumb on home
    if (location.pathname === '/') return null;

    // Override last item with custom title if provided
    if (customTitle && breadcrumbs.length > 0) {
        breadcrumbs[breadcrumbs.length - 1].label = customTitle;
    }

    return (
        <nav className="mb-4 flex items-center gap-2 text-sm animate-fade-in">
            {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                    <React.Fragment key={item.path}>
                        {index > 0 && (
                            <span className="text-gray-300">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </span>
                        )}
                        {isLast ? (
                            <span
                                className="font-semibold px-2 py-1 rounded-lg"
                                style={{ color: theme.primaryDark, backgroundColor: theme.primaryLight }}
                            >
                                {item.label}
                            </span>
                        ) : (
                            <Link
                                to={item.path}
                                className="text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
                            >
                                {index === 0 && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                )}
                                {item.label}
                            </Link>
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};

// Back button component for quick navigation
export const BackButton: React.FC<{ fallbackPath?: string }> = ({ fallbackPath = '/' }) => {
    const location = useLocation();
    const breadcrumbs = getBreadcrumbs(location.pathname);
    const previousPath = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2].path : fallbackPath;

    return (
        <Link
            to={previousPath}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors group mb-4"
        >
            <span className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </span>
            <span className="text-sm font-medium">戻る</span>
        </Link>
    );
};

export default Breadcrumb;
