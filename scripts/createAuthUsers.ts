/**
 * Create Initial Firebase Auth Users
 * 
 * This script creates initial users in Firebase Authentication.
 * Run after downloading service account key from Firebase Console.
 * 
 * Usage:
 * 1. Download serviceAccountKey.json from Firebase Console
 * 2. Run: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json npx ts-node scripts/createAuthUsers.ts
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: 'gen-lang-client-0061164735'
});

const db = admin.firestore();

// Initial users to create
const INITIAL_USERS = [
    {
        email: 'admin@manabee.com',
        password: 'Manabee2024!',
        displayName: '管理者',
        role: 'ADMIN',
    },
    {
        email: 'sensei@manabee.com',
        password: 'Manabee2024!',
        displayName: '鈴木先生',
        role: 'TUTOR',
    },
    {
        email: 'mom@manabee.com',
        password: 'Manabee2024!',
        displayName: '山田母',
        role: 'GUARDIAN',
        studentIds: ['student-001', 'student-002'],
    },
    {
        email: 'taro@manabee.com',
        password: 'Manabee2024!',
        displayName: '山田太郎',
        role: 'STUDENT',
        guardianId: 'guardian-001',
        grade: 6,
        avatar: '🎒',
    }
];

async function createUsers() {
    console.log('🔑 Creating Firebase Auth users...\n');

    for (const userData of INITIAL_USERS) {
        try {
            // Check if user already exists
            try {
                const existingUser = await admin.auth().getUserByEmail(userData.email);
                console.log(`⏭️  User ${userData.email} already exists (${existingUser.uid})`);
                continue;
            } catch (e: any) {
                if (e.code !== 'auth/user-not-found') throw e;
            }

            // Create Auth user
            const userRecord = await admin.auth().createUser({
                email: userData.email,
                password: userData.password,
                displayName: userData.displayName,
                emailVerified: true,
            });
            console.log(`✓ Created Auth user: ${userData.email} (${userRecord.uid})`);

            // Create Firestore profile
            const firestoreData: any = {
                id: userRecord.uid,
                email: userData.email,
                name: userData.displayName,
                role: userData.role,
                isActive: true,
                createdAt: new Date().toISOString(),
            };

            if (userData.studentIds) firestoreData.studentIds = userData.studentIds;
            if (userData.guardianId) firestoreData.guardianId = userData.guardianId;
            if (userData.grade) firestoreData.grade = userData.grade;
            if (userData.avatar) firestoreData.avatar = userData.avatar;

            await db.collection('users').doc(userRecord.uid).set(firestoreData);
            console.log(`  ✓ Created Firestore profile for ${userData.email}`);

        } catch (error: any) {
            console.error(`❌ Failed to create ${userData.email}:`, error.message);
        }
    }

    console.log('\n✅ User creation complete!');
    console.log('\n📝 Login credentials:');
    console.log('   Email: admin@manabee.com');
    console.log('   Password: Manabee2024!');
}

createUsers()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
