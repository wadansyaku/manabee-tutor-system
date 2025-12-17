// Admin System Settings Component
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';

interface SystemSettingsProps {
    currentUser: User;
    onAudit: (action: string, summary: string) => void;
}

interface ApiUsageStats {
    totalRequests: number;
    totalTokens: number;
    estimatedCost: number;
    lastReset: string;
}

interface SystemConfig {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    aiRateLimit: number; // requests per user per day
    maxStudentsPerGuardian: number;
    sessionTimeoutMinutes: number;
    enableNotifications: boolean;
    enableAIFeatures: boolean;
    geminiApiKeyMasked: string;
    costLimit: number;
    costAlertThreshold: number; // Percentage to trigger alert (e.g., 80)
    apiUsage: ApiUsageStats;
}

const STORAGE_KEY_SYSTEM_CONFIG = 'manabee_system_config_v1';
const STORAGE_KEY_API_USAGE = 'manabee_api_usage_v1';

const DEFAULT_API_USAGE: ApiUsageStats = {
    totalRequests: 0,
    totalTokens: 0,
    estimatedCost: 0,
    lastReset: new Date().toISOString()
};

const DEFAULT_CONFIG: SystemConfig = {
    maintenanceMode: false,
    maintenanceMessage: 'システムメンテナンス中です。しばらくお待ちください。',
    aiRateLimit: 10,
    maxStudentsPerGuardian: 5,
    sessionTimeoutMinutes: 60,
    enableNotifications: true,
    enableAIFeatures: true,
    geminiApiKeyMasked: '****-****-****',
    costLimit: 50,
    costAlertThreshold: 80,
    apiUsage: DEFAULT_API_USAGE
};

const loadConfig = (): SystemConfig => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SYSTEM_CONFIG);
        return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
};

const saveConfig = (config: SystemConfig) => {
    localStorage.setItem(STORAGE_KEY_SYSTEM_CONFIG, JSON.stringify(config));
};

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser, onAudit }) => {
    const [config, setConfig] = useState<SystemConfig>(loadConfig());
    const [hasChanges, setHasChanges] = useState(false);

    const handleChange = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        saveConfig(config);
        setHasChanges(false);
        onAudit('system_config_updated', 'システム設定を更新しました');
    };

    const handleReset = () => {
        if (!confirm('設定をデフォルトに戻しますか？')) return;
        setConfig(DEFAULT_CONFIG);
        saveConfig(DEFAULT_CONFIG);
        setHasChanges(false);
        onAudit('system_config_reset', 'システム設定をリセットしました');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-16">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black rounded-3xl p-6 text-white shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm opacity-80">システム管理</p>
                        <h1 className="text-2xl font-bold">システム設定</h1>
                        <p className="opacity-80 text-sm mt-1">アプリケーション全体の設定管理</p>
                    </div>
                    <span className="text-4xl">⚙️</span>
                </div>
            </div>

            {/* Maintenance Mode */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🚧 メンテナンスモード
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">メンテナンスモード</p>
                            <p className="text-sm text-gray-500">有効にすると管理者以外はアクセスできなくなります</p>
                        </div>
                        <button
                            onClick={() => handleChange('maintenanceMode', !config.maintenanceMode)}
                            className={`relative w-14 h-8 rounded-full transition ${config.maintenanceMode ? 'bg-red-500' : 'bg-gray-200'
                                }`}
                        >
                            <span className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition ${config.maintenanceMode ? 'translate-x-6' : ''
                                }`} />
                        </button>
                    </div>
                    {config.maintenanceMode && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">メンテナンスメッセージ</label>
                            <textarea
                                value={config.maintenanceMessage}
                                onChange={e => handleChange('maintenanceMessage', e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2 h-20"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* AI Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    🤖 AI機能設定
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">AI機能</p>
                            <p className="text-sm text-gray-500">AIによる要約・宿題・クイズ生成</p>
                        </div>
                        <button
                            onClick={() => handleChange('enableAIFeatures', !config.enableAIFeatures)}
                            className={`relative w-14 h-8 rounded-full transition ${config.enableAIFeatures ? 'bg-green-500' : 'bg-gray-200'
                                }`}
                        >
                            <span className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition ${config.enableAIFeatures ? 'translate-x-6' : ''
                                }`} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">
                                レート制限（1日あたり／ユーザー）
                            </label>
                            <input
                                type="number"
                                value={config.aiRateLimit}
                                onChange={e => handleChange('aiRateLimit', parseInt(e.target.value) || 0)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2"
                                min={0}
                                max={100}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">APIキー</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={config.geminiApiKeyMasked}
                                    onChange={e => handleChange('geminiApiKeyMasked', e.target.value)}
                                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-gray-700 font-mono text-sm"
                                    placeholder="Enter API Key"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-1">本番環境ではCloud Functions経由で管理</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">
                                コスト上限 (USD/月)
                            </label>
                            <input
                                type="number"
                                value={config.costLimit}
                                onChange={e => handleChange('costLimit', parseInt(e.target.value) || 0)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2"
                                min={0}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">
                                アラート閾値 (%)
                            </label>
                            <input
                                type="number"
                                value={config.costAlertThreshold}
                                onChange={e => handleChange('costAlertThreshold', parseInt(e.target.value) || 80)}
                                className="w-full border border-gray-300 rounded-xl px-4 py-2"
                                min={0}
                                max={100}
                            />
                            <p className="text-xs text-gray-400 mt-1">この割合を超えるとアラート表示</p>
                        </div>
                    </div>

                    {/* API Usage Dashboard */}
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <h4 className="text-sm font-bold text-gray-700 mb-4">📊 API使用状況</h4>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-indigo-600">{config.apiUsage?.totalRequests || 0}</p>
                                <p className="text-xs text-gray-500">リクエスト数</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-purple-600">{((config.apiUsage?.totalTokens || 0) / 1000).toFixed(1)}K</p>
                                <p className="text-xs text-gray-500">トークン数</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-2xl font-bold text-emerald-600">${(config.apiUsage?.estimatedCost || 0).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">推定コスト</p>
                            </div>
                        </div>

                        {/* Cost Progress Bar */}
                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>月間コスト使用率</span>
                                <span>{((config.apiUsage?.estimatedCost || 0) / config.costLimit * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${((config.apiUsage?.estimatedCost || 0) / config.costLimit * 100) >= config.costAlertThreshold
                                            ? 'bg-red-500'
                                            : ((config.apiUsage?.estimatedCost || 0) / config.costLimit * 100) >= 50
                                                ? 'bg-yellow-500'
                                                : 'bg-emerald-500'
                                        }`}
                                    style={{ width: `${Math.min(100, (config.apiUsage?.estimatedCost || 0) / config.costLimit * 100)}%` }}
                                />
                            </div>
                            {((config.apiUsage?.estimatedCost || 0) / config.costLimit * 100) >= config.costAlertThreshold && (
                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                    ⚠️ コスト上限の{config.costAlertThreshold}%を超えています
                                </p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (confirm('使用量カウンターをリセットしますか？')) {
                                        handleChange('apiUsage', { ...DEFAULT_API_USAGE, lastReset: new Date().toISOString() });
                                    }
                                }}
                                className="px-4 py-2 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                            >
                                カウンターをリセット
                            </button>
                            <span className="text-xs text-gray-400 flex items-center">
                                最終リセット: {config.apiUsage?.lastReset ? new Date(config.apiUsage.lastReset).toLocaleDateString('ja-JP') : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* General Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    📋 一般設定
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">
                            セッションタイムアウト（分）
                        </label>
                        <input
                            type="number"
                            value={config.sessionTimeoutMinutes}
                            onChange={e => handleChange('sessionTimeoutMinutes', parseInt(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2"
                            min={5}
                            max={1440}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">
                            保護者あたり最大子供数
                        </label>
                        <input
                            type="number"
                            value={config.maxStudentsPerGuardian}
                            onChange={e => handleChange('maxStudentsPerGuardian', parseInt(e.target.value) || 0)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2"
                            min={1}
                            max={10}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    <div>
                        <p className="font-semibold text-gray-900">通知機能</p>
                        <p className="text-sm text-gray-500">ブラウザ通知の利用</p>
                    </div>
                    <button
                        onClick={() => handleChange('enableNotifications', !config.enableNotifications)}
                        className={`relative w-14 h-8 rounded-full transition ${config.enableNotifications ? 'bg-green-500' : 'bg-gray-200'
                            }`}
                    >
                        <span className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow transition ${config.enableNotifications ? 'translate-x-6' : ''
                            }`} />
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleReset}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                >
                    デフォルトに戻す
                </button>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className={`flex-1 py-3 rounded-xl font-semibold transition ${hasChanges
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {hasChanges ? '設定を保存' : '変更なし'}
                </button>
            </div>
        </div>
    );
};

export default SystemSettings;
