// Homework Firestore Service
import { HomeworkItem, Lesson } from '../types';
import { StorageService, DateUtils } from './storageService';
import firebaseService, { isFirebaseConfigured, firestoreOperations } from './firebaseService';
import { resolveDueDate } from './homeworkUtils';

// Homework service interface
interface HomeworkService {
    loadHomework(lessonId: string): Promise<HomeworkItem[]>;
    saveHomework(lessonId: string, items: HomeworkItem[]): Promise<void>;
    toggleComplete(lessonId: string, itemId: string, lesson: Lesson): Promise<Lesson>;
    addHomework(lessonId: string, item: HomeworkItem, lesson: Lesson): Promise<Lesson>;
    deleteHomework(lessonId: string, itemId: string, lesson: Lesson): Promise<Lesson>;
}

// Local implementation using existing StorageService
class LocalHomeworkService implements HomeworkService {
    async loadHomework(lessonId: string): Promise<HomeworkItem[]> {
        const lesson = StorageService.loadLesson();
        return lesson.aiHomework?.items ?? [];
    }

    async saveHomework(lessonId: string, items: HomeworkItem[]): Promise<void> {
        const lesson = StorageService.loadLesson();
        const updated = { ...lesson, aiHomework: { items } };
        StorageService.saveLesson(updated);
    }

    async toggleComplete(lessonId: string, itemId: string, lesson: Lesson): Promise<Lesson> {
        if (!lesson.aiHomework) return lesson;

        const updatedItems = lesson.aiHomework.items.map((item) => {
            if ((item.id || '') !== itemId) return item;
            const toggled = !item.isCompleted;
            return {
                ...item,
                isCompleted: toggled,
                completedAt: toggled ? new Date().toISOString() : undefined,
            };
        });

        const updated = { ...lesson, aiHomework: { items: updatedItems } };
        StorageService.saveLesson(updated);
        return updated;
    }

    async addHomework(lessonId: string, item: HomeworkItem, lesson: Lesson): Promise<Lesson> {
        const existing = lesson.aiHomework?.items ?? [];
        const updated = {
            ...lesson,
            aiHomework: { items: [item, ...existing] },
        };
        StorageService.saveLesson(updated);
        return updated;
    }

    async deleteHomework(lessonId: string, itemId: string, lesson: Lesson): Promise<Lesson> {
        if (!lesson.aiHomework) return lesson;

        const updatedItems = lesson.aiHomework.items.filter((item) => (item.id || '') !== itemId);
        const updated = { ...lesson, aiHomework: { items: updatedItems } };
        StorageService.saveLesson(updated);
        return updated;
    }
}

// Firebase implementation
class FirebaseHomeworkService implements HomeworkService {
    async loadHomework(lessonId: string): Promise<HomeworkItem[]> {
        const lesson = await firestoreOperations.getLesson(lessonId);
        return lesson?.aiHomework?.items ?? [];
    }

    async saveHomework(lessonId: string, items: HomeworkItem[]): Promise<void> {
        const lesson = await firestoreOperations.getLesson(lessonId);
        if (lesson) {
            await firestoreOperations.saveLesson({ ...lesson, aiHomework: { items } });
        }
    }

    async toggleComplete(lessonId: string, itemId: string, lesson: Lesson): Promise<Lesson> {
        if (!lesson.aiHomework) return lesson;

        const updatedItems = lesson.aiHomework.items.map((item) => {
            if ((item.id || '') !== itemId) return item;
            const toggled = !item.isCompleted;
            return {
                ...item,
                isCompleted: toggled,
                completedAt: toggled ? new Date().toISOString() : undefined,
            };
        });

        const updated = { ...lesson, aiHomework: { items: updatedItems } };
        await firestoreOperations.saveLesson(updated);
        return updated;
    }

    async addHomework(lessonId: string, item: HomeworkItem, lesson: Lesson): Promise<Lesson> {
        const existing = lesson.aiHomework?.items ?? [];
        const updated = {
            ...lesson,
            aiHomework: { items: [item, ...existing] },
        };
        await firestoreOperations.saveLesson(updated);
        return updated;
    }

    async deleteHomework(lessonId: string, itemId: string, lesson: Lesson): Promise<Lesson> {
        if (!lesson.aiHomework) return lesson;

        const updatedItems = lesson.aiHomework.items.filter((item) => (item.id || '') !== itemId);
        const updated = { ...lesson, aiHomework: { items: updatedItems } };
        await firestoreOperations.saveLesson(updated);
        return updated;
    }
}

// Export singleton based on configuration
const isFirebase = isFirebaseConfigured();
export const homeworkService: HomeworkService = isFirebase
    ? new FirebaseHomeworkService()
    : new LocalHomeworkService();

export default homeworkService;
