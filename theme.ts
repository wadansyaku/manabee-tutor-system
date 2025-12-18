import { UserRole } from './types';

interface RoleTheme {
    gradient: string;
    bgLight: string;
    borderColor: string;
}

const roleThemes: Record<UserRole, RoleTheme> = {
    [UserRole.STUDENT]: { gradient: 'from-emerald-500 to-teal-500', bgLight: 'bg-emerald-50', borderColor: 'border-emerald-200' },
    [UserRole.GUARDIAN]: { gradient: 'from-rose-500 to-pink-500', bgLight: 'bg-rose-50', borderColor: 'border-rose-200' },
    [UserRole.TUTOR]: { gradient: 'from-blue-500 to-indigo-500', bgLight: 'bg-blue-50', borderColor: 'border-blue-200' },
    [UserRole.ADMIN]: { gradient: 'from-gray-600 to-gray-800', bgLight: 'bg-gray-100', borderColor: 'border-gray-300' },
};

export const getTheme = (role: UserRole): RoleTheme => {
    return roleThemes[role] || { gradient: 'from-indigo-500 to-purple-500', bgLight: 'bg-indigo-50', borderColor: 'border-indigo-200' };
};

export default getTheme;
