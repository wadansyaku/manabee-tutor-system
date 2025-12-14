"use strict";
/**
 * Manabee Tutor System - Cloud Functions
 *
 * Secure server-side implementation for AI features and admin operations.
 * All sensitive operations (API keys, rate limiting, user management) are handled here.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserCreated = exports.cleanupRateLimits = exports.registerFcmToken = exports.sendNotification = exports.analyzeQuestion = exports.updateUser = exports.listAllUsers = exports.getUsageStats = exports.generateLessonContent = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const genai_1 = require("@google/genai");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// Rate limiting configuration
const RATE_LIMIT_DAILY = 10; // requests per user per day
const RATE_LIMIT_COLLECTION = 'rate_limits';
// AI Model configuration
const MODEL_NAME = 'gemini-2.5-flash';
// Helper: Get AI client (API key from environment)
const getAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;
    if (!apiKey) {
        throw new functions.https.HttpsError('failed-precondition', 'Gemini API key not configured');
    }
    return new genai_1.GoogleGenAI({ apiKey });
};
// Helper: Check rate limit for user
const checkRateLimit = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    const limitRef = db.collection(RATE_LIMIT_COLLECTION).doc(`${userId}_${today}`);
    const doc = await limitRef.get();
    const current = doc.exists ? (doc.data()?.count || 0) : 0;
    if (current >= RATE_LIMIT_DAILY) {
        throw new functions.https.HttpsError('resource-exhausted', `Daily AI request limit (${RATE_LIMIT_DAILY}) exceeded. Try again tomorrow.`);
    }
    // Increment counter
    await limitRef.set({ count: current + 1, updatedAt: new Date().toISOString() }, { merge: true });
};
// Helper: Log API usage
const logApiUsage = async (userId, functionName) => {
    await db.collection('api_usage_logs').add({
        userId,
        functionName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        date: new Date().toISOString().split('T')[0]
    });
};
// Schemas for structured output
const summarySchema = {
    type: genai_1.Type.OBJECT,
    properties: {
        lesson_goal: { type: genai_1.Type.STRING, description: 'The main goal of this lesson' },
        what_we_did: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING }, description: 'List of topics covered' },
        what_went_well: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING }, description: 'Things the student did well' },
        issues: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING }, description: 'Areas where student struggled' },
        next_actions: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING }, description: 'Action items for next time' },
        parent_message: { type: genai_1.Type.STRING, description: 'A polite message to the guardian (max 200 chars)' },
        quiz_focus: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING }, description: 'Key topics to quiz on' },
    },
    required: ['lesson_goal', 'what_we_did', 'what_went_well', 'issues', 'next_actions', 'parent_message', 'quiz_focus']
};
const homeworkSchema = {
    type: genai_1.Type.OBJECT,
    properties: {
        items: {
            type: genai_1.Type.ARRAY,
            items: {
                type: genai_1.Type.OBJECT,
                properties: {
                    title: { type: genai_1.Type.STRING },
                    due_days_from_now: { type: genai_1.Type.INTEGER },
                    type: { type: genai_1.Type.STRING, enum: ['practice', 'review', 'challenge'] },
                    estimated_minutes: { type: genai_1.Type.INTEGER }
                },
                required: ['title', 'due_days_from_now', 'type', 'estimated_minutes']
            }
        }
    }
};
const quizSchema = {
    type: genai_1.Type.OBJECT,
    properties: {
        questions: {
            type: genai_1.Type.ARRAY,
            items: {
                type: genai_1.Type.OBJECT,
                properties: {
                    type: { type: genai_1.Type.STRING, enum: ['mcq', 'short'] },
                    q: { type: genai_1.Type.STRING },
                    choices: { type: genai_1.Type.ARRAY, items: { type: genai_1.Type.STRING } },
                    answer: { type: genai_1.Type.STRING },
                    explain: { type: genai_1.Type.STRING }
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
exports.generateLessonContent = functions.https.onCall(async (data, context) => {
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
    }
    catch (error) {
        console.error('AI Generation Error:', error);
        throw new functions.https.HttpsError('internal', `AI generation failed: ${error.message}`);
    }
});
/**
 * Get Usage Stats (Admin Only)
 *
 * Returns API usage statistics for admin monitoring.
 */
exports.getUsageStats = functions.https.onCall(async (data, context) => {
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
    const byUser = {};
    const byFunction = {};
    const byDate = {};
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
exports.listAllUsers = functions.https.onCall(async (data, context) => {
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
exports.updateUser = functions.https.onCall(async (data, context) => {
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
/**
 * Analyze Question Image (Firestore Trigger)
 *
 * Automatically analyzes a question when it's created with an image.
 * Uses Gemini Vision to understand the question and generate an initial analysis.
 */
exports.analyzeQuestion = functions.firestore
    .document('questions/{questionId}')
    .onCreate(async (snap, context) => {
    const question = snap.data();
    const questionId = context.params.questionId;
    // Skip if already processed or no image
    if (question.status !== 'queued' || !question.imageUrl) {
        console.log(`Skipping question ${questionId}: status=${question.status}, hasImage=${!!question.imageUrl}`);
        return null;
    }
    try {
        const ai = getAIClient();
        // Update status to processing
        await snap.ref.update({
            status: 'processing',
            processingStartedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Analyze with Gemini Vision
        const analysisResult = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `この画像は小学6年生の生徒からの質問です。以下の形式で分析してください:
1. 教科と単元の特定
2. 問題の要点
3. つまずきポイントの推測
4. 簡潔なヒント（答えは書かない）

画像の問題を分析してください。`
                        },
                        { inlineData: { mimeType: 'image/jpeg', data: question.imageBase64 || '' } }
                    ]
                }
            ],
            config: {
                temperature: 0.3,
                maxOutputTokens: 500
            }
        });
        const analysis = analysisResult.text || '分析できませんでした';
        // Update with analysis result
        await snap.ref.update({
            status: 'analyzed',
            aiAnalysis: analysis,
            analyzedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Log usage
        await logApiUsage(question.studentId || 'system', 'analyzeQuestion');
        console.log(`Question ${questionId} analyzed successfully`);
        return { success: true, questionId };
    }
    catch (error) {
        console.error(`Error analyzing question ${questionId}:`, error);
        await snap.ref.update({
            status: 'error',
            error: error.message,
            errorAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: false, error: error.message };
    }
});
/**
 * Send Push Notification (Callable)
 *
 * Sends FCM push notifications to users.
 */
exports.sendNotification = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { targetUserId, title, body, url, type } = data;
    if (!targetUserId || !title || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'targetUserId, title, and body required');
    }
    // Get target user's FCM tokens
    const userDoc = await db.collection('users').doc(targetUserId).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Target user not found');
    }
    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];
    if (tokens.length === 0) {
        console.log(`No FCM tokens for user ${targetUserId}`);
        return { success: true, sent: 0, message: 'No tokens registered' };
    }
    // Build notification payload
    const message = {
        notification: {
            title,
            body
        },
        data: {
            url: url || '/',
            type: type || 'general',
            timestamp: new Date().toISOString()
        },
        tokens
    };
    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        // Store notification in Firestore
        await db.collection('notifications').add({
            targetUserId,
            senderId: context.auth.uid,
            title,
            body,
            url,
            type,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            successCount: response.successCount,
            failureCount: response.failureCount
        });
        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const invalidTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
                    invalidTokens.push(tokens[idx]);
                }
            });
            if (invalidTokens.length > 0) {
                const validTokens = tokens.filter(t => !invalidTokens.includes(t));
                await db.collection('users').doc(targetUserId).update({ fcmTokens: validTokens });
            }
        }
        return {
            success: true,
            sent: response.successCount,
            failed: response.failureCount
        };
    }
    catch (error) {
        console.error('FCM send error:', error);
        throw new functions.https.HttpsError('internal', `Failed to send notification: ${error.message}`);
    }
});
/**
 * Register FCM Token (Callable)
 *
 * Registers a user's FCM token for push notifications.
 */
exports.registerFcmToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const { token } = data;
    if (!token) {
        throw new functions.https.HttpsError('invalid-argument', 'FCM token required');
    }
    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User not found');
    }
    const existingTokens = userDoc.data()?.fcmTokens || [];
    if (!existingTokens.includes(token)) {
        await userRef.update({
            fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    return { success: true };
});
/**
 * Cleanup Rate Limits (Scheduled)
 *
 * Runs daily to clean up old rate limit documents.
 */
exports.cleanupRateLimits = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async () => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep 7 days of history
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    const snapshot = await db.collection(RATE_LIMIT_COLLECTION).get();
    const batch = db.batch();
    let deleteCount = 0;
    snapshot.docs.forEach(doc => {
        // Document ID format: userId_YYYY-MM-DD
        const datePart = doc.id.split('_').pop();
        if (datePart && datePart < cutoffStr) {
            batch.delete(doc.ref);
            deleteCount++;
        }
    });
    if (deleteCount > 0) {
        await batch.commit();
        console.log(`Cleaned up ${deleteCount} old rate limit documents`);
    }
    return null;
});
/**
 * On User Created (Auth Trigger)
 *
 * Creates a user profile in Firestore when a new Firebase Auth user is created.
 */
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
    const { uid, email, displayName } = user;
    await db.collection('users').doc(uid).set({
        email: email || '',
        name: displayName || email?.split('@')[0] || 'New User',
        role: 'STUDENT', // Default role, admin can change
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        mustChangePassword: true
    });
    console.log(`Created user profile for ${uid}`);
    return null;
});
//# sourceMappingURL=index.js.map