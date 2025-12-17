import React, { useState, useRef } from 'react';
import { User } from '../../types';

interface LessonRecorderProps {
    currentUser: User;
    studentId?: string;
}

interface LessonRecording {
    id: string;
    date: string;
    duration: number;
    status: 'recording' | 'transcribing' | 'summarizing' | 'completed';
    audioUrl?: string;
    transcript?: string;
    summary?: string;
    highlights?: string[];
}

export const LessonRecorder: React.FC<LessonRecorderProps> = ({ currentUser, studentId }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState<LessonRecording[]>([
        {
            id: '1',
            date: '2025-12-17',
            duration: 5400, // 90 minutes
            status: 'completed',
            transcript: '今日は算数の割合について学習しました。まず、割合の基本的な概念について説明し、百分率への変換方法を練習しました。...',
            summary: '算数「割合」の学習。百分率への変換、割合を使った文章問題に取り組みました。計算の正確性は向上していますが、文章問題の読解に課題があります。',
            highlights: [
                '百分率の計算が正確にできるようになった',
                '文章問題の読解力を強化する必要あり',
                '宿題: 教科書P.45-48'
            ]
        }
    ]);
    const [currentRecording, setCurrentRecording] = useState<LessonRecording | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<number | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            const chunks: Blob[] = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                handleRecordingComplete(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            const newRecording: LessonRecording = {
                id: Date.now().toString(),
                date: new Date().toISOString().split('T')[0],
                duration: 0,
                status: 'recording',
            };
            setCurrentRecording(newRecording);

            // Start timer
            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
            alert('マイクへのアクセスが許可されていません');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const handleRecordingComplete = async (audioUrl: string) => {
        if (!currentRecording) return;

        // Update to transcribing status
        setCurrentRecording({ ...currentRecording, status: 'transcribing', audioUrl, duration: recordingTime });

        // Simulate transcription (in real app, use Whisper API or similar)
        await new Promise(r => setTimeout(r, 2000));

        const mockTranscript = `本日の授業では、${new Date().toLocaleDateString('ja-JP')}に${recordingTime}秒間の授業を行いました。
内容は算数の基礎練習と復習を中心に進めました。生徒は集中して取り組んでいました。`;

        setCurrentRecording(prev => prev ? { ...prev, status: 'summarizing', transcript: mockTranscript } : null);

        // Simulate summarization with Gemini
        await new Promise(r => setTimeout(r, 1500));

        const completed: LessonRecording = {
            ...currentRecording,
            audioUrl,
            duration: recordingTime,
            status: 'completed',
            transcript: mockTranscript,
            summary: '算数の基礎練習と復習。生徒の理解度は良好。継続的な練習が効果を発揮している。',
            highlights: [
                '計算スピードが向上',
                '理解度チェックで正答率85%',
                '次回は応用問題に挑戦予定'
            ]
        };

        setRecordings([completed, ...recordings]);
        setCurrentRecording(null);
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${m}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        🎤
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">授業録音・文字起こし</h2>
                        <p className="text-sm text-gray-500">授業を録音してAIで要約</p>
                    </div>
                </div>
            </div>

            {/* Recording Control */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="text-center">
                    {!isRecording && !currentRecording ? (
                        <>
                            <button
                                onClick={startRecording}
                                className="w-24 h-24 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center text-white text-4xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all mx-auto"
                            >
                                🎙️
                            </button>
                            <p className="mt-4 text-gray-500">クリックして授業の録音を開始</p>
                        </>
                    ) : isRecording ? (
                        <>
                            <button
                                onClick={stopRecording}
                                className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-4xl shadow-xl hover:shadow-2xl animate-pulse mx-auto"
                            >
                                ⏹️
                            </button>
                            <div className="mt-4">
                                <p className="text-3xl font-mono font-bold text-red-600">{formatTime(recordingTime)}</p>
                                <p className="text-red-500 flex items-center justify-center gap-2 mt-2">
                                    <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                                    録音中...
                                </p>
                            </div>
                        </>
                    ) : currentRecording?.status === 'transcribing' ? (
                        <div className="py-8">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-blue-600 font-medium">文字起こし中...</p>
                        </div>
                    ) : currentRecording?.status === 'summarizing' ? (
                        <div className="py-8">
                            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-purple-600 font-medium">AIで要約生成中...</p>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Recording List */}
            <div className="space-y-4">
                <h3 className="font-bold text-gray-900">📚 過去の録音</h3>
                {recordings.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500">
                        録音がありません。授業を録音すると、ここに表示されます。
                    </div>
                ) : (
                    recordings.map(rec => (
                        <div key={rec.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl">
                                    📝
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-gray-900">{rec.date} の授業</h4>
                                        <span className="text-sm text-gray-500">{formatTime(rec.duration)}</span>
                                    </div>

                                    {rec.summary && (
                                        <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                                            <p className="text-sm font-medium text-blue-800 mb-2">📋 AI要約</p>
                                            <p className="text-sm text-blue-700">{rec.summary}</p>
                                        </div>
                                    )}

                                    {rec.highlights && rec.highlights.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm font-medium text-gray-700 mb-2">✨ ハイライト</p>
                                            <ul className="space-y-1">
                                                {rec.highlights.map((h, i) => (
                                                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span className="text-green-500">•</span>
                                                        {h}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {rec.transcript && (
                                        <details className="mt-3">
                                            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                                文字起こし全文を表示
                                            </summary>
                                            <div className="mt-2 p-4 bg-gray-50 rounded-lg text-sm text-gray-600 max-h-40 overflow-y-auto">
                                                {rec.transcript}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LessonRecorder;
