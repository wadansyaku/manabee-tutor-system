import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { StorageService } from '../services/storageService';

interface LoginScreenProps {
    onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
    const [step, setStep] = useState<'email' | 'password' | 'change_password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
    const [newPassword, setNewPassword] = useState('');
    const [tempUser, setTempUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check if Firebase mode is enabled
    const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';



    const handleEmailSubmit = async () => {
        if (!email) {
            setError('メールアドレスを入力してください');
            return;
        }
        setError(null);
        setIsLoading(true);

        await new Promise(r => setTimeout(r, 300));

        if (isFirebaseMode) {
            // Firebase mode: go directly to password step
            setStep('password');
        } else {
            // Local mode: check if user exists
            const res = StorageService.login(email);
            if (!res.success && res.error === 'ユーザーが見つかりません') {
                setError('ユーザーが見つかりません');
                setIsLoading(false);
                return;
            }

            const check = StorageService.login(email, '');
            if (check.success) {
                onLoginSuccess(check.user!);
            } else if (check.error === 'パスワードを入力してください') {
                setStep('password');
            } else {
                setError(check.error || 'ログインエラー');
            }
        }
        setIsLoading(false);
    };

    const handlePasswordSubmit = async () => {
        if (!password) {
            setError('パスワードを入力してください');
            return;
        }
        setError(null);
        setIsLoading(true);

        await new Promise(r => setTimeout(r, 300));

        if (isFirebaseMode) {
            // Firebase Auth login
            try {
                const { firebaseLogin } = await import('../services/firebaseService');
                const res = await firebaseLogin(email, password);
                if (res.success && res.user) {
                    onLoginSuccess(res.user);
                } else {
                    setError(res.error || '認証に失敗しました');
                }
            } catch (err: any) {
                setError(err.message || 'Firebase認証エラー');
            }
        } else {
            // Local storage login
            const res = StorageService.login(email, password);
            if (res.success && res.user) {
                if (res.user.isInitialPassword) {
                    setTempUser(res.user);
                    setStep('change_password');
                } else {
                    onLoginSuccess(res.user);
                }
            } else {
                setError(res.error || '認証に失敗しました');
            }
        }
        setIsLoading(false);
    };

    const handleRegister = async () => {
        if (!email || !password || !name) {
            setError('全ての項目を入力してください');
            return;
        }
        if (password.length < 6) {
            setError('パスワードは6文字以上にしてください');
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            const { firebaseRegister } = await import('../services/firebaseService');
            const res = await firebaseRegister(email, password, name, selectedRole);
            if (res.success && res.user) {
                onLoginSuccess(res.user);
            } else {
                setError(res.error || '登録に失敗しました');
            }
        } catch (err: any) {
            setError(err.message || '登録エラー');
        }
        setIsLoading(false);
    };

    const handleResetPassword = async () => {
        if (!email) {
            setError('メールアドレスを入力してください');
            return;
        }
        setError(null);
        setIsLoading(true);

        try {
            const { firebaseResetPassword } = await import('../services/firebaseService');
            const res = await firebaseResetPassword(email);
            if (res.success) {
                setSuccess('パスワードリセットのメールを送信しました。メールをご確認ください。');
                setTimeout(() => {
                    setMode('login');
                    setSuccess(null);
                }, 3000);
            } else {
                setError(res.error || 'リセットに失敗しました');
            }
        } catch (err: any) {
            setError(err.message || 'リセットエラー');
        }
        setIsLoading(false);
    };



    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 4) {
            setError('パスワードは4文字以上にしてください');
            return;
        }
        setIsLoading(true);

        if (tempUser) {
            const success = StorageService.changePassword(tempUser.id, newPassword);
            if (success) {
                setStep('password');
                setPassword('');
                setNewPassword('');
                setTempUser(null);
                setError(null);
            } else {
                setError('パスワード変更に失敗しました');
            }
        }
        setIsLoading(false);
    };

    const quickLogin = (userEmail: string) => {
        setEmail(userEmail);
        setError(null);
    };

    const roleOptions = [
        { value: UserRole.STUDENT, label: '生徒', icon: '👦' },
        { value: UserRole.GUARDIAN, label: '保護者', icon: '👩' },
        { value: UserRole.TUTOR, label: '講師', icon: '👨‍🏫' },
    ];


    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
            </div>

            {/* Login Card */}
            <div className="relative bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 animate-fade-in">
                {/* Logo & Title */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl shadow-lg mb-4 transform hover:scale-105 transition-transform">
                        <span className="text-3xl">🐝</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Manabee</h1>
                    <p className="text-white/60 text-sm">自律学習を支援するプラットフォーム</p>
                </div>

                {/* Mode Tabs (Firebase mode only) */}
                {isFirebaseMode && mode !== 'reset' && (
                    <div className="flex bg-white/5 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => { setMode('login'); setStep('email'); setError(null); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            ログイン
                        </button>
                        <button
                            onClick={() => { setMode('register'); setError(null); }}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}
                        >
                            新規登録
                        </button>
                    </div>
                )}

                {/* Login Mode */}
                {mode === 'login' && (
                    <>
                        {/* Email Step */}
                        {step === 'email' && (
                            <div className="space-y-5 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">メールアドレス</label>
                                    <input
                                        type="email"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                                        disabled={isLoading}
                                    />
                                </div>
                                <button
                                    onClick={handleEmailSubmit}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            確認中...
                                        </>
                                    ) : '次へ →'}
                                </button>
                            </div>
                        )}

                        {/* Password Step */}
                        {step === 'password' && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {email[0]?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white/80 text-sm truncate">{email}</p>
                                    </div>
                                    <button onClick={() => setStep('email')} className="text-white/40 hover:text-white/80 text-xs">変更</button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">パスワード</label>
                                    <input
                                        type="password"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handlePasswordSubmit()}
                                        autoFocus
                                        disabled={isLoading}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    onClick={handlePasswordSubmit}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-4 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            ログイン中...
                                        </>
                                    ) : 'ログイン'}
                                </button>

                                {/* Forgot password link */}
                                {isFirebaseMode && (
                                    <button
                                        onClick={() => setMode('reset')}
                                        className="w-full text-white/50 hover:text-white/80 text-sm transition-colors"
                                    >
                                        パスワードを忘れた方はこちら
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Change Password Step */}
                        {step === 'change_password' && (
                            <div className="space-y-5 animate-fade-in">
                                <div className="bg-amber-500/20 border border-amber-400/30 p-4 rounded-xl text-amber-200 text-sm flex items-start gap-3">
                                    <span className="text-xl">🔐</span>
                                    <p>セキュリティのため、初回ログイン時はパスワードの変更が必要です。</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">新しいパスワード</label>
                                    <input
                                        type="password"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        autoFocus
                                        disabled={isLoading}
                                        placeholder="4文字以上"
                                    />
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? '処理中...' : 'パスワードを変更'}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Register Mode */}
                {mode === 'register' && (
                    <div className="space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">お名前</label>
                            <input
                                type="text"
                                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="山田 太郎"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">メールアドレス</label>
                            <input
                                type="email"
                                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">パスワード（6文字以上）</label>
                            <input
                                type="password"
                                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">ロール</label>
                            <div className="grid grid-cols-3 gap-2">
                                {roleOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedRole(opt.value)}
                                        className={`p-3 rounded-xl border text-center transition-all ${selectedRole === opt.value ? 'bg-purple-500/30 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'}`}
                                    >
                                        <span className="text-xl block mb-1">{opt.icon}</span>
                                        <span className="text-xs">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleRegister}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-xl font-bold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? '登録中...' : '新規登録'}
                        </button>
                    </div>
                )}

                {/* Password Reset Mode */}
                {mode === 'reset' && (
                    <div className="space-y-5 animate-fade-in">
                        <div className="text-center mb-4">
                            <span className="text-4xl">🔑</span>
                            <h2 className="text-xl font-bold text-white mt-2">パスワードリセット</h2>
                            <p className="text-white/60 text-sm mt-1">登録メールアドレスにリセットリンクを送信します</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-white/80 mb-2">メールアドレス</label>
                            <input
                                type="email"
                                className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all outline-none"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            onClick={handleResetPassword}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? '送信中...' : 'リセットリンクを送信'}
                        </button>
                        <button
                            onClick={() => { setMode('login'); setStep('email'); }}
                            className="w-full text-white/50 hover:text-white/80 text-sm transition-colors"
                        >
                            ← ログインに戻る
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-4 bg-red-500/20 border border-red-400/30 p-4 rounded-xl text-red-200 text-sm flex items-center gap-3 animate-shake">
                        <span className="text-xl">⚠️</span>
                        <p>{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mt-4 bg-green-500/20 border border-green-400/30 p-4 rounded-xl text-green-200 text-sm flex items-center gap-3">
                        <span className="text-xl">✅</span>
                        <p>{success}</p>
                    </div>
                )}



                {/* Quick Login Buttons (Local mode) */}
                {!isFirebaseMode && (
                    <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-white/40 text-xs mb-3 text-center">開発用クイックログイン</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => quickLogin('tutor@manabee.com')}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-white/70 hover:text-white text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">👨‍🏫</span> 講師
                            </button>
                            <button
                                onClick={() => quickLogin('student@manabee.com')}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-white/70 hover:text-white text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">👦</span> 生徒
                            </button>
                            <button
                                onClick={() => quickLogin('mom@manabee.com')}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-white/70 hover:text-white text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">👩</span> 保護者
                            </button>
                            <button
                                onClick={() => quickLogin('admin@manabee.com')}
                                className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-xl text-white/70 hover:text-white text-xs transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">⚙️</span> 管理者
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
