/**
 * Quick Seed: Create Firestore profiles for existing Firebase Auth users
 * Uses Firebase REST API (no service account needed)
 */

const FIREBASE_API_KEY = 'AIzaSyBb9Tul5kkPu_-u-8rKeZ9mkqmeveVjvJg';
const PROJECT_ID = 'gen-lang-client-0061164735';

// User data with their Firebase Auth UIDs
const USERS = [
    {
        uid: 'poK3JSBvAHZ3haIf9qOrXahLam73',
        email: 'admin@manabee.com',
        name: '管理者',
        role: 'ADMIN'
    },
    {
        uid: 'y2gV3ru2TiPjlcYkW5CKkSrjoQ93',
        email: 'sensei@manabee.com',
        name: '鈴木先生',
        role: 'TUTOR'
    },
    {
        uid: 'AJy03366MYSk7wRqTAt6r721ELp2',
        email: 'mom@manabee.com',
        name: '山田母',
        role: 'GUARDIAN',
        studentIds: ['6TfehtpfCHXU9XmoFhm1os9ZsH23']
    },
    {
        uid: '6TfehtpfCHXU9XmoFhm1os9ZsH23',
        email: 'taro@manabee.com',
        name: '山田太郎',
        role: 'STUDENT',
        guardianId: 'AJy03366MYSk7wRqTAt6r721ELp2',
        grade: 6,
        avatar: '🎒'
    }
];

async function createFirestoreProfiles() {
    console.log('🔥 Creating Firestore profiles...\n');

    // Get admin token for writes
    const loginResp = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@manabee.com',
                password: 'Manabee2024!',
                returnSecureToken: true
            })
        }
    );
    const loginData = await loginResp.json();

    if (loginData.error) {
        console.error('❌ Login failed:', loginData.error.message);
        return;
    }

    const idToken = loginData.idToken;
    console.log('✓ Authenticated as admin\n');

    // Create profiles
    for (const user of USERS) {
        const firestoreData = {
            fields: {
                id: { stringValue: user.uid },
                email: { stringValue: user.email },
                name: { stringValue: user.name },
                role: { stringValue: user.role },
                isActive: { booleanValue: true },
                createdAt: { stringValue: new Date().toISOString() }
            }
        };

        if (user.studentIds) {
            firestoreData.fields.studentIds = {
                arrayValue: { values: user.studentIds.map(id => ({ stringValue: id })) }
            };
        }
        if (user.guardianId) {
            firestoreData.fields.guardianId = { stringValue: user.guardianId };
        }
        if (user.grade) {
            firestoreData.fields.grade = { integerValue: user.grade.toString() };
        }
        if (user.avatar) {
            firestoreData.fields.avatar = { stringValue: user.avatar };
        }

        const resp = await fetch(
            `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${user.uid}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(firestoreData)
            }
        );

        if (resp.ok) {
            console.log(`✓ Created: ${user.name} (${user.role})`);
        } else {
            const err = await resp.json();
            console.error(`❌ Failed: ${user.email}`, err.error?.message || err);
        }
    }

    // Create system config
    const configData = {
        fields: {
            maintenanceMode: { booleanValue: false },
            aiRateLimit: { integerValue: '10' },
            enableAIFeatures: { booleanValue: true },
            updatedAt: { stringValue: new Date().toISOString() }
        }
    };

    const configResp = await fetch(
        `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/system_config/global`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify(configData)
        }
    );

    if (configResp.ok) {
        console.log('\n✓ System config created');
    }

    console.log('\n✅ Firestore setup complete!');
}

createFirestoreProfiles().catch(console.error);
