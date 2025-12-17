// User Feedback Service - Collection and Semi-automatic Feature Implementation
// Collects user feedback and enables admin review for feature prioritization

interface Feedback {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    type: 'bug' | 'feature' | 'improvement' | 'other';
    category: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'reviewed' | 'in_progress' | 'implemented' | 'declined';
    adminNotes?: string;
    createdAt: string;
    updatedAt?: string;
    votes: number;
    voterIds: string[];
}

const FEEDBACK_KEY = 'manabee_feedback';
const MAX_LOCAL_FEEDBACK = 100;

class FeedbackService {
    private isFirebaseMode = false;

    constructor() {
        try {
            this.isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';
        } catch {
            this.isFirebaseMode = false;
        }
    }

    /**
     * Submit new feedback
     */
    async submitFeedback(params: {
        userId: string;
        userName: string;
        userRole: string;
        type: Feedback['type'];
        category: string;
        title: string;
        description: string;
    }): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
        const feedback: Feedback = {
            id: this.generateId(),
            userId: params.userId,
            userName: params.userName,
            userRole: params.userRole,
            type: params.type,
            category: params.category,
            title: params.title,
            description: params.description,
            priority: 'medium',
            status: 'new',
            createdAt: new Date().toISOString(),
            votes: 1,
            voterIds: [params.userId]
        };

        if (this.isFirebaseMode) {
            try {
                const { db } = await this.getFirestore();
                const { doc, setDoc, collection } = await import('firebase/firestore');
                await setDoc(doc(collection(db, 'feedback'), feedback.id), feedback);
                return { success: true, feedbackId: feedback.id };
            } catch (e: any) {
                console.error('[FeedbackService] Failed to submit to Firestore:', e);
                return { success: false, error: e.message };
            }
        } else {
            this.saveToLocal(feedback);
            return { success: true, feedbackId: feedback.id };
        }
    }

    /**
     * Get all feedback (for admin review)
     */
    async getAllFeedback(filters?: {
        status?: Feedback['status'];
        type?: Feedback['type'];
        limit?: number;
    }): Promise<Feedback[]> {
        if (this.isFirebaseMode) {
            try {
                const { db } = await this.getFirestore();
                const { collection, query, orderBy, limit: fbLimit, getDocs, where } = await import('firebase/firestore');

                let q = query(
                    collection(db, 'feedback'),
                    orderBy('createdAt', 'desc'),
                    fbLimit(filters?.limit || 50)
                );

                // Note: Firestore requires compound indexes for multiple where clauses
                // For simplicity, we'll add status filter if provided
                if (filters?.status) {
                    q = query(
                        collection(db, 'feedback'),
                        where('status', '==', filters.status),
                        orderBy('createdAt', 'desc'),
                        fbLimit(filters?.limit || 50)
                    );
                }

                const snapshot = await getDocs(q);
                return snapshot.docs.map(doc => doc.data() as Feedback);
            } catch (e) {
                console.error('[FeedbackService] Failed to fetch from Firestore:', e);
                return this.getLocalFeedback();
            }
        }
        return this.getLocalFeedback();
    }

    /**
     * Vote for existing feedback (user agrees with feature/bug)
     */
    async voteFeedback(feedbackId: string, userId: string): Promise<{ success: boolean; newVotes?: number }> {
        if (this.isFirebaseMode) {
            try {
                const { db } = await this.getFirestore();
                const { doc, getDoc, updateDoc, arrayUnion, increment } = await import('firebase/firestore');

                const feedbackRef = doc(db, 'feedback', feedbackId);
                const feedbackDoc = await getDoc(feedbackRef);

                if (!feedbackDoc.exists()) {
                    return { success: false };
                }

                const data = feedbackDoc.data() as Feedback;
                if (data.voterIds.includes(userId)) {
                    return { success: false }; // Already voted
                }

                await updateDoc(feedbackRef, {
                    votes: increment(1),
                    voterIds: arrayUnion(userId)
                });

                return { success: true, newVotes: data.votes + 1 };
            } catch (e) {
                console.error('[FeedbackService] Failed to vote:', e);
                return { success: false };
            }
        }
        return { success: false };
    }

    /**
     * Update feedback status (admin only)
     */
    async updateFeedbackStatus(
        feedbackId: string,
        status: Feedback['status'],
        adminNotes?: string,
        priority?: Feedback['priority']
    ): Promise<{ success: boolean }> {
        if (this.isFirebaseMode) {
            try {
                const { db } = await this.getFirestore();
                const { doc, updateDoc } = await import('firebase/firestore');

                const updates: any = {
                    status,
                    updatedAt: new Date().toISOString()
                };
                if (adminNotes !== undefined) updates.adminNotes = adminNotes;
                if (priority !== undefined) updates.priority = priority;

                await updateDoc(doc(db, 'feedback', feedbackId), updates);
                return { success: true };
            } catch (e) {
                console.error('[FeedbackService] Failed to update status:', e);
                return { success: false };
            }
        }
        return { success: false };
    }

    /**
     * Get feedback statistics
     */
    async getFeedbackStats(): Promise<{
        total: number;
        byType: Record<string, number>;
        byStatus: Record<string, number>;
        byPriority: Record<string, number>;
        recentCount: number;
    }> {
        const feedback = await this.getAllFeedback({ limit: 200 });
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const byType: Record<string, number> = {};
        const byStatus: Record<string, number> = {};
        const byPriority: Record<string, number> = {};
        let recentCount = 0;

        feedback.forEach(item => {
            byType[item.type] = (byType[item.type] || 0) + 1;
            byStatus[item.status] = (byStatus[item.status] || 0) + 1;
            byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
            if (new Date(item.createdAt) > oneWeekAgo) {
                recentCount++;
            }
        });

        return {
            total: feedback.length,
            byType,
            byStatus,
            byPriority,
            recentCount
        };
    }

    /**
     * Get top voted feedback
     */
    async getTopVotedFeedback(limit: number = 10): Promise<Feedback[]> {
        const allFeedback = await this.getAllFeedback({ limit: 100 });
        return allFeedback
            .filter(f => f.status !== 'implemented' && f.status !== 'declined')
            .sort((a, b) => b.votes - a.votes)
            .slice(0, limit);
    }

    // Local storage helpers
    private saveToLocal(feedback: Feedback): void {
        try {
            const existing = this.getLocalFeedback();
            existing.unshift(feedback);
            while (existing.length > MAX_LOCAL_FEEDBACK) {
                existing.pop();
            }
            localStorage.setItem(FEEDBACK_KEY, JSON.stringify(existing));
        } catch (e) {
            console.error('[FeedbackService] Failed to save locally:', e);
        }
    }

    private getLocalFeedback(): Feedback[] {
        try {
            const stored = localStorage.getItem(FEEDBACK_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    private async getFirestore() {
        const { initializeApp, getApps } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');

        const firebaseConfig = {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };

        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const db = getFirestore(app);
        return { db };
    }

    private generateId(): string {
        return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export singleton
export const feedbackService = new FeedbackService();

export type { Feedback };
export default feedbackService;
