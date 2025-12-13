/**
 * Firestore Seed Data Script
 * 
 * Populates initial data for Manabee Tutor System:
 * - Users (Admin, Tutor, Guardian, Student)
 * - System configuration
 * 
 * Usage: npx ts-node scripts/seedFirestore.ts
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

// User roles matching the app's UserRole enum
const UserRole = {
    ADMIN: 'ADMIN',
    TUTOR: 'TUTOR',
    GUARDIAN: 'GUARDIAN',
    STUDENT: 'STUDENT'
};

// Seed users data
const SEED_USERS = [
    {
        id: 'admin-001',
        email: 'admin@manabee.com',
        name: '管理者',
        role: UserRole.ADMIN,
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'tutor-001',
        email: 'sensei@manabee.com',
        name: '鈴木先生',
        role: UserRole.TUTOR,
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'guardian-001',
        email: 'mom@manabee.com',
        name: '山田母',
        role: UserRole.GUARDIAN,
        studentIds: ['student-001', 'student-002'],
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'student-001',
        email: 'taro@manabee.com',
        name: '山田太郎',
        role: UserRole.STUDENT,
        guardianId: 'guardian-001',
        grade: 6,
        avatar: '🎒',
        isActive: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 'student-002',
        email: 'hanako@manabee.com',
        name: '山田花子',
        role: UserRole.STUDENT,
        guardianId: 'guardian-001',
        grade: 4,
        avatar: '🌸',
        isActive: true,
        createdAt: new Date().toISOString()
    }
];

// System configuration
const SYSTEM_CONFIG = {
    id: 'global',
    maintenanceMode: false,
    maintenanceMessage: 'システムメンテナンス中です。',
    aiRateLimit: 10,
    maxStudentsPerGuardian: 5,
    sessionTimeoutMinutes: 60,
    enableNotifications: true,
    enableAIFeatures: true,
    updatedAt: new Date().toISOString()
};

async function seedDatabase() {
    console.log('🌱 Starting Firestore seed...\n');

    // Seed users
    console.log('👥 Seeding users...');
    for (const user of SEED_USERS) {
        await db.collection('users').doc(user.id).set(user);
        console.log(`  ✓ Created user: ${user.name} (${user.role})`);
    }

    // Seed system config
    console.log('\n⚙️ Seeding system config...');
    await db.collection('system_config').doc('global').set(SYSTEM_CONFIG);
    console.log('  ✓ Created global config');

    // Create sample audit log
    console.log('\n📋 Creating initial audit log...');
    await db.collection('audit_logs').add({
        userId: 'admin-001',
        userName: '管理者',
        userRole: UserRole.ADMIN,
        action: 'system_initialized',
        summary: 'Manabee システム初期化完了',
        at: new Date().toISOString()
    });
    console.log('  ✓ Created initial audit log');

    console.log('\n✅ Seed complete!');
    console.log(`   - ${SEED_USERS.length} users created`);
    console.log('   - System config initialized');
    console.log('   - Initial audit log created');
}

seedDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    });
