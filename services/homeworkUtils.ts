import { HomeworkItem } from '../types';
import { DateUtils } from './storageService';

// Calculate due date from lesson start time and relative days
export const resolveDueDate = (lessonDateIso: string, item: HomeworkItem): string => {
  if (item.dueDate) return item.dueDate;
  return DateUtils.addDays(lessonDateIso, item.due_days_from_now);
};

export const getHomeworkMeta = (lessonDateIso: string, item: HomeworkItem) => {
  const dueDate = resolveDueDate(lessonDateIso, item);
  const daysRemaining = DateUtils.getDaysRemaining(dueDate, true);

  return {
    dueDate,
    daysRemaining,
    remainingLabel: DateUtils.formatDaysRemaining(daysRemaining),
    displayDate: DateUtils.formatDate(dueDate),
  };
};

export const normalizeHomeworkItems = (lessonDateIso: string, items: HomeworkItem[]) => {
  return items.map((item) => ({
    ...item,
    dueDate: resolveDueDate(lessonDateIso, item),
  }));
};
