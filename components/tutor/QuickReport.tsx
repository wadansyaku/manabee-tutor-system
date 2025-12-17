// Quick Report Component for Tutors
// Enables fast, template-based lesson reporting for guardians
import React, { useState, useMemo } from 'react';
import { User, Lesson } from '../../types';

interface QuickReportProps {
    currentUser: User;
    studentId?: string;
    lessonId?: string;
    onSend?: (report: ReportData) => void;
}

interface ReportData {
    studentId: string;
    lessonId: string;
    template: string;
    content: string;
    mood: 'excellent' | 'good' | 'needs_focus';
    highlights: string[];
    improvements: string[];
    nextGoals: string[];
    sendToGuardian: boolean;
}

interface Template {
    id: string;
    name: string;
    icon: string;
    description: string;
    baseContent: string;
}

const TEMPLATES: Template[] = [
    {
        id: 'standard',
        name: '標準レポート',
        icon: '📝',
        description: '基本的な授業報告',
        baseContent: '本日の授業お疲れ様でした。\n\n【学習内容】\n- \n\n【よかった点】\n- \n\n【次回の課題】\n- ',
    },
    {
        id: 'progress',
        name: '進捗報告',
        icon: '📊',
        description: '目標に対する進捗を報告',
        baseContent: '【今週の進捗状況】\n\n目標達成度: \n\n【取り組んだ内容】\n- \n\n【来週の目標】\n- ',
    },
    {
        id: 'praise',
        name: '褒めレポート',
        icon: '🌟',
        description: '頑張りを特に褒めたい時',
        baseContent: '🌟 素晴らしい成果のご報告 🌟\n\n今日、お子様は特に素晴らしい取り組みを見せてくれました！\n\n【特筆すべき点】\n- \n\n【成長が見られた点】\n- ',
    },
    {
        id: 'concern',
        name: '相談レポート',
        icon: '💬',
        description: '保護者と相談したい事項がある時',
        baseContent: '【ご相談事項】\n\n最近の授業で気になる点がございましたのでご報告いたします。\n\n【現状】\n- \n\n【ご検討いただきたいこと】\n- \n\nお時間のある時にご連絡いただけますと幸いです。',
    },
];

const MOOD_OPTIONS = [
    { value: 'excellent' as const, label: '絶好調', icon: '🌟', color: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
    { value: 'good' as const, label: '順調', icon: '😊', color: 'bg-blue-100 border-blue-300 text-blue-700' },
    { value: 'needs_focus' as const, label: '要集中', icon: '🎯', color: 'bg-amber-100 border-amber-300 text-amber-700' },
];

const QUICK_HIGHLIGHTS = ['集中力があった', '理解が早かった', '積極的に質問した', '宿題を完璧にこなした', '難しい問題に粘り強く取り組んだ'];
const QUICK_IMPROVEMENTS = ['ケアレスミスに注意', '公式の確認が必要', '計算スピードの向上', '読解力の強化', '復習の徹底'];
const QUICK_GOALS = ['次回の小テストで80点以上', '苦手分野の克服', '計算問題の速度アップ', '応用問題にチャレンジ'];

export const QuickReport: React.FC<QuickReportProps> = ({
    currentUser,
    studentId = 's1',
    lessonId = 'l1',
    onSend,
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('standard');
    const [content, setContent] = useState('');
    const [mood, setMood] = useState<'excellent' | 'good' | 'needs_focus'>('good');
    const [highlights, setHighlights] = useState<string[]>([]);
    const [improvements, setImprovements] = useState<string[]>([]);
    const [nextGoals, setNextGoals] = useState<string[]>([]);
    const [sendToGuardian, setSendToGuardian] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const currentTemplate = useMemo(
        () => TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0],
        [selectedTemplate]
    );

    const handleTemplateSelect = (templateId: string) => {
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setContent(template.baseContent);
        }
    };

    const toggleItem = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const handleSend = async () => {
        setIsSending(true);

        const report: ReportData = {
            studentId,
            lessonId,
            template: selectedTemplate,
            content,
            mood,
            highlights,
            improvements,
            nextGoals,
            sendToGuardian,
        };

        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1000));

        onSend?.(report);
        setIsSending(false);
        setShowSuccess(true);

        setTimeout(() => setShowSuccess(false), 3000);
    };

    const isValid = content.trim().length > 10;

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                        📋
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">クイックレポート</h3>
                        <p className="text-blue-100 text-sm">テンプレートで簡単に授業報告</p>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Template Selection */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">テンプレート選択</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                onClick={() => handleTemplateSelect(template.id)}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${selectedTemplate === template.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-2xl block mb-1">{template.icon}</span>
                                <p className="font-medium text-sm text-gray-900">{template.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mood Selection */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">今日の調子</h4>
                    <div className="flex gap-3">
                        {MOOD_OPTIONS.map(option => (
                            <button
                                key={option.value}
                                onClick={() => setMood(option.value)}
                                className={`flex-1 p-3 rounded-xl border-2 transition-all ${mood === option.value
                                        ? option.color + ' border-current'
                                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                    }`}
                            >
                                <span className="text-2xl block mb-1">{option.icon}</span>
                                <span className="text-sm font-medium">{option.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Tags */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Highlights */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">✨ よかった点</h4>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_HIGHLIGHTS.map(item => (
                                <button
                                    key={item}
                                    onClick={() => toggleItem(item, highlights, setHighlights)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${highlights.includes(item)
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Improvements */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">📝 改善点</h4>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_IMPROVEMENTS.map(item => (
                                <button
                                    key={item}
                                    onClick={() => toggleItem(item, improvements, setImprovements)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${improvements.includes(item)
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Next Goals */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 次回目標</h4>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_GOALS.map(item => (
                                <button
                                    key={item}
                                    onClick={() => toggleItem(item, nextGoals, setNextGoals)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${nextGoals.includes(item)
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Editor */}
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">詳細コメント</h4>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="授業の詳細を記入..."
                        className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <p className="text-xs text-gray-400 mt-1">{content.length} 文字</p>
                </div>

                {/* Send Options */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={sendToGuardian}
                            onChange={(e) => setSendToGuardian(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">保護者にメールで送信</span>
                    </label>

                    <button
                        onClick={handleSend}
                        disabled={!isValid || isSending}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${isValid && !isSending
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isSending ? (
                            <>
                                <span className="animate-spin">⏳</span>
                                送信中...
                            </>
                        ) : (
                            <>
                                <span>📤</span>
                                レポート送信
                            </>
                        )}
                    </button>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div className="fixed bottom-24 right-4 md:bottom-8 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-slide-up">
                        <span className="text-xl">✅</span>
                        <span className="font-medium">レポートを送信しました！</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickReport;
