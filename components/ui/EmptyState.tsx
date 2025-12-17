import React from 'react';

interface EmptyStateProps {
    icon?: string;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    size?: 'sm' | 'md' | 'lg';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = '📭',
    title,
    description,
    actionLabel,
    onAction,
    size = 'md'
}) => {
    const sizeClasses = {
        sm: 'py-6',
        md: 'py-12',
        lg: 'py-20'
    };

    const iconSizes = {
        sm: 'text-3xl',
        md: 'text-5xl',
        lg: 'text-7xl'
    };

    return (
        <div className={`text-center ${sizeClasses[size]} animate-fade-in`}>
            <span className={`${iconSizes[size]} block mb-4`}>{icon}</span>
            <h3 className="text-lg font-bold text-gray-700 mb-2">{title}</h3>
            {description && (
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-4">{description}</p>
            )}
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

// Specific empty states for common use cases
export const NoDataState: React.FC<{ message?: string }> = ({ message }) => (
    <EmptyState
        icon="📊"
        title="データがありません"
        description={message || "まだデータが登録されていません。"}
    />
);

export const NoStudentsState: React.FC<{ onAdd?: () => void }> = ({ onAdd }) => (
    <EmptyState
        icon="👤"
        title="生徒が登録されていません"
        description="生徒を追加して学習管理を始めましょう。"
        actionLabel={onAdd ? "生徒を追加" : undefined}
        onAction={onAdd}
    />
);

export const NoHomeworkState: React.FC = () => (
    <EmptyState
        icon="✅"
        title="宿題がありません"
        description="現在、割り当てられた宿題はありません。"
    />
);

export const NoLessonsState: React.FC = () => (
    <EmptyState
        icon="📚"
        title="授業記録がありません"
        description="授業を行うと、ここに記録が表示されます。"
    />
);

export const NoQuestionsState: React.FC = () => (
    <EmptyState
        icon="❓"
        title="質問がありません"
        description="まだ質問が投稿されていません。"
    />
);

export const LoadingState: React.FC<{ message?: string }> = ({ message }) => (
    <div className="text-center py-12 animate-fade-in">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-500">{message || "読み込み中..."}</p>
    </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({ message, onRetry }) => (
    <EmptyState
        icon="⚠️"
        title="エラーが発生しました"
        description={message || "データの読み込みに失敗しました。"}
        actionLabel={onRetry ? "再試行" : undefined}
        onAction={onRetry}
    />
);
