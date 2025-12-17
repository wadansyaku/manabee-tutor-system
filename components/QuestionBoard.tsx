import React, { useState, useMemo } from 'react';
import { QuestionJob, User, UserRole } from '../types';
import { StorageService, DateUtils } from '../services/storageService';
import { uploadQuestionPhoto, compressImage } from '../services/photoStorageService';
import { GamificationService } from '../services/gamificationService';
import { CheckCircleIcon, MicrophoneIcon } from './icons';
import { XPGainAnimation } from './student/XPGainAnimation';

interface QuestionBoardProps {
  currentUser: User;
  questions: QuestionJob[];
  onUpdate: () => void;
}

type StatusFilter = 'all' | 'pending' | 'done';

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

export const QuestionBoard: React.FC<QuestionBoardProps> = ({ currentUser, questions, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [newQuestionSubject, setNewQuestionSubject] = useState('算数');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // XP Animation state
  const [xpAnimation, setXpAnimation] = useState<{
    show: boolean;
    xpAmount: number;
    isLevelUp: boolean;
    message: string;
  }>({ show: false, xpAmount: 0, isLevelUp: false, message: '' });

  // Strict Limit: Student can only post 3 questions per day
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

  // Statistics for Tutor
  const pendingCount = useMemo(() =>
    questions.filter(q => q.status !== 'done').length,
    [questions]
  );
  const todayCount = useMemo(() =>
    questions.filter(q => {
      const qDate = new Date(q.createdAt);
      const now = new Date();
      return qDate.getDate() === now.getDate() &&
        qDate.getMonth() === now.getMonth() &&
        qDate.getFullYear() === now.getFullYear();
    }).length,
    [questions]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (remainingLimit <= 0 && currentUser.role === UserRole.STUDENT) {
      alert('本日の質問回数（3回）を超えています。また明日頑張りましょう！');
      return;
    }

    setIsUploading(true);
    setUploadProgress('画像を処理中...');

    try {
      // Compress image if it's large (over 1MB)
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

      // Award XP for submitting a question
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
        onUpdate();
      }, 500);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('アップロードに失敗しました。もう一度お試しください。');
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleTutorReview = (job: QuestionJob, comment: string) => {
    const updated: QuestionJob = {
      ...job,
      tutorComment: comment,
      status: 'done'
    };
    StorageService.saveQuestion(updated);
    StorageService.addLog(currentUser, 'question_reviewed', `質問ID:${job.id} に回答しました`);
    onUpdate();
  };

  // Filter View
  const viewableQuestions = useMemo(() => {
    const baseQuestions = currentUser.role === UserRole.TUTOR
      ? questions // Tutor sees all
      : questions.filter(q => q.studentId === currentUser.id); // Student/Guardian sees own

    if (statusFilter === 'pending') {
      return baseQuestions.filter(q => q.status !== 'done');
    } else if (statusFilter === 'done') {
      return baseQuestions.filter(q => q.status === 'done');
    }
    return baseQuestions;
  }, [questions, currentUser, statusFilter]);

  // Sort: pending first, then by date
  const sortedQuestions = useMemo(() =>
    [...viewableQuestions].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
    [viewableQuestions]
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

      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header Section */}
        {currentUser.role === UserRole.TUTOR ? (
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm opacity-80">講師ダッシュボード</p>
                <h1 className="text-2xl font-bold">質問レビュー</h1>
                <p className="opacity-80 text-sm mt-1">生徒からの質問を確認・回答します</p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold">{pendingCount}</p>
                <p className="text-sm opacity-80">件の未対応</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white/15 rounded-2xl p-4">
                <p className="text-xs opacity-80">今日の質問</p>
                <p className="text-2xl font-bold">{todayCount}</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-4">
                <p className="text-xs opacity-80">全質問</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">📸 写真で質問</h2>
              {currentUser.role === UserRole.STUDENT && (
                <p className="text-sm text-gray-500 mt-1">
                  今日あと <span className="font-bold text-indigo-600 text-lg">{remainingLimit}</span> 回 質問できます
                </p>
              )}
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                disabled={remainingLimit <= 0 || isUploading}
              />
              <button
                disabled={isUploading}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-md transition-all ${isUploading
                  ? 'bg-indigo-400 text-white cursor-wait'
                  : remainingLimit > 0
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:scale-105'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">{uploadProgress}</span>
                  </>
                ) : (
                  <>
                    <div className="text-xl">📷</div>
                    質問する
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Subject Selector (for non-tutor) */}
        {currentUser.role !== UserRole.TUTOR && (
          <div className="flex gap-2 mb-4">
            {['算数', '国語', '理科', '社会'].map(sub => (
              <button
                key={sub}
                onClick={() => setNewQuestionSubject(sub)}
                className={`px-3 py-1 text-xs rounded-full border ${newQuestionSubject === sub ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200'}`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Status Filter */}
        <div className="flex gap-2 bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
          {(['all', 'pending', 'done'] as StatusFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 text-sm rounded-xl font-semibold transition ${statusFilter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {f === 'all' ? 'すべて' : f === 'pending' ? '未対応' : '対応済み'}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1 bg-white/20 px-1.5 rounded-full text-xs">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedQuestions.length === 0 && (
            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400">
                {statusFilter === 'pending' ? '未対応の質問はありません 🎉' :
                  statusFilter === 'done' ? '対応済みの質問はありません' :
                    'まだ質問はありません'}
              </p>
            </div>
          )}

          {sortedQuestions.map(job => (
            <div key={job.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col ${job.status !== 'done' ? 'border-orange-200 ring-2 ring-orange-100' : 'border-gray-200'}`}>
              {/* Header */}
              <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-gray-200">{job.subject}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getStatusColor(job.status)}`}>
                  {getStatusLabel(job.status)}
                </span>
              </div>

              {/* Image Area */}
              <div className="aspect-video bg-gray-100 relative group cursor-pointer">
                <img src={job.questionImageUrl} alt="Question" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
                  クリックで拡大
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <p className="text-xs text-gray-400">{DateUtils.formatDate(job.createdAt)} {DateUtils.formatTime(job.createdAt)}</p>

                {/* AI Explanation with collapsible preview */}
                {job.aiExplanation ? (
                  <details className="bg-indigo-50 rounded-xl overflow-hidden" open={job.status !== 'done'}>
                    <summary className="cursor-pointer p-3 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-colors flex items-center gap-2">
                      <span>✨</span> AI解説プレビュー
                      <span className="ml-auto text-xs text-indigo-400">{job.status === 'done' ? '(クリックで展開)' : ''}</span>
                    </summary>
                    <div className="p-3 pt-0 text-sm text-indigo-900 border-t border-indigo-100">
                      {job.aiExplanation}
                    </div>
                  </details>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-indigo-500 rounded-full"></div>
                      AI解析中...
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-2 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* Tutor Comment (for completed items) */}
                {job.status === 'done' && job.tutorComment && (
                  <div className="bg-green-50 p-3 rounded-xl text-sm text-green-900 border-l-4 border-green-400">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-green-600">👨‍🏫</span>
                      <span className="font-bold text-xs text-green-600">先生コメント</span>
                    </div>
                    {job.tutorComment}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              {currentUser.role === UserRole.TUTOR && job.status !== 'done' && (
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <input
                    type="text"
                    placeholder="解説を一言..."
                    className="w-full text-xs border-gray-300 rounded mb-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTutorReview(job, (e.target as HTMLInputElement).value);
                    }}
                  />
                  <button
                    className="w-full bg-indigo-600 text-white text-xs py-2 rounded font-bold hover:bg-indigo-700"
                    onClick={(e) => {
                      const input = (e.currentTarget.previousElementSibling as HTMLInputElement).value;
                      handleTutorReview(job, input || '確認しました。OKです。');
                    }}
                  >
                    承認して返信
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
