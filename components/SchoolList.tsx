import React, { useState } from 'react';
import { StudentSchool, SchoolEvent, UserRole, User, SchoolEventType } from '../types';
import { StorageService, DateUtils } from '../services/storageService';
import { FlagIcon, ClockIcon, AcademicCapIcon, CheckCircleIcon } from './icons';

interface SchoolListProps {
  schools: StudentSchool[];
  currentUser: User;
  onUpdateSchool: (school: StudentSchool) => void;
  onDeleteSchool: (schoolId: string) => void;
  onAddSchool: (school: StudentSchool) => void;
  permissionMode: 'strict' | 'collaborative';
}

export const SchoolList: React.FC<SchoolListProps> = ({ schools, currentUser, onUpdateSchool, onDeleteSchool, onAddSchool, permissionMode }) => {
  // Permission Check: TUTOR or Collaborative Mode
  const canEdit = currentUser.role === UserRole.TUTOR || permissionMode === 'collaborative';

  // --- State ---
  const [isAddingSchool, setIsAddingSchool] = useState(false);

  // Editing School State
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editSchoolMemo, setEditSchoolMemo] = useState('');
  const [editSchoolUrl, setEditSchoolUrl] = useState('');

  // Event Form State (Add/Edit)
  const [activeEventForm, setActiveEventForm] = useState<{ schoolId: string, eventId?: string } | null>(null);
  const [eventFormType, setEventFormType] = useState<SchoolEventType>('other');
  const [eventFormTitle, setEventFormTitle] = useState('');
  const [eventFormDate, setEventFormDate] = useState('');
  const [eventFormTime, setEventFormTime] = useState('');
  const [eventFormIsAllDay, setEventFormIsAllDay] = useState(false);
  const [eventFormNote, setEventFormNote] = useState('');

  // View State
  const [expandedPastEvents, setExpandedPastEvents] = useState<Record<string, boolean>>({});

  // --- Actions ---

  const handleSaveNewSchool = () => {
    if (!editSchoolName.trim()) {
      alert('学校名は必須です');
      return;
    }
    const newSchool: StudentSchool = {
      id: StorageService.generateId(),
      studentId: 's1',
      name: editSchoolName,
      priority: schools.length + 1,
      status: 'considering',
      subjects: ['4科'],
      memo: editSchoolMemo,
      sourceUrl: editSchoolUrl,
      events: []
    };
    onAddSchool(newSchool);
    resetSchoolForm();
  };

  const handleUpdateSchoolInfo = () => {
    if (!editingSchoolId || !editSchoolName.trim()) return;
    const school = schools.find(s => s.id === editingSchoolId);
    if (!school) return;

    const updated: StudentSchool = {
      ...school,
      name: editSchoolName,
      memo: editSchoolMemo,
      sourceUrl: editSchoolUrl
    };
    onUpdateSchool(updated);
    setEditingSchoolId(null);
  };

  const startEditSchool = (school: StudentSchool) => {
    setEditingSchoolId(school.id);
    setEditSchoolName(school.name);
    setEditSchoolMemo(school.memo);
    setEditSchoolUrl(school.sourceUrl || '');
  };

  const resetSchoolForm = () => {
    setIsAddingSchool(false);
    setEditingSchoolId(null);
    setEditSchoolName('');
    setEditSchoolMemo('');
    setEditSchoolUrl('');
  };

  // --- Event Actions ---

  const openAddEventForm = (schoolId: string) => {
    setActiveEventForm({ schoolId });
    setEventFormType('exam');
    setEventFormTitle('');
    setEventFormDate('');
    setEventFormTime('');
    setEventFormIsAllDay(true);
    setEventFormNote('');
  };

  const openEditEventForm = (schoolId: string, event: SchoolEvent) => {
    setActiveEventForm({ schoolId, eventId: event.id });
    setEventFormType(event.type);
    setEventFormTitle(event.title);

    const { date, time } = DateUtils.parseToInputs(event.date);
    setEventFormDate(date);
    setEventFormTime(time);
    setEventFormIsAllDay(event.isAllDay);
    setEventFormNote(event.note || '');
  };

  const handleSaveEvent = () => {
    if (!activeEventForm) return;
    if (!eventFormTitle.trim() || !eventFormDate) {
      alert('タイトルと日付は必須です');
      return;
    }

    const school = schools.find(s => s.id === activeEventForm.schoolId);
    if (!school) return;

    const isoDate = DateUtils.combineDateTime(eventFormDate, eventFormIsAllDay ? undefined : eventFormTime);

    let newEvents = [...school.events];

    if (activeEventForm.eventId) {
      // Edit
      newEvents = newEvents.map(e => e.id === activeEventForm.eventId ? {
        ...e,
        type: eventFormType,
        title: eventFormTitle,
        date: isoDate,
        isAllDay: eventFormIsAllDay,
        note: eventFormNote
      } : e);
    } else {
      // Add
      const newEvent: SchoolEvent = {
        id: StorageService.generateId(),
        type: eventFormType,
        title: eventFormTitle,
        date: isoDate,
        isAllDay: eventFormIsAllDay,
        note: eventFormNote
      };
      newEvents.push(newEvent);
    }

    onUpdateSchool({ ...school, events: newEvents });
    setActiveEventForm(null);
  };

  const handleDeleteEvent = (schoolId: string, eventId: string) => {
    if (!confirm('このイベントを削除しますか？')) return;
    const school = schools.find(s => s.id === schoolId);
    if (!school) return;
    onUpdateSchool({ ...school, events: school.events.filter(e => e.id !== eventId) });
  };

  const handleDeleteSchoolAction = (schoolId: string) => {
    if (!confirm('この学校情報とすべてのイベントを削除しますか？（取り消せません）')) return;
    onDeleteSchool(schoolId);
  };

  // --- Helpers ---

  const getEventColor = (type: SchoolEventType) => {
    switch (type) {
      case 'exam': return 'text-red-700 bg-red-50 border-red-200';
      case 'application_end': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'result': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getEventLabel = (type: SchoolEventType) => {
    switch (type) {
      case 'exam': return '入試';
      case 'application_start': return '出願';
      case 'application_end': return '出願〆';
      case 'result': return '発表';
      case 'procedure': return '手続';
      default: return '他';
    }
  };

  // Safe sort to avoid mutation of props
  const sortedSchools = [...schools].sort((a, b) => a.priority - b.priority);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">受験校・スケジュール</h1>
          {!canEdit && currentUser.role !== UserRole.TUTOR && (
            <p className="text-xs text-gray-500 mt-1">※閲覧モード (編集は協調モードのみ)</p>
          )}
        </div>
        {canEdit && !isAddingSchool && (
          <button
            onClick={() => { resetSchoolForm(); setIsAddingSchool(true); }}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium flex items-center gap-2"
          >
            <span>+</span> 学校を追加
          </button>
        )}
      </div>

      {/* Add/Edit School Form */}
      {(isAddingSchool || editingSchoolId) && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-200 mb-6 animate-fade-in relative z-10">
          <h3 className="font-bold text-gray-800 mb-4">{editingSchoolId ? '学校情報を編集' : '新しい学校を追加'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 mb-1">学校名 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editSchoolName}
                onChange={e => setEditSchoolName(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="例：開成中学校"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">メモ</label>
              <input
                type="text"
                value={editSchoolMemo}
                onChange={e => setEditSchoolMemo(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="方針など"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">出典URL</label>
              <input
                type="text"
                value={editSchoolUrl}
                onChange={e => setEditSchoolUrl(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={resetSchoolForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded">キャンセル</button>
            <button
              onClick={editingSchoolId ? handleUpdateSchoolInfo : handleSaveNewSchool}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {sortedSchools.length === 0 && <p className="text-gray-500 text-center py-10">登録された学校はありません。</p>}

        {sortedSchools.map((school) => {
          // Process events for this school (Use Realtime NOW instead of fixed CURRENT_DATE)
          const events = school.events.map(e => ({
            ...e,
            days: DateUtils.getDaysRemaining(e.date, e.isAllDay)
          })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          const futureEvents = events.filter(e => e.days >= 0);
          const pastEvents = events.filter(e => e.days < 0);
          const nextEvent = futureEvents[0]; // Nearest future event

          return (
            <div key={school.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
              {/* School Header */}
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-start gap-4 bg-white">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg shrink-0 ${school.priority === 1 ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                    <AcademicCapIcon className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {school.priority === 1 && (
                        <span className="text-xs font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">第一志望</span>
                      )}
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {school.status === 'considering' ? '検討中' : school.status === 'applied' ? '出願済' : '終了'}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 leading-tight truncate">{school.name}</h2>
                    {/* Next Event Summary Line */}
                    {nextEvent && (
                      <p className="text-sm text-indigo-600 font-medium mt-1 flex items-center gap-1">
                        <span className="text-xs bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">次</span>
                        {nextEvent.title}まで {DateUtils.formatDaysRemaining(nextEvent.days)}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2 text-xs">
                      {school.subjects.map(sub => <span key={sub} className="bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-gray-500">{sub}</span>)}
                      {school.sourceUrl && (
                        <a href={school.sourceUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline flex items-center gap-0.5">
                          公式サイト ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 w-full md:w-64 text-sm text-yellow-800">
                    <span className="font-bold block text-xs mb-1 text-yellow-900 opacity-70">メモ</span>
                    {school.memo || 'メモなし'}
                  </div>
                  {canEdit && (
                    <div className="flex gap-3 text-xs w-full justify-end">
                      <button onClick={() => startEditSchool(school)} className="text-indigo-600 hover:underline font-medium">編集</button>
                      <button onClick={() => handleDeleteSchoolAction(school.id)} className="text-gray-400 hover:text-red-600">削除</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Events Section */}
              <div className="p-6 bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" /> スケジュール
                  </h3>
                  {canEdit && (
                    <button
                      onClick={() => openAddEventForm(school.id)}
                      className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded border border-indigo-200 bg-white shadow-sm"
                    >
                      + イベント追加
                    </button>
                  )}
                </div>

                {/* Event Form (Add/Edit) */}
                {activeEventForm?.schoolId === school.id && (
                  <div className="bg-white p-5 rounded-lg border border-indigo-300 shadow-md mb-6 animate-fade-in ring-1 ring-indigo-100 relative">
                    <div className="absolute top-3 right-3">
                      <button onClick={() => setActiveEventForm(null)} className="text-gray-400 hover:text-gray-600">×</button>
                    </div>
                    <h4 className="text-xs font-bold text-gray-600 mb-3 uppercase">
                      {activeEventForm.eventId ? 'イベントを編集' : '新しいイベントを作成'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                      <div className="md:col-span-3">
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">日付</label>
                        <input
                          type="date"
                          className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          value={eventFormDate}
                          onChange={e => setEventFormDate(e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">時刻設定</label>
                        <div className="flex items-center gap-2 h-[38px]">
                          <input
                            type="time"
                            disabled={eventFormIsAllDay}
                            className="flex-1 text-sm border-gray-300 rounded disabled:bg-gray-100 disabled:text-gray-400 focus:ring-indigo-500 focus:border-indigo-500"
                            value={eventFormTime}
                            onChange={e => setEventFormTime(e.target.value)}
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={eventFormIsAllDay}
                              onChange={e => setEventFormIsAllDay(e.target.checked)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            終日
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">種別</label>
                        <select
                          className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          value={eventFormType}
                          onChange={(e) => setEventFormType(e.target.value as SchoolEventType)}
                        >
                          <option value="application_start">出願</option>
                          <option value="application_end">出願〆</option>
                          <option value="exam">入試</option>
                          <option value="result">発表</option>
                          <option value="procedure">手続</option>
                          <option value="other">他</option>
                        </select>
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">タイトル</label>
                        <input
                          type="text"
                          className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          value={eventFormTitle}
                          onChange={e => setEventFormTitle(e.target.value)}
                          placeholder="例: 前期入試"
                        />
                      </div>
                      <div className="md:col-span-12">
                        <label className="block text-[10px] text-gray-400 font-bold mb-1">詳細メモ (任意)</label>
                        <input
                          type="text"
                          className="w-full text-sm border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                          value={eventFormNote}
                          onChange={e => setEventFormNote(e.target.value)}
                          placeholder="持ち物や注意事項など"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                      <button onClick={() => setActiveEventForm(null)} className="text-xs text-gray-500 px-3 py-1.5 hover:bg-gray-100 rounded">キャンセル</button>
                      <button onClick={handleSaveEvent} className="text-xs bg-indigo-600 text-white px-6 py-1.5 rounded hover:bg-indigo-700 font-bold shadow-sm">
                        {activeEventForm.eventId ? '更新する' : '追加する'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {events.length === 0 && <p className="text-xs text-gray-400 italic">イベントはまだ登録されていません</p>}

                  {/* Upcoming Events */}
                  {futureEvents.map(evt => (
                    <div
                      key={evt.id}
                      onClick={() => canEdit && openEditEventForm(school.id, evt)}
                      className={`group flex items-start sm:items-center gap-4 p-3 rounded-lg border bg-white cursor-pointer hover:bg-gray-50 transition-colors ${evt.days <= 7 ? 'ring-1 ring-orange-300 border-orange-300' : 'border-gray-200'}`}
                    >
                      <div className="flex flex-col items-center justify-center w-16 text-center border-r border-gray-100 pr-3 pt-1 sm:pt-0">
                        <span className="text-[10px] text-gray-500 font-bold">{DateUtils.formatDate(evt.date).split('(')[0]}</span>
                        <span className="text-xs text-gray-400">{!evt.isAllDay ? DateUtils.formatTime(evt.date) : '終日'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${getEventColor(evt.type)}`}>
                            {getEventLabel(evt.type)}
                          </span>
                          <p className="text-sm font-bold text-gray-900 truncate">{evt.title}</p>
                        </div>
                        {evt.note && <p className="text-xs text-gray-500 truncate">memo: {evt.note}</p>}
                      </div>
                      <div className="text-right shrink-0 min-w-[60px]">
                        <span className={`text-sm font-bold ${evt.days <= 0 ? 'text-orange-600' : evt.days <= 7 ? 'text-red-600' : 'text-indigo-600'}`}>
                          {DateUtils.formatDaysRemaining(evt.days)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Past Events Collapsible */}
                  {pastEvents.length > 0 && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedPastEvents(prev => ({ ...prev, [school.id]: !prev[school.id] }))}
                        className="text-xs font-bold text-gray-400 flex items-center gap-1 hover:text-gray-600"
                      >
                        {expandedPastEvents[school.id] ? '▼' : '▶'} 終了したイベント ({pastEvents.length})
                      </button>

                      {expandedPastEvents[school.id] && (
                        <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200">
                          {pastEvents.map(evt => (
                            <div key={evt.id} className="flex items-center gap-3 p-2 rounded bg-gray-100 opacity-70">
                              <span className="text-xs text-gray-500 font-mono">{DateUtils.formatDate(evt.date)}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">{getEventLabel(evt.type)}</span>
                              <span className="text-xs text-gray-600 line-through truncate flex-1">{evt.title}</span>
                              <span className="text-[10px] text-gray-400">終了</span>
                              {canEdit && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteEvent(school.id, evt.id); }}
                                  className="text-[10px] text-red-400 hover:text-red-600 hover:underline"
                                >
                                  削除
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};