// Firebase Storage Service for Photo Upload
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp, getApps } from 'firebase/app';

// Firebase config
const getFirebaseConfig = () => ({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
});

// Initialize Storage (lazy)
const getStorageInstance = () => {
    const config = getFirebaseConfig();
    if (!config.apiKey) {
        throw new Error('Firebase not configured');
    }

    let app;
    if (getApps().length === 0) {
        app = initializeApp(config);
    } else {
        app = getApps()[0];
    }

    return getStorage(app);
};

// Check if Firebase mode is enabled
const isFirebaseMode = () => {
    return import.meta.env.VITE_APP_MODE === 'firebase';
};

/**
 * Upload a question photo to Firebase Storage
 * @param file The file to upload
 * @param studentId Student's user ID
 * @param questionId Unique question ID
 * @returns Download URL of the uploaded photo
 */
export const uploadQuestionPhoto = async (
    file: File,
    studentId: string,
    questionId: string
): Promise<string> => {
    if (!isFirebaseMode()) {
        // Local mode: Convert to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    try {
        const storage = getStorageInstance();
        const timestamp = Date.now();
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `questions/${studentId}/${questionId}_${timestamp}.${ext}`;

        const storageRef = ref(storage, path);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
            customMetadata: {
                studentId,
                questionId,
                uploadedAt: new Date().toISOString()
            }
        });

        // Get download URL
        const downloadUrl = await getDownloadURL(snapshot.ref);
        return downloadUrl;
    } catch (error) {
        console.error('Photo upload failed:', error);
        throw error;
    }
};

/**
 * Compress image before upload (optional, for large images)
 */
export const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Compression failed'));
                    }
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = URL.createObjectURL(file);
    });
};

/**
     * Upload a profile photo
     */
export const uploadProfilePhoto = async (
    file: File,
    userId: string
): Promise<string> => {
    if (!isFirebaseMode()) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    try {
        const storage = getStorageInstance();
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `profiles/${userId}/avatar.${ext}`;

        const storageRef = ref(storage, path);

        const snapshot = await uploadBytes(storageRef, file, {
            contentType: file.type,
            customMetadata: {
                userId,
                uploadedAt: new Date().toISOString()
            }
        });

        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error('Profile photo upload failed:', error);
        throw error;
    }
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (path: string): Promise<void> => {
    if (!isFirebaseMode()) {
        console.log('Local mode: delete simulated for', path);
        return;
    }

    try {
        const { deleteObject } = await import('firebase/storage');
        const storage = getStorageInstance();
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
    } catch (error) {
        console.error('File delete failed:', error);
        throw error;
    }
};

/**
 * Upload with progress tracking
 */
export const uploadWithProgress = async (
    file: File,
    path: string,
    onProgress?: (progress: number) => void
): Promise<string> => {
    if (!isFirebaseMode()) {
        if (onProgress) onProgress(100);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    try {
        const { uploadBytesResumable } = await import('firebase/storage');
        const storage = getStorageInstance();
        const storageRef = ref(storage, path);

        return new Promise((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) onProgress(progress);
                },
                (error) => {
                    console.error('Upload error:', error);
                    reject(error);
                },
                async () => {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                }
            );
        });
    } catch (error) {
        console.error('Upload with progress failed:', error);
        throw error;
    }
};

export default {
    uploadQuestionPhoto,
    uploadProfilePhoto,
    uploadWithProgress,
    compressImage,
    deleteFile,
    isFirebaseMode
};
