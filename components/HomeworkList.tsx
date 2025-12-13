import React, { useEffect, useMemo, useState } from 'react';
import { Lesson, User, UserRole, HomeworkItem } from '../types';
import { StorageService } from '../services/storageService';
import { getHomeworkMeta, resolveDueDate } from '../services/homeworkUtils';
import { CheckCircleIcon, ClockIcon, SparklesIcon } from './icons';
import { Link } from 'react-router-dom';

interface HomeworkListProps {
  lesson: Lesson;
  currentUser: User;
  onUpdateLesson: (updated: Lesson) => void;
  onAudit: (action: string, summary: string) => void;
}

type StatusFilter = 'all' | 'todo' | 'done';
type TypeFilter = 'all' | 'practice' | 'review' | 'challenge';
type HomeworkKind = 'practice' | 'review' | 'challenge';

export const HomeworkList: React.FC<HomeworkListProps> = ({ lesson, currentUser, onUpdateLesson, onAudit }) => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todo');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newDueDays, setNewDueDays] = useState(3);
  const [newType, setNewType] = useState<HomeworkKind>('practice');
  const [newMinutes, setNewMinutes] = useState(30);

  const canAssign = currentUser.role === UserRole.TUTOR || currentUser.role === UserRole.ADMIN;
  const canCheck = currentUser.role === UserRole.TUTOR || currentUser.role === UserRole.STUDENT;

  const homeworkItems = lesson.aiHomework?.items ?? [];

  // Normalize IDs and dueDate to make toggles stable
  useEffect(() => {
    if (!lesson.aiHomework) return;

    let changed = false;
    const normalizedItems = lesson.aiHomework.items.map((item) => {
      const dueDate = resolveDueDate(lesson.scheduledAt, item);
      const id = item.id || StorageService.generateId();
      if (item.dueDate !== dueDate || item.id !== id) changed = true;
      return { ...item, dueDate, id };
    });

    if (changed) {
      onUpdateLesson({ ...lesson, aiHomework: { items: normalizedItems } });
    }
  }, [lesson, onUpdateLesson]);

  const decoratedItems = useMemo(() => {
    return homeworkItems.map((item, idx) => {
      const meta = getHomeworkMeta(lesson.scheduledAt, item);
      return { ...item, ...meta, id: item.id || `hw-${idx}` };
    });
  }, [homeworkItems, lesson.scheduledAt]);

  const filteredItems = useMemo(() => {
    return decoratedItems
      .filter((item) => {
        if (statusFilter === 'done') return !!item.isCompleted;
        if (statusFilter === 'todo') return !item.isCompleted;
        return true;
      })
      .filter((item) => (typeFilter === 'all' ? true : item.type === typeFilter))
      .sort((a, b) => {
        if (!!a.isCompleted === !!b.isCompleted) return a.daysRemaining - b.daysRemaining;
        return a.isCompleted ? 1 : -1;
      });
  }, [decoratedItems, statusFilter, typeFilter]);

  const total = decoratedItems.length;
  const completed = decoratedItems.filter((i) => i.isCompleted).length;
  const remaining = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const nextDue = decoratedItems.filter((i) => !i.isCompleted).sort((a, b) => a.daysRemaining - b.daysRemaining)[0];

  const handleToggle = (id: string) => {
    if (!lesson.aiHomework || !canCheck) return;
    const updatedItems = lesson.aiHomework.items.map((item) => {
      if ((item.id || '') !== id) return item;
      const toggled = !item.isCompleted;
      return {
        ...item,
        isCompleted: toggled,
        completedAt: toggled ? new Date().toISOString() : undefined,
      };
    });
    onUpdateLesson({ ...lesson, aiHomework: { items: updatedItems } });

    const target = lesson.aiHomework.items.find((i) => (i.id || '') === id);
    if (target) {
      onAudit('homework_status_changed', `${target.title} を${target.isCompleted ? '未完了' : '完了'}に変更`);
    }
  };

  const handleDelete = (id: string) => {
    if (!lesson.aiHomework || !canAssign) return;
    const target = lesson.aiHomework.items.find((i) => (i.id || '') === id);
    if (!target) return;
    if (!confirm('この宿題を削除しますか？')) return;

    const updatedItems = lesson.aiHomework.items.filter((item) => (item.id || '') !== id);
    onUpdateLesson({ ...lesson, aiHomework: { items: updatedItems } });
    onAudit('homework_deleted', `${target.title} を削除しました`);
  };

  const handleAdd = () => {
    if (!canAssign) return;
    if (!newTitle.trim()) {
      alert('宿題のタイトルを入力してください');
      return;
    }

    const dueDate = resolveDueDate(lesson.scheduledAt, { due_days_from_now: newDueDays } as HomeworkItem);
    const newItem: HomeworkItem = {
      id: StorageService.generateId(),
      title: newTitle.trim(),
      due_days_from_now: newDueDays,
      type: newType,
      estimated_minutes: newMinutes,
      isCompleted: false,
      dueDate,
      assignedAt: new Date().toISOString(),
    };

    const existing = lesson.aiHomework?.items ?? [];
    onUpdateLesson({
      ...lesson,
      aiHomework: { items: [newItem, ...existing] },
    });

    const meta = getHomeworkMeta(lesson.scheduledAt, newItem as any);
    onAudit('homework_added', `${newTitle} を追加 (期限: ${meta.remainingLabel})`);

    setNewTitle('');
    setNewDueDays(3);
    setNewType('practice');
    setNewMinutes(30);
  };

  const renderStatusBadge = (daysRemaining: number, label: string) => {
    const color =
      daysRemaining < 0 ? 'bg-red-100 text-red-700' :
        daysRemaining <= 1 ? 'bg-orange-100 text-orange-700' :
          'bg-green-100 text-green-700';
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm opacity-80">タスク管理</p>
            <h1 className="text-2xl font-bold">宿題と学習タスク</h1>
            <p className="opacity-80 text-sm mt-1">期限を見える化し、やり切りをサポートします</p>
          </div>
          <SparklesIcon className="w-10 h-10 opacity-70" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-xs opacity-80">残タスク</p>
            <p className="text-2xl font-bold">{remaining}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-xs opacity-80">完了率</p>
            <p className="text-2xl font-bold">{completionRate}%</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-xs opacity-80">次の期限</p>
            {nextDue ? (
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5" />
                <div>
                  <p className="text-sm font-semibold">{nextDue.remainingLabel}</p>
                  <p className="text-xs opacity-80">{nextDue.displayDate}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm font-semibold">なし</p>
            )}
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <p className="text-xs opacity-80">タスク総数</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex gap-2">
            {(['todo', 'all', 'done'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-full border font-semibold transition ${
                  statusFilter === f ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {f === 'todo' ? '未完了' : f === 'done' ? '完了済み' : 'すべて'}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'practice', 'review', 'challenge'] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 text-xs rounded-full border transition ${
                  typeFilter === t ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t === 'practice' ? '演習' : t === 'review' ? '復習' : t === 'challenge' ? 'チャレンジ' : '種別: 全部'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
              <p className="font-semibold text-gray-700">表示できる宿題がありません</p>
              <p className="text-sm text-gray-500 mt-1">AI要約から宿題を生成するか、手動で追加してください。</p>
              <Link
                to="/lessons/l1"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                授業記録へ移動
              </Link>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(item.id!)}
                    disabled={!canCheck}
                    className={`mt-1 rounded-full p-1 border ${
                      item.isCompleted ? 'bg-green-100 text-green-600 border-green-200' : 'bg-white text-gray-400 border-gray-200'
                    } disabled:opacity-50`}
                  >
                    <CheckCircleIcon className="w-5 h-5" checked={item.isCompleted} />
                  </button>
                  <div>
                    <p className={`font-semibold ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{item.type}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">約{item.estimated_minutes}分</span>
                      {item.completedAt && <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-50 text-green-700">完了済み</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  {renderStatusBadge(item.daysRemaining, item.remainingLabel)}
                  <p className="text-xs text-gray-500">期限: {item.displayDate}</p>
                  {canAssign && (
                    <button
                      onClick={() => handleDelete(item.id!)}
                      className="text-[11px] text-gray-500 hover:text-red-600"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {canAssign && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 h-fit">
            <h3 className="font-semibold text-gray-900">宿題を追加</h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500">タイトル</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="例: 2024年 理科 過去問"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500">期限 (日後)</label>
                <input
                  type="number"
                  min={0}
                  value={newDueDays}
                  onChange={(e) => setNewDueDays(parseInt(e.target.value || '0', 10))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">目安時間</label>
                <input
                  type="number"
                  min={5}
                  value={newMinutes}
                  onChange={(e) => setNewMinutes(parseInt(e.target.value || '0', 10))}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">種別</label>
              <div className="flex gap-2 mt-1">
                {(['practice', 'review', 'challenge'] as HomeworkKind[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={`px-3 py-1 text-xs rounded-full border ${
                      newType === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    {t === 'practice' ? '演習' : t === 'review' ? '復習' : 'チャレンジ'}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition"
            >
              追加する
            </button>
            <p className="text-[11px] text-gray-500">
              AI生成した宿題に加えて、講師が手動でタスクを積み増しできます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
