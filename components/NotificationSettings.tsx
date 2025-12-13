// Notification Settings Component
import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

interface NotificationSettingsProps {
    onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onClose }) => {
    const [isSupported] = useState(notificationService.isSupported());
    const [permission, setPermission] = useState(notificationService.getPermissionStatus());
    const [prefs, setPrefs] = useState(notificationService.getPreferences());
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        setPermission(notificationService.getPermissionStatus());
    }, []);

    const handleRequestPermission = async () => {
        setIsRequesting(true);
        const granted = await notificationService.requestPermission();
        setPermission(notificationService.getPermissionStatus());
        if (granted) {
            setPrefs(notificationService.getPreferences());
        }
        setIsRequesting(false);
    };

    const handleToggleEnabled = () => {
        const newEnabled = !prefs.enabled;
        notificationService.updatePreferences({ enabled: newEnabled });
        setPrefs(notificationService.getPreferences());
    };

    const handleToggleReminderDay = (day: number) => {
        const current = prefs.reminderDays;
        const newDays = current.includes(day)
            ? current.filter(d => d !== day)
            : [...current, day].sort((a, b) => a - b);
        notificationService.updatePreferences({ reminderDays: newDays });
        setPrefs(notificationService.getPreferences());
    };

    const handleTestNotification = () => {
        notificationService.testNotification();
    };

    if (!isSupported) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-2">🔔 通知設定</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm">
                    <p>このブラウザは通知機能をサポートしていません。</p>
                    <p className="text-xs mt-1 text-amber-600">Chrome, Firefox, Safari などの最新ブラウザをお使いください。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">🔔 通知設定</h3>
                {onClose && (
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Permission Request */}
            {permission !== 'granted' && (
                <div className="mb-4">
                    {permission === 'denied' ? (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
                            <p className="font-semibold">通知がブロックされています</p>
                            <p className="text-xs mt-1">ブラウザの設定から通知を許可してください。</p>
                        </div>
                    ) : (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                            <p className="text-sm text-indigo-800 mb-3">
                                宿題の期限をお知らせする通知を有効にしますか？
                            </p>
                            <button
                                onClick={handleRequestPermission}
                                disabled={isRequesting}
                                className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {isRequesting ? '確認中...' : '通知を許可する'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Settings (only show if permission granted) */}
            {permission === 'granted' && (
                <div className="space-y-4">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">通知を有効化</p>
                            <p className="text-xs text-gray-500">期限が近づいたらお知らせします</p>
                        </div>
                        <button
                            onClick={handleToggleEnabled}
                            className={`relative w-12 h-6 rounded-full transition-colors ${prefs.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs.enabled ? 'translate-x-6' : 'translate-x-0.5'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Reminder Days */}
                    <div className={prefs.enabled ? '' : 'opacity-50 pointer-events-none'}>
                        <p className="text-sm font-semibold text-gray-700 mb-2">通知タイミング</p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { day: -1, label: '期限切れ' },
                                { day: 0, label: '当日' },
                                { day: 1, label: '1日前' },
                                { day: 2, label: '2日前' },
                                { day: 3, label: '3日前' },
                            ].map(({ day, label }) => (
                                <button
                                    key={day}
                                    onClick={() => handleToggleReminderDay(day)}
                                    className={`px-3 py-1.5 text-xs rounded-full border font-semibold transition ${prefs.reminderDays.includes(day)
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Test Button */}
                    <div className={prefs.enabled ? '' : 'opacity-50 pointer-events-none'}>
                        <button
                            onClick={handleTestNotification}
                            className="w-full border border-gray-200 text-gray-700 py-2 rounded-lg font-semibold text-sm hover:bg-gray-50 transition"
                        >
                            🔔 テスト通知を送信
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationSettings;
