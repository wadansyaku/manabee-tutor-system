import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { GoogleGenAI } from '@anthropic-ai/sdk';

interface CharacterChatProps {
    currentUser: User;
    subject?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
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

export const CharacterChat: React.FC<CharacterChatProps> = ({ currentUser, subject }) => {
    const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCharacterSelect, setShowCharacterSelect] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Call Gemini API
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                throw new Error('Gemini API key not configured');
            }

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        { role: 'user', parts: [{ text: selectedCharacter.systemPrompt }] },
                        { role: 'model', parts: [{ text: 'わかりました！そのキャラクターとしてお答えします。' }] },
                        ...messages.map(m => ({
                            role: m.role === 'user' ? 'user' : 'model',
                            parts: [{ text: m.content }]
                        })),
                        { role: 'user', parts: [{ text: input }] }
                    ],
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
            // Fallback response
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

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
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

                {/* Character Select */}
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

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={`${selectedCharacter.name}に質問する...`}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isLoading || !input.trim()}
                        className={`px-6 py-3 rounded-xl font-medium transition-all ${isLoading || !input.trim()
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : `bg-gradient-to-r ${selectedCharacter.color} text-white hover:shadow-lg`
                            }`}
                    >
                        送信
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                    わからない問題や難しいことがあったら、何でも聞いてね！
                </p>
            </div>
        </div>
    );
};

export default CharacterChat;
