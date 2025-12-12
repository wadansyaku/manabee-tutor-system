import React from 'react';
import { UserRole } from '../types';
import { ROLE_COLORS } from '../constants';

export const RoleBadge = ({ role }: { role: UserRole }) => {
  const color = ROLE_COLORS[role];
  const label = role === UserRole.TUTOR ? '講師' : role === UserRole.STUDENT ? '生徒' : '保護者';
  
  // Tailwind dynamic classes need to be safe-listed or complete strings. 
  // Using inline styles or a map for simplicity here.
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
    blue: 'bg-blue-100 text-blue-800 ring-blue-600/20',
    teal: 'bg-teal-100 text-teal-800 ring-teal-600/20',
  };

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${colorClasses[color]}`}>
      {label}
    </span>
  );
};