import React, { useState, useEffect } from 'react';
import { User } from '../../types';

interface Notification {
    id: string;
    type: 'homework' | 'lesson' | 'message' | 'achievement' | 'system';
    title: string;
    body: string;
    read: boolean;
    createdAt: string;
    actionUrl?: string;
}

interface NotificationCenterProps {
    currentUser: User;
    onNotificationClick?: (notification: Notification) => void;
}

const typeConfig: Record<string, { icon: string; color: string }> = {
    homework: { icon: '📝', color: 'bg-blue-100 text-blue-600' },
    lesson: { icon: '📚', color: 'bg-green-100 text-green-600' },
    message: { icon: '💬', color: 'bg-purple-100 text-purple-600' },
    achievement: { icon: '🏆', color: 'bg-amber-100 text-amber-600' },
    system: { icon: '⚙️', color: 'bg-gray-100 text-gray-600' },
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ currentUser, onNotificationClick }) => {
    const [notifications, setNotifications] = useState<Notification[]>([
        {
            id: '1',
            type: 'homework',
            title: '宿題の期限が近づいています',
            body: '算数 計算ドリル P.20-25 の期限が明日です',
            read: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
            id: '2',
            type: 'lesson',
            title: '明日の授業リマインダー',
            body: '12/18 16:00 から算数の授業があります',
            read: false,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
            id: '3',
            type: 'achievement',
            title: '🎉 バッジを獲得しました！',
            body: '7日連続学習達成バッジをゲットしました',
            read: true,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
    ]);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === 'granted') {
                new Notification('🐝 Manabee通知', {
                    body: 'プッシュ通知が有効になりました！',
                    icon: '/favicon.ico',
                });
            }
        }
    };

    const markAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}分前`;
        if (diffHours < 24) return `${diffHours}時間前`;
        return `${diffDays}日前`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg relative">
                        🔔
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">通知センター</h2>
                        <p className="text-sm text-gray-500">
                            {unreadCount > 0 ? `${unreadCount}件の未読` : 'すべて既読'}
                        </p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        すべて既読にする
                    </button>
                )}
            </div>

            {/* Push Notification Permission */}
            {permissionStatus !== 'granted' && (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
                    <div className="flex items-start gap-4">
                        <span className="text-3xl">🔔</span>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">プッシュ通知を有効にする</h3>
                            <p className="text-purple-100 text-sm mb-4">
                                宿題の期限や授業のリマインダーをリアルタイムで受け取れます
                            </p>
                            <button
                                onClick={requestPermission}
                                className="px-6 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors"
                            >
                                通知を許可する
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        通知はありません
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map(notification => {
                            const config = typeConfig[notification.type];
                            return (
                                <button
                                    key={notification.id}
                                    onClick={() => {
                                        markAsRead(notification.id);
                                        onNotificationClick?.(notification);
                                    }}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex gap-4 ${!notification.read ? 'bg-blue-50/50' : ''
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color}`}>
                                        {config.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                {notification.title}
                                            </p>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {formatTime(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 truncate">{notification.body}</p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full self-center"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">通知設定</h3>
                <div className="space-y-4">
                    {[
                        { key: 'homework', label: '宿題リマインダー', desc: '期限の前日に通知' },
                        { key: 'lesson', label: '授業リマインダー', desc: '授業の1時間前に通知' },
                        { key: 'achievement', label: '達成通知', desc: 'バッジ獲得時に通知' },
                    ].map(setting => (
                        <div key={setting.key} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-900">{setting.label}</p>
                                <p className="text-sm text-gray-500">{setting.desc}</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationCenter;
