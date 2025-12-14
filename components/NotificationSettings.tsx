import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
    requestNotificationPermission,
    getNotificationPermissionStatus,
    showLocalNotification
} from '../services/notificationService';

interface NotificationSettingsProps {
    currentUser: User;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ currentUser }) => {
    const [permissionStatus, setPermissionStatus] = useState<string>('default');
    const [fcmToken, setFcmToken] = useState<string | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);

    useEffect(() => {
        setPermissionStatus(getNotificationPermissionStatus());
    }, []);

    const handleRequestPermission = async () => {
        setIsRequesting(true);
        try {
            const token = await requestNotificationPermission();
            setFcmToken(token);
            setPermissionStatus(getNotificationPermissionStatus());

            if (token || Notification.permission === 'granted') {
                // Show test notification
                showLocalNotification('通知が有効になりました！', {
                    body: 'Manabeeからの通知を受け取れます。'
                });
            }
        } catch (error) {
            console.error('Permission request failed:', error);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleTestNotification = () => {
        showLocalNotification('テスト通知', {
            body: 'これはテスト通知です。宿題のリマインドもこのように届きます。',
            tag: 'test'
        });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">通知設定</h1>
                <p className="text-gray-500 mb-6">
                    宿題の期限リマインドやお知らせを受け取る設定を行います
                </p>

                {/* Permission Status */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">
                                {permissionStatus === 'granted' ? '🔔' :
                                    permissionStatus === 'denied' ? '🔕' : '🔔'}
                            </span>
                            <div>
                                <p className="font-medium text-gray-900">通知許可状態</p>
                                <p className="text-sm text-gray-500">
                                    {permissionStatus === 'granted' && '許可済み - 通知を受け取れます'}
                                    {permissionStatus === 'denied' && '拒否 - ブラウザ設定から許可してください'}
                                    {permissionStatus === 'default' && '未設定 - 許可が必要です'}
                                    {permissionStatus === 'unsupported' && 'このブラウザは通知に対応していません'}
                                </p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${permissionStatus === 'granted' ? 'bg-green-100 text-green-700' :
                                permissionStatus === 'denied' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-200 text-gray-600'
                            }`}>
                            {permissionStatus === 'granted' ? '有効' :
                                permissionStatus === 'denied' ? '無効' : '未設定'}
                        </span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
                        <button
                            onClick={handleRequestPermission}
                            disabled={isRequesting || permissionStatus === 'denied'}
                            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {isRequesting ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    処理中...
                                </>
                            ) : (
                                <>
                                    <span>🔔</span>
                                    通知を許可する
                                </>
                            )}
                        </button>
                    )}

                    {permissionStatus === 'granted' && (
                        <button
                            onClick={handleTestNotification}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>📤</span>
                            テスト通知を送信
                        </button>
                    )}

                    {permissionStatus === 'denied' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                            <p className="font-medium mb-1">⚠️ 通知がブロックされています</p>
                            <p>ブラウザのアドレスバー横の鍵アイコンから、通知を許可してください。</p>
                        </div>
                    )}
                </div>

                {/* FCM Token (Debug) */}
                {fcmToken && (
                    <div className="mt-6 bg-gray-100 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-1">FCM Token (開発用)</p>
                        <p className="text-xs font-mono text-gray-600 break-all">{fcmToken}</p>
                    </div>
                )}

                {/* Notification Types */}
                <div className="mt-8 border-t pt-6">
                    <h3 className="font-medium text-gray-900 mb-4">通知の種類</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📝</span>
                                <div>
                                    <p className="font-medium text-gray-900">宿題リマインド</p>
                                    <p className="text-sm text-gray-500">期限の前日と当日に通知</p>
                                </div>
                            </div>
                            <span className={`w-10 h-6 rounded-full ${permissionStatus === 'granted' ? 'bg-green-500' : 'bg-gray-300'
                                } relative`}>
                                <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${permissionStatus === 'granted' ? 'right-1' : 'left-1'
                                    }`} />
                            </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">❓</span>
                                <div>
                                    <p className="font-medium text-gray-900">質問への回答</p>
                                    <p className="text-sm text-gray-500">講師から回答があった時に通知</p>
                                </div>
                            </div>
                            <span className={`w-10 h-6 rounded-full ${permissionStatus === 'granted' ? 'bg-green-500' : 'bg-gray-300'
                                } relative`}>
                                <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${permissionStatus === 'granted' ? 'right-1' : 'left-1'
                                    }`} />
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
