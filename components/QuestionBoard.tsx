import React, { useState } from 'react';
import { QuestionJob, User, UserRole } from '../types';
import { StorageService, DateUtils } from '../services/storageService';
import { uploadQuestionPhoto, compressImage } from '../services/photoStorageService';
import { CheckCircleIcon, MicrophoneIcon } from './icons';

interface QuestionBoardProps {
  currentUser: User;
  questions: QuestionJob[];
  onUpdate: () => void;
}

export const QuestionBoard: React.FC<QuestionBoardProps> = ({ currentUser, questions, onUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [newQuestionSubject, setNewQuestionSubject] = useState('算数');

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
  const viewableQuestions = currentUser.role === UserRole.TUTOR
    ? questions // Tutor sees all
    : questions.filter(q => q.studentId === currentUser.id); // Student/Guardian sees own

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">📸 写真で質問</h2>
          {currentUser.role === UserRole.STUDENT && (
            <p className="text-sm text-gray-500 mt-1">
              今日あと <span className="font-bold text-indigo-600 text-lg">{remainingLimit}</span> 回 質問できます
            </p>
          )}
        </div>

        {currentUser.role !== UserRole.TUTOR && (
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
        )}
      </div>

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

      {/* Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {viewableQuestions.length === 0 && (
          <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-400">まだ質問はありません</p>
          </div>
        )}

        {viewableQuestions.map(job => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-gray-200">{job.subject}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${job.status === 'done' ? 'bg-green-100 text-green-700' :
                  job.status === 'needs_review' ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                }`}>
                {job.status === 'queued' ? 'AI解析中' : job.status}
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

              {/* Stub for AI Explanation */}
              {job.aiExplanation ? (
                <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-900">
                  <span className="font-bold text-xs block text-indigo-400 mb-1">AI解説</span>
                  {job.aiExplanation}
                </div>
              ) : (
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-2 bg-gray-200 rounded"></div>
                    <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              )}

              {/* Tutor Review Area */}
              {job.status === 'done' && job.tutorComment && (
                <div className="bg-green-50 p-3 rounded text-sm text-green-900 border-l-4 border-green-400">
                  <span className="font-bold text-xs block text-green-600 mb-1">先生コメント</span>
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
  );
};
