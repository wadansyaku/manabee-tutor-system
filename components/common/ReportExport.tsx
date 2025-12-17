import React, { useState, useEffect } from 'react';
import { User, MonthlyReport, UserRole } from '../../types';

interface ReportExportProps {
    currentUser: User;
    studentId?: string;
}

type ExportFormat = 'pdf' | 'csv' | 'json';
type ReportType = 'monthly' | 'attendance' | 'homework' | 'study_log';
type ViewMode = 'export' | 'preview';

interface ReportData {
    type: ReportType;
    month: string;
    student: string;
    generatedAt: string;
    summary: {
        totalLessons: number;
        totalHours: number;
        homeworkCompleted: number;
        homeworkAssigned: number;
        studyMinutes: number;
        completionRate: number;
        xpGained: number;
    };
    details: any[];
}

export const ReportExport: React.FC<ReportExportProps> = ({ currentUser, studentId }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('preview');
    const [selectedType, setSelectedType] = useState<ReportType>('monthly');
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [reportData, setReportData] = useState<ReportData | null>(null);

    const reportTypes: { type: ReportType; label: string; icon: string; description: string }[] = [
        { type: 'monthly', label: '月次レポート', icon: '📊', description: '月間の学習サマリー' },
        { type: 'attendance', label: '勤怠レポート', icon: '📅', description: '授業記録一覧' },
        { type: 'homework', label: '宿題レポート', icon: '📝', description: '宿題完了状況' },
        { type: 'study_log', label: '学習ログ', icon: '📚', description: '自主学習記録' },
    ];

    const exportFormats: { format: ExportFormat; label: string; icon: string }[] = [
        { format: 'pdf', label: 'PDF', icon: '📄' },
        { format: 'csv', label: 'CSV', icon: '📊' },
        { format: 'json', label: 'JSON', icon: '{ }' },
    ];

    // Load report data for preview
    useEffect(() => {
        if (viewMode === 'preview') {
            loadReportData();
        }
    }, [viewMode, selectedType, selectedMonth]);

    const loadReportData = async () => {
        setIsLoading(true);

        // Simulate API call - in production this would fetch from Firestore
        await new Promise(r => setTimeout(r, 500));

        const isFirebaseMode = import.meta.env.VITE_APP_MODE === 'firebase';

        // Generate sample data based on report type
        let details: any[] = [];
        let summary = {
            totalLessons: 8,
            totalHours: 16,
            homeworkCompleted: 19,
            homeworkAssigned: 24,
            studyMinutes: 1840,
            completionRate: 79,
            xpGained: 450
        };

        if (selectedType === 'monthly') {
            details = [
                { date: '2025-12-01', type: '授業', subject: '算数', duration: '120分', notes: '分数の計算' },
                { date: '2025-12-03', type: '宿題', subject: '国語', duration: '30分', notes: '漢字練習' },
                { date: '2025-12-05', type: '自習', subject: '理科', duration: '45分', notes: '植物の観察' },
                { date: '2025-12-08', type: '授業', subject: '算数', duration: '120分', notes: '小数の計算' },
                { date: '2025-12-10', type: '宿題', subject: '算数', duration: '25分', notes: '計算ドリル' },
            ];
        } else if (selectedType === 'attendance') {
            details = [
                { date: '2025-12-01', startTime: '16:00', endTime: '18:00', duration: '120分', status: '完了', amount: '¥10,000' },
                { date: '2025-12-08', startTime: '16:00', endTime: '18:00', duration: '120分', status: '完了', amount: '¥10,000' },
                { date: '2025-12-15', startTime: '16:00', endTime: '18:00', duration: '120分', status: '完了', amount: '¥10,000' },
                { date: '2025-12-22', startTime: '16:00', endTime: '18:00', duration: '120分', status: '予定', amount: '¥10,000' },
            ];
        } else if (selectedType === 'homework') {
            details = [
                { title: '算数 計算ドリル P.20-25', dueDate: '2025-12-05', status: '完了', estimatedMinutes: 30, completedDate: '2025-12-04' },
                { title: '国語 漢字プリント', dueDate: '2025-12-10', status: '完了', estimatedMinutes: 20, completedDate: '2025-12-09' },
                { title: '理科 観察レポート', dueDate: '2025-12-15', status: '進行中', estimatedMinutes: 45, completedDate: '' },
                { title: '算数 文章題', dueDate: '2025-12-20', status: '未着手', estimatedMinutes: 30, completedDate: '' },
            ];
            summary.homeworkCompleted = details.filter(d => d.status === '完了').length;
            summary.homeworkAssigned = details.length;
            summary.completionRate = Math.round((summary.homeworkCompleted / summary.homeworkAssigned) * 100);
        } else {
            details = [
                { date: '2025-12-01', subject: '算数', type: '復習', duration: '45分', notes: '分数の練習' },
                { date: '2025-12-02', subject: '国語', type: '自習', duration: '30分', notes: '読解練習' },
                { date: '2025-12-04', subject: '英語', type: '予習', duration: '40分', notes: '単語暗記' },
                { date: '2025-12-07', subject: '理科', type: '復習', duration: '35分', notes: '実験まとめ' },
            ];
            summary.studyMinutes = details.reduce((acc, d) => acc + parseInt(d.duration), 0);
        }

        setReportData({
            type: selectedType,
            month: selectedMonth,
            student: currentUser.name,
            generatedAt: new Date().toISOString(),
            summary,
            details
        });

        setIsLoading(false);
    };

    const generateCSV = (data: any[], headers: string[]): string => {
        const headerRow = headers.join(',');
        const dataRows = data.map(row =>
            headers.map(h => `"${row[h] || ''}"`).join(',')
        );
        return [headerRow, ...dataRows].join('\n');
    };

    const downloadFile = (content: string, filename: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setExportSuccess(false);

        await new Promise(r => setTimeout(r, 1000));

        const filename = `${selectedType}_${selectedMonth}_${currentUser.name}`;

        try {
            if (!reportData) {
                await loadReportData();
            }

            switch (selectedFormat) {
                case 'csv': {
                    const headers = Object.keys(reportData?.details[0] || {});
                    const csv = generateCSV(reportData?.details || [], headers);
                    downloadFile(csv, `${filename}.csv`, 'text/csv');
                    break;
                }

                case 'json': {
                    downloadFile(JSON.stringify(reportData, null, 2), `${filename}.json`, 'application/json');
                    break;
                }

                case 'pdf': {
                    const printContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>${reportTypes.find(r => r.type === selectedType)?.label} - ${selectedMonth}</title>
                            <style>
                                body { font-family: sans-serif; padding: 40px; }
                                h1 { color: #4F46E5; }
                                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                th { background: #F3F4F6; }
                                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
                                .logo { font-size: 24px; font-weight: bold; }
                                .meta { color: #6B7280; font-size: 14px; }
                                .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                                .stat { background: #F3F4F6; padding: 15px; border-radius: 8px; text-align: center; }
                                .stat-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
                                .stat-label { font-size: 12px; color: #6B7280; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <div class="logo">🐝 Manabee</div>
                                <div class="meta">生成日: ${new Date().toLocaleDateString('ja-JP')}</div>
                            </div>
                            <h1>${reportTypes.find(r => r.type === selectedType)?.label}</h1>
                            <p>期間: ${selectedMonth}</p>
                            <p>生徒: ${currentUser.name}</p>
                            <div class="stats">
                                <div class="stat"><div class="stat-value">${reportData?.summary.totalLessons}</div><div class="stat-label">授業回数</div></div>
                                <div class="stat"><div class="stat-value">${reportData?.summary.totalHours}h</div><div class="stat-label">学習時間</div></div>
                                <div class="stat"><div class="stat-value">${reportData?.summary.completionRate}%</div><div class="stat-label">宿題完了率</div></div>
                                <div class="stat"><div class="stat-value">+${reportData?.summary.xpGained}</div><div class="stat-label">獲得XP</div></div>
                            </div>
                            <table>
                                <tr>${Object.keys(reportData?.details[0] || {}).map(k => `<th>${k}</th>`).join('')}</tr>
                                ${reportData?.details.map(row => `<tr>${Object.values(row).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}
                            </table>
                        </body>
                        </html>
                    `;

                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                        printWindow.document.write(printContent);
                        printWindow.document.close();
                        printWindow.print();
                    }
                    break;
                }
            }

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 3000);

        } catch (error) {
            console.error('Export error:', error);
            alert('エクスポートに失敗しました');
        }

        setIsExporting(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case '完了': return 'bg-green-100 text-green-700';
            case '進行中': return 'bg-yellow-100 text-yellow-700';
            case '予定': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                        📊
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">レポート</h2>
                        <p className="text-sm text-gray-500">閲覧・ダウンロード</p>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'preview'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        👁️ プレビュー
                    </button>
                    <button
                        onClick={() => setViewMode('export')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'export'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        📥 ダウンロード
                    </button>
                </div>
            </div>

            {/* Report Type Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">レポートタイプ</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {reportTypes.map(rt => (
                        <button
                            key={rt.type}
                            onClick={() => setSelectedType(rt.type)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${selectedType === rt.type
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <span className="text-2xl block mb-2">{rt.icon}</span>
                            <p className="font-medium text-gray-900">{rt.label}</p>
                            <p className="text-xs text-gray-500">{rt.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Month Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">対象月:</label>
                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>

            {/* Preview Mode */}
            {viewMode === 'preview' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-gray-500">レポートを読み込み中...</p>
                        </div>
                    ) : reportData ? (
                        <>
                            {/* Summary Cards */}
                            <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                <h3 className="text-lg font-bold mb-4">{reportTypes.find(r => r.type === selectedType)?.label} - {selectedMonth}</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-white/20 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-bold">{reportData.summary.totalLessons}</p>
                                        <p className="text-sm opacity-80">授業回数</p>
                                    </div>
                                    <div className="bg-white/20 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-bold">{reportData.summary.totalHours}h</p>
                                        <p className="text-sm opacity-80">学習時間</p>
                                    </div>
                                    <div className="bg-white/20 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-bold">{reportData.summary.completionRate}%</p>
                                        <p className="text-sm opacity-80">完了率</p>
                                    </div>
                                    <div className="bg-white/20 rounded-xl p-4 text-center">
                                        <p className="text-3xl font-bold">+{reportData.summary.xpGained}</p>
                                        <p className="text-sm opacity-80">獲得XP</p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Table */}
                            <div className="p-6">
                                <h4 className="font-bold text-gray-900 mb-4">詳細データ</h4>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 text-gray-600">
                                            <tr>
                                                {Object.keys(reportData.details[0] || {}).map(key => (
                                                    <th key={key} className="px-4 py-3 text-left font-medium">
                                                        {key === 'date' ? '日付' :
                                                            key === 'type' ? 'タイプ' :
                                                                key === 'subject' ? '科目' :
                                                                    key === 'duration' ? '時間' :
                                                                        key === 'notes' ? 'メモ' :
                                                                            key === 'status' ? 'ステータス' :
                                                                                key === 'title' ? 'タイトル' :
                                                                                    key === 'dueDate' ? '期限' :
                                                                                        key === 'completedDate' ? '完了日' :
                                                                                            key}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {reportData.details.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    {Object.entries(row).map(([key, value], j) => (
                                                        <td key={j} className="px-4 py-3">
                                                            {key === 'status' ? (
                                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(String(value))}`}>
                                                                    {String(value)}
                                                                </span>
                                                            ) : (
                                                                String(value) || '-'
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            <span className="text-4xl block mb-2">📋</span>
                            データがありません
                        </div>
                    )}
                </div>
            )}

            {/* Export Mode */}
            {viewMode === 'export' && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">出力形式</h3>
                        <div className="flex gap-2">
                            {exportFormats.map(ef => (
                                <button
                                    key={ef.format}
                                    onClick={() => setSelectedFormat(ef.format)}
                                    className={`flex-1 px-4 py-3 rounded-lg border-2 font-medium transition-all ${selectedFormat === ef.format
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {ef.icon} {ef.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className={`w-full py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${isExporting
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : exportSuccess
                                ? 'bg-green-500 text-white'
                                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg'
                            }`}
                    >
                        {isExporting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                生成中...
                            </>
                        ) : exportSuccess ? (
                            <>
                                ✅ ダウンロード完了！
                            </>
                        ) : (
                            <>
                                📥 {selectedFormat.toUpperCase()}でダウンロード
                            </>
                        )}
                    </button>
                </>
            )}
        </div>
    );
};

export default ReportExport;

