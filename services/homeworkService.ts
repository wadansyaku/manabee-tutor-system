// Homework Firestore Service
// All Firebase imports are dynamic to prevent page load crashes
import { HomeworkItem, Lesson } from '../types';
import { StorageService, DateUtils } from './storageService';
import { resolveDueDate } from './homeworkUtils';

// Check if Firebase mode is enabled (no SDK import)
const checkFirebaseMode = (): boolean => {
    try {
        return import.meta.env.VITE_APP_MODE === 'firebase' && !!import.meta.env.VITE_FIREBASE_API_KEY;
    } catch {
        return false;
    }
};

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

// Firebase implementation - uses dynamic import
class FirebaseHomeworkService implements HomeworkService {
    private async getFirestoreOps() {
        const firebaseService = await import('./firebaseService');
        return firebaseService.firestoreOperations;
    }

    async loadHomework(lessonId: string): Promise<HomeworkItem[]> {
        const ops = await this.getFirestoreOps();
        const lesson = await ops.getLesson(lessonId);
        return lesson?.aiHomework?.items ?? [];
    }

    async saveHomework(lessonId: string, items: HomeworkItem[]): Promise<void> {
        const ops = await this.getFirestoreOps();
        const lesson = await ops.getLesson(lessonId);
        if (lesson) {
            await ops.saveLesson({ ...lesson, aiHomework: { items } });
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
        const ops = await this.getFirestoreOps();
        await ops.saveLesson(updated);
        return updated;
    }

    async addHomework(lessonId: string, item: HomeworkItem, lesson: Lesson): Promise<Lesson> {
        const existing = lesson.aiHomework?.items ?? [];
        const updated = {
            ...lesson,
            aiHomework: { items: [item, ...existing] },
        };
        const ops = await this.getFirestoreOps();
        await ops.saveLesson(updated);
        return updated;
    }

    async deleteHomework(lessonId: string, itemId: string, lesson: Lesson): Promise<Lesson> {
        if (!lesson.aiHomework) return lesson;

        const updatedItems = lesson.aiHomework.items.filter((item) => (item.id || '') !== itemId);
        const updated = { ...lesson, aiHomework: { items: updatedItems } };
        const ops = await this.getFirestoreOps();
        await ops.saveLesson(updated);
        return updated;
    }
}

// Export singleton based on configuration
const isFirebase = checkFirebaseMode();
export const homeworkService: HomeworkService = isFirebase
    ? new FirebaseHomeworkService()
    : new LocalHomeworkService();

export default homeworkService;
