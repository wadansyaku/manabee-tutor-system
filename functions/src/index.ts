/**
 * Manabee Tutor System - Cloud Functions
 * 
 * Secure server-side implementation for AI features and admin operations.
 * All sensitive operations (API keys, rate limiting, user management) are handled here.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Rate limiting configuration
const RATE_LIMIT_DAILY = 10; // requests per user per day
const RATE_LIMIT_COLLECTION = 'rate_limits';

// AI Model configuration
const MODEL_NAME = 'gemini-2.5-flash';

// Helper: Get AI client (API key from environment)
const getAIClient = (): GoogleGenAI => {
    const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;

    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Gemini API key not configured');
    }

    return new GoogleGenAI({ apiKey });
};

// Helper: Check rate limit for user
const checkRateLimit = async (userId: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const limitRef = db.collection(RATE_LIMIT_COLLECTION).doc(`${userId}_${today}`);

    const doc = await limitRef.get();
    const current = doc.exists ? (doc.data()?.count || 0) : 0;

    if (current >= RATE_LIMIT_DAILY) {
        throw new functions.https.HttpsError(
            'resource-exhausted',
            `Daily AI request limit (${RATE_LIMIT_DAILY}) exceeded. Try again tomorrow.`
        );
    }

    // Increment counter
    await limitRef.set({ count: current + 1, updatedAt: new Date().toISOString() }, { merge: true });
};

// Helper: Log API usage
const logApiUsage = async (userId: string, functionName: string): Promise<void> => {
    await db.collection('api_usage_logs').add({
        userId,
        functionName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
    });
};

// Schemas for structured output
const summarySchema: Schema = {
    type: Type.OBJECT,
    properties: {
        lesson_goal: { type: Type.STRING, description: 'The main goal of this lesson' },
        what_we_did: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'List of topics covered' },
        what_went_well: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Things the student did well' },
        issues: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Areas where student struggled' },
        next_actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Action items for next time' },
        parent_message: { type: Type.STRING, description: 'A polite message to the guardian (max 200 chars)' },
        quiz_focus: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Key topics to quiz on' },
    },
    required: ['lesson_goal', 'what_we_did', 'what_went_well', 'issues', 'next_actions', 'parent_message', 'quiz_focus']
};

const homeworkSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    due_days_from_now: { type: Type.INTEGER },
                    type: { type: Type.STRING, enum: ['practice', 'review', 'challenge'] },
                    estimated_minutes: { type: Type.INTEGER }
                },
                required: ['title', 'due_days_from_now', 'type', 'estimated_minutes']
            }
        }
    }
};

const quizSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['mcq', 'short'] },
                    q: { type: Type.STRING },
                    choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                    answer: { type: Type.STRING },
                    explain: { type: Type.STRING }
                },
                required: ['type', 'q', 'answer', 'explain']
            }
        }
    }
};

/**
 * Generate Lesson Content
 * 
 * Callable function that generates AI-powered lesson summary, homework, and quiz.
 * Requires authentication and respects rate limits.
 */
export const generateLessonContent = functions.https.onCall(async (data, context) => {
    // 1. Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const userId = context.auth.uid;
    const { transcript, studentContext } = data;

    if (!transcript || typeof transcript !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'Transcript is required');
    }

    // 2. Rate limit check
    await checkRateLimit(userId);

    // 3. Get AI client
    const ai = getAIClient();

    try {
        // 4. Generate content in parallel
        const [summaryRes, homeworkRes, quizRes] = await Promise.all([
            ai.models.generateContent({
                model: MODEL_NAME,
                contents: `
                    Based on the following lesson transcript and student context, generate a structured summary.
                    Student Context: ${studentContext || 'No context provided'}
                    Transcript: ${transcript}
                `,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: summarySchema,
                    temperature: 0.3,
                }
            }),
            ai.models.generateContent({
                model: MODEL_NAME,
                contents: `
                    Based on the issues and covered topics in this transcript, suggest 3-5 specific homework items.
                    Student Context: ${studentContext || 'No context provided'}
                    Transcript: ${transcript}
                `,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: homeworkSchema,
                    temperature: 0.5,
                }
            }),
            ai.models.generateContent({
                model: MODEL_NAME,
                contents: `
                    Create a mini-quiz (3-5 questions) based on the material covered in this transcript.
                    Include a mix of Multiple Choice (mcq) and Short Answer (short).
                    Student Context: ${studentContext || 'No context provided'}
                    Transcript: ${transcript}
                `,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: quizSchema,
                    temperature: 0.5,
                }
            })
        ]);

        const summaryText = summaryRes.text;
        const homeworkText = homeworkRes.text;
        const quizText = quizRes.text;

        if (!summaryText || !homeworkText || !quizText) {
            throw new functions.https.HttpsError('internal', 'Incomplete response from AI');
        }

        // 5. Log usage
        await logApiUsage(userId, 'generateLessonContent');

        // 6. Return parsed results
        return {
            summary: JSON.parse(summaryText),
            homework: JSON.parse(homeworkText),
            quiz: JSON.parse(quizText)
        };

    } catch (error: any) {
        console.error('AI Generation Error:', error);
        throw new functions.https.HttpsError('internal', `AI generation failed: ${error.message}`);
    }
});

/**
 * Get Usage Stats (Admin Only)
 * 
 * Returns API usage statistics for admin monitoring.
 */
export const getUsageStats = functions.https.onCall(async (data, context) => {
    // 1. Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // 2. Admin check (via custom claims or Firestore)
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    // 3. Get usage data
    const { timeRange = '7d' } = data;
    const msPerDay = 24 * 60 * 60 * 1000;
    const cutoff = timeRange === '30d'
        ? new Date(Date.now() - 30 * msPerDay)
        : new Date(Date.now() - 7 * msPerDay);

    const snapshot = await db.collection('api_usage_logs')
        .where('timestamp', '>=', cutoff)
        .get();

    // Aggregate by user and function
    const byUser: Record<string, number> = {};
    const byFunction: Record<string, number> = {};
    const byDate: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
        const data = doc.data();
        byUser[data.userId] = (byUser[data.userId] || 0) + 1;
        byFunction[data.functionName] = (byFunction[data.functionName] || 0) + 1;
        byDate[data.date] = (byDate[data.date] || 0) + 1;
    });

    return {
        totalCalls: snapshot.size,
        byUser,
        byFunction,
        byDate,
        timeRange
    };
});

/**
 * Admin: List All Users
 * 
 * Returns all users for admin management.
 */
export const listAllUsers = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Admin check
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'ADMIN') {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});

/**
 * Admin: Update User
 * 
 * Updates a user's profile (role, status, etc.)
 */
export const updateUser = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Admin check
    const adminDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'ADMIN') {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    const { userId, updates } = data;
    if (!userId || !updates) {
        throw new functions.https.HttpsError('invalid-argument', 'userId and updates required');
    }

    // Prevent self-demotion
    if (userId === context.auth.uid && updates.role && updates.role !== 'ADMIN') {
        throw new functions.https.HttpsError('failed-precondition', 'Cannot demote yourself');
    }

    await db.collection('users').doc(userId).update({
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: context.auth.uid
    });

    return { success: true };
});
