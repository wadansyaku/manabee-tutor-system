import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    NotificationItem,
    NotificationSettings,
    NotificationType,
    User,
} from '../../types';
import { notificationService } from '../../services/notificationService';
import { defaultNotificationSettings } from '../../services/firestoreDataService';

interface NotificationCenterProps {
    currentUser: User;
}

type SortKey = 'priority' | 'newest';

const categoryFilters: { key: NotificationType; label: string; icon: string }[] = [
    { key: 'homework', label: '宿題', icon: '📝' },
    { key: 'lesson', label: '授業', icon: '📚' },
    { key: 'achievement', label: '達成', icon: '🏆' },
    { key: 'message', label: '連絡', icon: '💬' },
];

const reminderOptions: Record<keyof NotificationSettings, number[]> = {
    homeworkReminder: [48, 24, 12, 3], // hours before
    lessonReminder: [240, 180, 120, 60], // minutes before
    achievement: [0],
};

const formatRelativeTime = (iso: string) => {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return `${diffDays}日前`;
};

const buildUrgency = (notification: NotificationItem) => {
    const now = new Date();
    const due = notification.payload?.dueDate ? new Date(notification.payload.dueDate) : null;
    const start = notification.payload?.startTime ? new Date(notification.payload.startTime) : null;

    if (due) {
        const diffHours = (due.getTime() - now.getTime()) / 3600000;
        if (diffHours < 0) return '期限切れ';
        if (diffHours <= 24) return '24時間以内';
    }

    if (start) {
        const isToday = start.toDateString() === now.toDateString();
        if (isToday) return '今日の授業';
    }

    if (notification.priority === 'high') return '最優先';
    return '';
};

const notificationIcons: Record<NotificationType, string> = {
    homework: '📝',
    lesson: '📚',
    achievement: '🏆',
    system: '⚙️',
    message: '💬',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ currentUser }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
    const [sortBy, setSortBy] = useState<SortKey>('priority');
    const [selectedCategories, setSelectedCategories] = useState<NotificationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [confirmingMarkAll, setConfirmingMarkAll] = useState(false);
    const [undoIds, setUndoIds] = useState<string[]>([]);
    const [statusMessage, setStatusMessage] = useState('');

    const unreadCount = useMemo(() => notifications.filter(n => !n.readAt).length, [notifications]);

    const filteredNotifications = useMemo(() => {
        let data = [...notifications];
        if (selectedCategories.length) {
            data = data.filter(n => selectedCategories.includes(n.type));
        }

        data = data.sort((a, b) => {
            if (sortBy === 'priority') {
                const priorityRank: Record<string, number> = { high: 0, normal: 1, low: 2 };
                const diff = (priorityRank[a.priority || 'normal'] ?? 1) - (priorityRank[b.priority || 'normal'] ?? 1);
                if (diff !== 0) return diff;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return data;
    }, [notifications, selectedCategories, sortBy]);

    const urgentToday = useMemo(() =>
        filteredNotifications.filter(n => buildUrgency(n)).slice(0, 3),
        [filteredNotifications]
    );

    useEffect(() => {
        const hydrate = async () => {
            setLoading(true);
            setError(null);
            try {
                const [loadedNotifications, loadedSettings] = await Promise.all([
                    notificationService.fetchNotifications(currentUser.id, { sortBy }),
                    notificationService.getSettings(currentUser.id),
                ]);
                setNotifications(loadedNotifications);
                setSettings(loadedSettings);
            } catch (e) {
                setError('通知の取得に失敗しました。少し待ってから再試行してください。');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        hydrate();
    }, [currentUser.id, sortBy]);

    const handleMarkAll = async () => {
        if (!confirmingMarkAll) {
            setConfirmingMarkAll(true);
            setStatusMessage('確認してください: すべて既読にしますか？');
            return;
        }

        const updatedIds = await notificationService.markAllRead(currentUser);
        const nowIso = new Date().toISOString();
        setNotifications(prev => prev.map(n => updatedIds.includes(n.id) ? { ...n, readAt: nowIso } : n));
        setUndoIds(updatedIds);
        setConfirmingMarkAll(false);
        setStatusMessage('すべて既読にしました。元に戻す場合は「取り消す」を押してください。');

        if (updatedIds.length) {
            setTimeout(() => setUndoIds([]), 8000);
        }
    };

    const handleUndo = async () => {
        if (!undoIds.length) return;
        await notificationService.undoMarkAll(currentUser.id, undoIds);
        setNotifications(prev => prev.map(n => undoIds.includes(n.id) ? { ...n, readAt: null } : n));
        setUndoIds([]);
        setStatusMessage('既読操作を取り消しました');
    };

    const handleNotificationClick = async (notification: NotificationItem) => {
        if (!notification.readAt) {
            await notificationService.markAsRead(notification.id, currentUser);
            setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n));
        }

        const target = notificationService.resolveDeepLink(notification);
        navigate(target);
    };

    const toggleCategory = (category: NotificationType) => {
        setSelectedCategories(prev => prev.includes(category)
            ? prev.filter(c => c !== category)
            : [...prev, category]
        );
    };

    const handleSettingToggle = async (key: keyof NotificationSettings) => {
        const next = {
            ...settings,
            [key]: { ...settings[key], enabled: !settings[key].enabled },
        } as NotificationSettings;
        setSettings(next);
        await notificationService.updateSettings(currentUser.id, next);
    };

    const handleOffsetChange = async (key: keyof NotificationSettings, offset: number) => {
        const current = settings[key].offsets;
        const nextOffsets = current.includes(offset)
            ? current.filter(o => o !== offset)
            : [...current, offset].sort((a, b) => a - b);

        const next = {
            ...settings,
            [key]: { ...settings[key], offsets: nextOffsets },
        } as NotificationSettings;
        setSettings(next);
        await notificationService.updateSettings(currentUser.id, next);
    };

    const renderReminderSetting = (key: keyof NotificationSettings, label: string, unit: 'hours' | 'minutes') => (
        <div className="p-4 rounded-xl border border-gray-100 flex flex-col gap-3" role="group" aria-label={`${label}の通知設定`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">タイミングを編集できます</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        checked={settings[key].enabled}
                        onChange={() => handleSettingToggle(key)}
                        className="sr-only"
                        aria-label={`${label}の通知を${settings[key].enabled ? '無効化' : '有効化'}する`}
                    />
                    <div className={`w-11 h-6 bg-gray-200 rounded-full transition peer-focus:outline-none peer-focus:ring-2 ${settings[key].enabled ? 'bg-blue-600' : ''}`}>
                        <div className={`absolute w-5 h-5 bg-white rounded-full shadow transform transition ${settings[key].enabled ? 'translate-x-5' : 'translate-x-1'} top-[2px]`}></div>
                    </div>
                </label>
            </div>
            <div className="flex flex-wrap gap-2" aria-label={`${label}の通知タイミング`}>
                {reminderOptions[key].map(option => {
                    const active = settings[key].offsets.includes(option);
                    const labelText = unit === 'hours' ? `${option}時間前` : `${option}分前`;
                    return (
                        <button
                            key={option}
                            type="button"
                            onClick={() => handleOffsetChange(key, option)}
                            className={`px-3 py-1.5 rounded-full text-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${active ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold' : 'bg-white border-gray-200 text-gray-700'}`}
                            aria-pressed={active}
                        >
                            {labelText}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const EmptyState = () => (
        <div className="p-8 text-center text-gray-600" role="status">
            <p className="font-semibold text-lg">未読の通知はありません</p>
            <p className="text-sm text-gray-500 mt-2">宿題や授業のリマインダーはここに集約されます。<br />宿題ページで今日のタスクを確認しましょう。</p>
            <div className="mt-4 flex justify-center gap-3">
                <button
                    onClick={() => navigate('/homework')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                >
                    宿題ページへ移動
                </button>
                <button
                    onClick={() => navigate('/ai-assistant')}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                >
                    AI先生に相談する
                </button>
            </div>
        </div>
    );

    return (
        <section className="space-y-6" aria-label="通知センター">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-2xl text-white shadow-lg" aria-label="通知アイコン">
                        🔔
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold" aria-label={`未読 ${unreadCount}件`}>{unreadCount}</span>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">生徒用</p>
                        <h1 className="text-2xl font-bold text-gray-900">通知センター</h1>
                        <p className="text-sm text-gray-600">宿題・授業・達成の重要事項がここに集約されます</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {undoIds.length > 0 && (
                        <button
                            onClick={handleUndo}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                        >
                            取り消す
                        </button>
                    )}
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAll}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${confirmingMarkAll ? 'bg-red-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            aria-live="polite"
                        >
                            {confirmingMarkAll ? '本当にすべて既読にする' : `すべて既読にする (${unreadCount})`}
                        </button>
                    )}
                </div>
            </header>

            {statusMessage && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800" role="status" aria-live="polite">
                    {statusMessage}
                </div>
            )}

            {/* 今日やるべきこと */}
            <section className="rounded-2xl border border-gray-100 bg-white shadow-sm" aria-label="今日やるべきこと">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs font-semibold text-indigo-600 tracking-wide uppercase">今日やるべきこと</p>
                        <h2 className="text-lg font-bold text-gray-900">期限切れ・今日の授業・24時間以内のタスク</h2>
                    </div>
                    <button
                        onClick={() => navigate('/homework')}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                    >
                        タスクを並び替えて見る
                    </button>
                </div>
                <div className="grid gap-4 p-6 md:grid-cols-3" role="list">
                    {urgentToday.length === 0 && (
                        <div className="md:col-span-3 text-sm text-gray-600" role="status">今日中に対応が必要な通知はありません。連続学習を続けましょう。</div>
                    )}
                    {urgentToday.map(item => {
                        const urgency = buildUrgency(item);
                        const cta = item.payload?.ctaLabel || '詳細を見る';
                        return (
                            <article
                                key={`urgent-${item.id}`}
                                className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm focus-within:ring-2 focus-within:ring-amber-500"
                                role="listitem"
                            >
                                <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                                    <span className="text-lg" aria-hidden>{notificationIcons[item.type]}</span>
                                    <span>{urgency || '優先度高'}</span>
                                </div>
                                <p className="mt-2 text-base font-bold text-gray-900">{item.title}</p>
                                <p className="mt-1 text-sm text-gray-700">{item.body}</p>
                                <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                                    <span>{formatRelativeTime(item.createdAt)}</span>
                                    <button
                                        onClick={() => handleNotificationClick(item)}
                                        className="text-indigo-700 font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
                                    >
                                        {cta}
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* フィルタ */}
            <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between" aria-label="通知のフィルタと並び替え">
                <div className="flex flex-wrap gap-2" role="group" aria-label="カテゴリフィルタ">
                    {categoryFilters.map(filter => {
                        const active = selectedCategories.includes(filter.key);
                        return (
                            <button
                                key={filter.key}
                                type="button"
                                onClick={() => toggleCategory(filter.key)}
                                className={`px-3 py-1.5 rounded-full border text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${active ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-200'}`}
                                aria-pressed={active}
                            >
                                <span aria-hidden className="mr-1">{filter.icon}</span>
                                {filter.label}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => setSelectedCategories([])}
                        className="px-3 py-1.5 rounded-full border text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    >
                        すべて表示
                    </button>
                </div>
                <div className="flex items-center gap-2" role="group" aria-label="並び替え">
                    <label className="text-sm text-gray-600" htmlFor="sort-select">並び替え</label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as SortKey)}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                    >
                        <option value="priority">重要順</option>
                        <option value="newest">新しい順</option>
                    </select>
                </div>
            </section>

            {/* 通知リスト */}
            <section className="rounded-2xl border border-gray-100 bg-white shadow-sm" aria-label="通知リスト">
                <div className="divide-y divide-gray-100" role="list">
                    {loading && (
                        <div className="p-6 text-gray-600" role="status">読み込み中...</div>
                    )}
                    {!loading && error && (
                        <div className="p-6 text-red-600" role="alert">{error}</div>
                    )}
                    {!loading && !error && filteredNotifications.length === 0 && <EmptyState />}
                    {!loading && !error && filteredNotifications.map(notification => {
                        const urgency = buildUrgency(notification);
                        const isRead = Boolean(notification.readAt);
                        return (
                            <button
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full text-left p-4 flex gap-4 items-start focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-100/60'}`}
                                role="listitem"
                                aria-label={`${notification.title} ${isRead ? '既読' : '未読'}`}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${isRead ? 'bg-gray-100 text-gray-700' : 'bg-blue-600 text-white'}`} aria-hidden>
                                    {notificationIcons[notification.type]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isRead ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                                                {notificationService.categoryLabel(notification.type)}
                                            </span>
                                            {urgency && (
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{urgency}</span>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">{formatRelativeTime(notification.createdAt)}</span>
                                    </div>
                                    <p className={`mt-1 font-semibold ${isRead ? 'text-gray-700' : 'text-gray-900'}`}>{notification.title}</p>
                                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{notification.body}</p>
                                    <div className="mt-2 flex items-center gap-3 text-sm text-blue-700 font-semibold">
                                        <span className="flex items-center gap-1" aria-hidden>
                                            {notification.payload?.ctaLabel || '詳細を見る'}
                                            <span>→</span>
                                        </span>
                                        <span className="sr-only">通知の詳細へ移動</span>
                                        {!isRead && <span className="text-xs text-blue-600">未読</span>}
                                    </div>
                                </div>
                                {!isRead && <span className="w-2 h-2 bg-blue-600 rounded-full mt-2" aria-hidden></span>}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* 通知設定 */}
            <section className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 space-y-4" aria-label="通知設定">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">通知タイミング</p>
                        <h3 className="text-lg font-bold text-gray-900">宿題・授業・達成のリマインダー</h3>
                        <p className="text-sm text-gray-600">前日・当日・数時間前など、自分に合ったタイミングでリマインドします。</p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {renderReminderSetting('homeworkReminder', '宿題リマインダー', 'hours')}
                    {renderReminderSetting('lessonReminder', '授業リマインダー', 'minutes')}
                    {renderReminderSetting('achievement', '達成通知', 'hours')}
                </div>
            </section>
        </section>
    );
};

export default NotificationCenter;
