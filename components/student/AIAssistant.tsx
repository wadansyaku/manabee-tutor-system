import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, UserRole, QuestionJob } from '../../types';
import { StorageService, DateUtils } from '../../services/storageService';
import { uploadQuestionPhoto, compressImage } from '../../services/photoStorageService';
import { GamificationService } from '../../services/gamificationService';
import { XPGainAnimation } from './XPGainAnimation';

interface AIAssistantProps {
    currentUser: User;
    questions?: QuestionJob[];
    onUpdate?: () => void;
}

type ViewMode = 'chat' | 'photo';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    imageUrl?: string;
}

interface Character {
    id: string;
    name: string;
    avatar: string;
    personality: string;
    systemPrompt: string;
    color: string;
}

const CHARACTERS: Character[] = [
    {
        id: 'mana',
        name: 'マナビー',
        avatar: '🐝',
        personality: '明るくて親切',
        systemPrompt: `あなたは「マナビー」という名前の勉強のサポートキャラクターです。
蜂のような明るく元気なキャラクターで、小中学生の学習をサポートします。

ルール:
- 常にやさしく、励ましながら教えてください
- 難しい概念は簡単な例えを使って説明してください
- 絵文字を適度に使って親しみやすく
- 間違いを指摘するときも前向きに
- 長すぎない回答を心がけて（3-4文程度）`,
        color: 'from-amber-400 to-yellow-500',
    },
    {
        id: 'doctor',
        name: 'はかせ',
        avatar: '🧑‍🔬',
        personality: '知識豊富で丁寧',
        systemPrompt: `あなたは「はかせ」という名前の博士キャラクターです。
科学や算数が得意で、論理的に説明するのが上手です。

ルール:
- 論理的でわかりやすい説明を心がける
- 「なぜそうなるのか」を重視
- 好奇心を刺激する質問を返すこともある
- 「じゃあ、○○の場合はどうなるかな？」のように考えさせる`,
        color: 'from-blue-500 to-indigo-600',
    },
    {
        id: 'friend',
        name: 'ともちゃん',
        avatar: '👧',
        personality: '同世代の友達感覚',
        systemPrompt: `あなたは「ともちゃん」という小学6年生の女の子キャラクターです。
同級生の友達として一緒に勉強を考えます。

ルール:
- 「わたしも最初わからなかったんだけど〜」のように共感する
- 一緒に考える姿勢
- カジュアルな言葉遣い
- 「〜だよね！」「〜じゃない？」のような話し方`,
        color: 'from-pink-400 to-rose-500',
    },
];

const getStatusLabel = (status: string): string => {
    switch (status) {
        case 'queued': return 'AI解析待ち';
        case 'processing': return 'AI処理中';
        case 'needs_review': return '先生確認待ち';
        case 'done': return '回答済み';
        case 'error': return 'エラー';
        default: return status;
    }
};

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'queued': return 'bg-blue-100 text-blue-700';
        case 'processing': return 'bg-yellow-100 text-yellow-700';
        case 'needs_review': return 'bg-orange-100 text-orange-700';
        case 'done': return 'bg-green-100 text-green-700';
        case 'error': return 'bg-red-100 text-red-700';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ currentUser, questions = [], onUpdate }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('chat');
    const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCharacterSelect, setShowCharacterSelect] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Photo submission state
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>('');
    const [newQuestionSubject, setNewQuestionSubject] = useState('算数');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // XP Animation state
    const [xpAnimation, setXpAnimation] = useState<{
        show: boolean;
        xpAmount: number;
        isLevelUp: boolean;
        message: string;
    }>({ show: false, xpAmount: 0, isLevelUp: false, message: '' });

    // Daily limit for photo questions
    const todayQuestions = questions.filter(q => {
        const qDate = new Date(q.createdAt);
        const now = new Date();
        return q.studentId === currentUser.id &&
            qDate.getDate() === now.getDate() &&
            qDate.getMonth() === now.getMonth() &&
            qDate.getFullYear() === now.getFullYear();
    });
    const dailyLimit = 3;
    const remainingLimit = Math.max(0, dailyLimit - todayQuestions.length);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial greeting when character is selected
    useEffect(() => {
        if (messages.length === 0) {
            const greeting = getGreeting(selectedCharacter);
            setMessages([{
                id: Date.now().toString(),
                role: 'assistant',
                content: greeting,
                timestamp: new Date(),
            }]);
        }
    }, [selectedCharacter]);

    const getGreeting = (char: Character): string => {
        switch (char.id) {
            case 'mana':
                return `こんにちは！🐝 マナビーだよ！今日は何を勉強する？わからないことがあったら何でも聞いてね！`;
            case 'doctor':
                return `やあ、はかせだよ。今日は何を探求しようか？質問があれば丁寧に説明するよ。`;
            case 'friend':
                return `あ、${currentUser.name}！勉強してるの？わたしも一緒に考えようよ〜！何がわからないの？`;
            default:
                return 'こんにちは！何でも聞いてね！';
        }
    };

    const handleChatFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const sendChatMessage = async () => {
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
            imageUrl: selectedImage || undefined,
        };

        if (selectedImage && !input) {
            userMessage.content = '(画像を送信しました)';
        }

        setMessages(prev => [...prev, userMessage]);
        const currentImage = selectedImage;
        const currentInput = input;

        setInput('');
        setSelectedImage(null);
        setIsLoading(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            const apiContents = [
                { role: 'user', parts: [{ text: selectedCharacter.systemPrompt }] },
                { role: 'model', parts: [{ text: 'わかりました！そのキャラクターとしてお答えします。' }] },
                ...messages.map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }))
            ];

            const newParts: any[] = [];
            if (currentInput) {
                newParts.push({ text: currentInput });
            }
            if (currentImage) {
                const base64Data = currentImage.split(',')[1];
                const mimeType = currentImage.split(';')[0].split(':')[1];
                newParts.push({
                    inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                    }
                });
            }

            apiContents.push({ role: 'user', parts: newParts });

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: apiContents,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                    }
                })
            });

            const data = await response.json();
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'ごめんね、うまく答えられなかったよ。もう一度聞いてみてね！';

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const fallbackMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `${selectedCharacter.avatar} ごめんね、今ちょっと調子が悪いみたい...もう一度聞いてみてくれる？`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, fallbackMessage]);
        }

        setIsLoading(false);
    };

    const changeCharacter = (char: Character) => {
        setSelectedCharacter(char);
        setMessages([{
            id: Date.now().toString(),
            role: 'assistant',
            content: getGreeting(char),
            timestamp: new Date(),
        }]);
        setShowCharacterSelect(false);
    };

    // Photo upload handler
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (remainingLimit <= 0 && currentUser.role === UserRole.STUDENT) {
            alert('本日の質問回数（3回）を超えています。また明日頑張りましょう！');
            return;
        }

        setIsUploading(true);
        setUploadProgress('画像を処理中...');

        try {
            let fileToUpload: File | Blob = file;
            if (file.size > 1024 * 1024) {
                setUploadProgress('画像を圧縮中...');
                fileToUpload = await compressImage(file, 1200, 0.8);
            }

            const questionId = StorageService.generateId();

            setUploadProgress('アップロード中...');
            const imageUrl = await uploadQuestionPhoto(
                fileToUpload instanceof File ? fileToUpload : new File([fileToUpload], file.name, { type: 'image/jpeg' }),
                currentUser.id,
                questionId
            );

            const newJob: QuestionJob = {
                id: questionId,
                studentId: currentUser.id,
                subject: newQuestionSubject,
                createdAt: new Date().toISOString(),
                questionImageUrl: imageUrl,
                status: 'queued',
            };

            StorageService.saveQuestion(newJob);
            StorageService.addLog(currentUser, 'question_upload', `${newQuestionSubject}の質問をアップロードしました`);

            // Award XP
            if (currentUser.role === UserRole.STUDENT) {
                try {
                    const result = await GamificationService.onQuestionSubmit(currentUser.id);
                    if (result.success && result.xpGained > 0) {
                        setXpAnimation({
                            show: true,
                            xpAmount: result.xpGained,
                            isLevelUp: result.leveledUp,
                            message: `質問送信完了！ +${result.xpGained}XP`
                        });
                    }
                } catch (err) {
                    console.error('[Gamification] Failed to award XP:', err);
                }
            }

            setUploadProgress('完了！');
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress('');
                onUpdate?.();
            }, 500);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('アップロードに失敗しました。もう一度お試しください。');
            setIsUploading(false);
            setUploadProgress('');
        }
    };

    // Recent questions
    const myQuestions = useMemo(() =>
        questions.filter(q => q.studentId === currentUser.id)
            .slice(0, 5)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [questions, currentUser.id]
    );

    return (
        <>
            {/* XP Gain Animation */}
            <XPGainAnimation
                xpAmount={xpAnimation.xpAmount}
                isVisible={xpAnimation.show}
                isLevelUp={xpAnimation.isLevelUp}
                message={xpAnimation.message}
                onComplete={() => setXpAnimation(prev => ({ ...prev, show: false }))}
            />

            <div className="space-y-4 max-w-4xl mx-auto pb-20">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            ✨ AIアシスタント
                        </h1>
                        <p className="text-sm text-gray-500">チャットや写真でわからない問題を質問しよう</p>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="bg-white p-1.5 rounded-2xl border border-gray-200 flex shadow-sm">
                    <button
                        onClick={() => setViewMode('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'chat'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        💬 チャットで質問
                    </button>
                    <button
                        onClick={() => setViewMode('photo')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${viewMode === 'photo'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        📸 写真で質問
                    </button>
                </div>

                {/* Chat View */}
                {viewMode === 'chat' && (
                    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
                        {/* Chat Header */}
                        <div className={`bg-gradient-to-r ${selectedCharacter.color} p-4 text-white`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-3xl">
                                        {selectedCharacter.avatar}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{selectedCharacter.name}</h3>
                                        <p className="text-sm opacity-80">{selectedCharacter.personality}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCharacterSelect(!showCharacterSelect)}
                                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                                >
                                    キャラ変更
                                </button>
                            </div>

                            {showCharacterSelect && (
                                <div className="mt-4 grid grid-cols-3 gap-2">
                                    {CHARACTERS.map(char => (
                                        <button
                                            key={char.id}
                                            onClick={() => changeCharacter(char)}
                                            className={`p-3 rounded-xl text-center transition-all ${selectedCharacter.id === char.id
                                                    ? 'bg-white text-gray-800'
                                                    : 'bg-white/20 hover:bg-white/30'
                                                }`}
                                        >
                                            <span className="text-2xl block mb-1">{char.avatar}</span>
                                            <span className="text-xs font-medium">{char.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map(message => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-lg mr-2 flex-shrink-0">
                                            {selectedCharacter.avatar}
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[75%] px-4 py-3 rounded-2xl ${message.role === 'user'
                                                ? 'bg-blue-500 text-white rounded-br-sm'
                                                : 'bg-white shadow-sm border border-gray-100 rounded-bl-sm'
                                            }`}
                                    >
                                        {message.imageUrl && (
                                            <img
                                                src={message.imageUrl}
                                                alt="Uploaded"
                                                className="max-h-40 rounded-lg mb-2"
                                            />
                                        )}
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center text-lg mr-2">
                                        {selectedCharacter.avatar}
                                    </div>
                                    <div className="bg-white shadow-sm border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            {selectedImage && (
                                <div className="mb-2 relative inline-block">
                                    <img
                                        src={selectedImage}
                                        alt="Preview"
                                        className="h-20 rounded-lg border border-gray-200 object-cover"
                                    />
                                    <button
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleChatFileSelect}
                                />
                                <button
                                    className="p-3 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                                    title="画像をアップロード"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    📷
                                </button>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
                                    placeholder={`${selectedCharacter.name}に質問する...`}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={sendChatMessage}
                                    disabled={isLoading || (!input.trim() && !selectedImage)}
                                    className={`px-6 py-3 rounded-xl font-medium transition-all ${isLoading || (!input.trim() && !selectedImage)
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : `bg-gradient-to-r ${selectedCharacter.color} text-white hover:shadow-lg`
                                        }`}
                                >
                                    送信
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo View */}
                {viewMode === 'photo' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Upload Area */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">📸 写真で質問</h3>
                                    {currentUser.role === UserRole.STUDENT && (
                                        <p className="text-sm text-gray-500 mt-1">
                                            今日あと <span className="font-bold text-indigo-600 text-lg">{remainingLimit}</span> 回 質問できます
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Subject Selector */}
                            <div className="flex gap-2 mb-4">
                                {['算数', '国語', '理科', '社会', '英語'].map(sub => (
                                    <button
                                        key={sub}
                                        onClick={() => setNewQuestionSubject(sub)}
                                        className={`px-4 py-2 text-sm rounded-full border transition-all ${newQuestionSubject === sub
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                                            }`}
                                    >
                                        {sub}
                                    </button>
                                ))}
                            </div>

                            {/* Upload Button */}
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    ref={photoInputRef}
                                    onChange={handlePhotoUpload}
                                    disabled={remainingLimit <= 0 || isUploading}
                                />
                                <button
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={isUploading || remainingLimit <= 0}
                                    className={`w-full flex flex-col items-center gap-3 ${isUploading ? 'cursor-wait' : remainingLimit <= 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                        }`}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">
                                                <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                            </div>
                                            <span className="text-indigo-600 font-medium">{uploadProgress}</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl shadow-lg">
                                                📷
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-bold">タップして写真を撮影</p>
                                                <p className="text-sm text-gray-500">またはギャラリーから選択</p>
                                            </div>
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs text-gray-400 mt-3 text-center">
                                わからない問題を撮影すると、AIが解析して先生に共有されます
                            </p>
                        </div>

                        {/* Recent Questions */}
                        {myQuestions.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <h3 className="font-bold text-lg text-gray-900 mb-4">📋 最近の質問</h3>
                                <div className="space-y-3">
                                    {myQuestions.map(q => (
                                        <div key={q.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                                            <img
                                                src={q.questionImageUrl}
                                                alt="Question"
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-gray-900">{q.subject}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(q.status)}`}>
                                                        {getStatusLabel(q.status)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {DateUtils.formatDate(q.createdAt)}
                                                </p>
                                                {q.aiExplanation && (
                                                    <p className="text-xs text-indigo-600 mt-1 truncate">
                                                        AI: {q.aiExplanation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default AIAssistant;
