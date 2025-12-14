// Student Selector Component for Guardians and Tutors
import React from 'react';
import { User, UserRole } from '../types';

interface Student {
    id: string;
    name: string;
    avatar?: string;
    grade?: string;
}

interface StudentSelectorProps {
    students: Student[];
    selectedStudentId: string;
    onSelectStudent: (studentId: string) => void;
    currentUser: User;
}

// Mock students for demo - in production, this would come from Firestore
export const MOCK_STUDENTS: Student[] = [
    { id: 's1', name: '山田太郎', grade: '小6', avatar: '👦' },
    { id: 's2', name: '山田花子', grade: '小4', avatar: '👧' },
];

export const StudentSelector: React.FC<StudentSelectorProps> = ({
    students,
    selectedStudentId,
    onSelectStudent,
    currentUser
}) => {
    // Only show for guardians and tutors
    if (currentUser.role !== UserRole.GUARDIAN && currentUser.role !== UserRole.TUTOR) {
        return null;
    }

    if (students.length <= 1) {
        return null; // Don't show if only one child
    }

    const selectedStudent = students.find(s => s.id === selectedStudentId);
    const label = currentUser.role === UserRole.GUARDIAN ? 'お子様を選択' : '生徒を選択';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
            <div className="flex gap-2 flex-wrap">
                {students.map(student => (
                    <button
                        key={student.id}
                        onClick={() => onSelectStudent(student.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition font-semibold ${selectedStudentId === student.id
                            ? currentUser.role === UserRole.TUTOR
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                                : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <span className="text-xl">{student.avatar || '👤'}</span>
                        <div className="text-left">
                            <p className="text-sm">{student.name}</p>
                            {student.grade && (
                                <p className={`text-xs ${selectedStudentId === student.id ? 'opacity-80' : 'text-gray-500'}`}>
                                    {student.grade}
                                </p>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {selectedStudent && (
                <p className="mt-3 text-sm text-gray-600">
                    <span className="text-xl mr-1">{selectedStudent.avatar}</span>
                    <span className="font-semibold">{selectedStudent.name}</span>さんのデータを表示中
                </p>
            )}
        </div>
    );
};

// Compact version for sidebar/header
export const StudentSelectorCompact: React.FC<StudentSelectorProps> = ({
    students,
    selectedStudentId,
    onSelectStudent,
    currentUser
}) => {
    if ((currentUser.role !== UserRole.GUARDIAN && currentUser.role !== UserRole.TUTOR) || students.length <= 1) {
        return null;
    }

    const isTutor = currentUser.role === UserRole.TUTOR;
    const bgClass = isTutor
        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
        : 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100';
    const arrowClass = isTutor ? 'text-blue-500' : 'text-pink-500';

    return (
        <div className="relative">
            <select
                value={selectedStudentId}
                onChange={(e) => onSelectStudent(e.target.value)}
                className="appearance-none bg-pink-50 border border-pink-200 rounded-lg px-3 py-1.5 pr-8 text-sm font-semibold text-pink-700 cursor-pointer hover:bg-pink-100 transition"
            >
                {students.map(student => (
                    <option key={student.id} value={student.id}>
                        {student.avatar} {student.name}
                    </option>
                ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-pink-500">▼</span>
        </div>
    );
};

export default StudentSelector;
