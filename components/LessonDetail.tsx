import React, { useState, useEffect } from 'react';
import { Lesson, User, UserRole, ReflectionInputs, CharacterReflection } from '../types';
import { generateLessonContent, isAIAvailable } from '../services/geminiService';
import { INITIAL_STUDENT_CONTEXT } from '../constants';
import { getHomeworkMeta } from '../services/homeworkUtils';
import { MicrophoneIcon, SparklesIcon, CheckCircleIcon } from './icons';
import { QuizCard } from './QuizCard';

interface LessonDetailProps {
  lesson: Lesson;
  currentUser: User;
  onUpdateLesson: (updated: Lesson) => void;
  onAudit: (action: string, summary: string) => void;
}

export const LessonDetail: React.FC<LessonDetailProps> = ({ lesson, currentUser, onUpdateLesson, onAudit }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState(lesson.transcript);

  // Reflection State
  const [reflectionInputs, setReflectionInputs] = useState<ReflectionInputs>({
    mood: 'neutral',
    understanding: 'good',
    comment: ''
  });

  // Permissions
  const isStudentView = currentUser.role === UserRole.STUDENT;
  const canEditLessonContent = currentUser.role === UserRole.TUTOR;
  const canCheckHomework = currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.TUTOR;

  const handleGenerateAI = async () => {
    if (!transcript) return;
    setIsProcessing(true);
    setError(null);
    try {
      const contextStr = `Name: ${INITIAL_STUDENT_CONTEXT.name}, Target: ${INITIAL_STUDENT_CONTEXT.targetSchool}, Notes: ${INITIAL_STUDENT_CONTEXT.notes}`;
      const { summary, homework, quiz } = await generateLessonContent(transcript, contextStr);
      onUpdateLesson({ ...lesson, transcript, aiSummary: summary, aiHomework: homework, aiQuiz: quiz });
      onAudit('ai_content_generated', 'AI要約・宿題・クイズを生成しました');
    } catch (err: any) {
      setError("AI生成に失敗しました: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHomeworkToggle = (idx: number) => {
    if (!lesson.aiHomework || !canCheckHomework) return;
    const newItems = [...lesson.aiHomework.items];
    newItems[idx].isCompleted = !newItems[idx].isCompleted;
    onUpdateLesson({ ...lesson, aiHomework: { items: newItems } });
  };

  const submitReflection = () => {
    // Template generation logic (No AI for P0)
    const moodMap = { happy: '楽しかった', neutral: '普通', tired: '疲れた' };
    const undMap = { perfect: 'バッチリ', good: 'だいたいOK', hard: '難しかった' };

    const summary = `生徒振り返り: 気分は「${moodMap[reflectionInputs.mood]}」、理解度は「${undMap[reflectionInputs.understanding]}」。コメント：「${reflectionInputs.comment}」`;

    const reflection: CharacterReflection = {
      characterId: 'cat_sensei',
      inputs: reflectionInputs,
      summaryForTutor: summary,
      updatedAt: new Date().toISOString(),
      isSubmitted: true
    };

    onUpdateLesson({ ...lesson, characterReflection: reflection });
    onAudit('reflection_submitted', '生徒が振り返りを提出しました');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">12月14日 (日) 定期授業</h1>
          <p className="text-gray-500 mt-1">16:00 - 18:00 (120分) • 算数・国語</p>
        </div>
        {currentUser.role !== UserRole.STUDENT && (
          <div className="text-right">
            <div className="text-sm text-gray-500">報酬目安</div>
            <div className="text-xl font-mono font-semibold">¥{((lesson.durationMinutes / 60) * lesson.hourlyRate).toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* --- Character Reflection Section --- */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="text-5xl shrink-0">🐱</div>
        <div className="flex-1 w-full">
          <h3 className="font-bold text-indigo-900 text-lg mb-2">学習振り返り</h3>

          {isStudentView ? (
            !lesson.characterReflection?.isSubmitted ? (
              <div className="space-y-4 bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">今の気分は？</label>
                  <div className="flex gap-4">
                    {['happy', 'neutral', 'tired'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setReflectionInputs(prev => ({ ...prev, mood: m as any }))}
                        className={`text-2xl p-2 rounded-full border-2 transition-all ${reflectionInputs.mood === m ? 'border-indigo-500 bg-indigo-50 scale-110' : 'border-transparent hover:bg-gray-50'}`}
                      >
                        {m === 'happy' ? '😄' : m === 'neutral' ? '😐' : '😫'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">今日の理解度は？</label>
                  <div className="flex gap-2">
                    {['perfect', 'good', 'hard'].map((u) => (
                      <button
                        key={u}
                        onClick={() => setReflectionInputs(prev => ({ ...prev, understanding: u as any }))}
                        className={`px-3 py-1.5 text-xs rounded border transition-all ${reflectionInputs.understanding === u ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                      >
                        {u === 'perfect' ? 'バッチリ' : u === 'good' ? 'だいたいOK' : '難しかった'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2">一言メモ (120文字以内)</label>
                  <textarea
                    className="w-full text-sm border-gray-300 rounded p-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={2}
                    maxLength={120}
                    placeholder="例：分数の計算で少し迷った"
                    value={reflectionInputs.comment}
                    onChange={(e) => setReflectionInputs(prev => ({ ...prev, comment: e.target.value }))}
                  />
                </div>
                <button
                  onClick={submitReflection}
                  className="w-full bg-indigo-600 text-white py-2 rounded font-bold text-sm hover:bg-indigo-700 transition"
                >
                  完了する
                </button>
              </div>
            ) : (
              <div className="text-indigo-800 bg-white/50 p-4 rounded-lg border border-indigo-100">
                <p className="font-bold text-sm">振り返り提出済み 🎉</p>
                <p className="text-xs mt-1">お疲れ様でした！次回も頑張ろう。</p>
              </div>
            )
          ) : (
            // Tutor / Guardian View
            <div className="bg-white/80 p-4 rounded-lg border border-indigo-100 text-sm text-indigo-900">
              {lesson.characterReflection ? (
                <>
                  <p className="font-bold mb-1">生徒の振り返り要約:</p>
                  <p className="mb-2">{lesson.characterReflection.summaryForTutor}</p>
                  <div className="text-xs text-indigo-500 border-t border-indigo-100 pt-2 mt-2">
                    入力詳細: {lesson.characterReflection.inputs.comment || '(コメントなし)'}
                    (気分:{lesson.characterReflection.inputs.mood})
                  </div>
                </>
              ) : (
                <p className="text-gray-500 italic">まだ振り返りは提出されていません。</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audio & Transcript */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <MicrophoneIcon className="w-5 h-5 text-indigo-500" />
            音声と文字起こし
          </h2>
          {canEditLessonContent && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">講師専用</span>
          )}
        </div>
        <div className="p-6">
          <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6 transition-colors ${canEditLessonContent ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
            <p className="text-gray-600 text-sm">音声ファイルをドラッグ＆ドロップ</p>
            <p className="text-gray-400 text-xs mt-2">MP3, M4A, WAV (Max 100MB)</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">文字起こし結果</label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={!canEditLessonContent}
              className="w-full h-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm leading-relaxed p-3 border disabled:bg-gray-100"
            />
          </div>

          {canEditLessonContent && (
            <div className="space-y-2">
              <button
                onClick={handleGenerateAI}
                disabled={isProcessing || !isAIAvailable()}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
              >
                {isProcessing ? (
                  <>AI分析中...</>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    AI要約・宿題・クイズを生成
                  </>
                )}
              </button>
              {!isAIAvailable() && (
                <p className="text-xs text-gray-500 text-center">
                  ※ AI機能を使用するには、.envにGEMINI_API_KEYを設定してください
                </p>
              )}
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>

      {/* AI Summary */}
      {lesson.aiSummary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">📝</span> 授業要約
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">今回の目標</h4>
                <p className="bg-blue-50 text-blue-900 p-3 rounded-md text-sm">{lesson.aiSummary.lesson_goal}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">実施内容</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {lesson.aiSummary.what_we_did.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-green-600 uppercase tracking-wider mb-2">良かった点</h4>
                <ul className="space-y-1">
                  {lesson.aiSummary.what_went_well.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" checked />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-orange-600 uppercase tracking-wider mb-2">課題・つまずき</h4>
                <ul className="space-y-1">
                  {lesson.aiSummary.issues.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-orange-500 font-bold">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">保護者様へのメッセージ</h4>
              <p className="text-gray-700 text-sm italic border-l-4 border-indigo-200 pl-4 py-1">
                {lesson.aiSummary.parent_message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Homework */}
      {lesson.aiHomework && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
            <h2 className="font-bold text-orange-900 flex items-center gap-2">
              🏠 宿題
            </h2>
            <span className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
              {canCheckHomework ? "チェック可" : "閲覧のみ"}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {lesson.aiHomework.items.map((hw, idx) => {
              const due = getHomeworkMeta(lesson.scheduledAt, hw);
              return (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={hw.isCompleted}
                      onChange={() => handleHomeworkToggle(idx)}
                      disabled={!canCheckHomework}
                      className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <div>
                      <p className={`font-medium ${hw.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{hw.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{hw.type}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">約{hw.estimated_minutes}分</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${due.daysRemaining < 0 ? 'text-red-600' : 'text-orange-600'}`}>{due.remainingLabel}</p>
                    <p className="text-xs text-gray-500">期限: {due.displayDate}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quiz */}
      {lesson.aiQuiz && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
            <h2 className="font-bold text-indigo-900 flex items-center gap-2">
              🧠 理解度チェッククイズ
            </h2>
          </div>
          <div className="p-6 bg-gray-50">
            <QuizCard quizData={lesson.aiQuiz} />
          </div>
        </div>
      )}
    </div>
  );
};
