import React, { useState } from 'react';
import { User, MonthlyReport } from '../../types';

interface ReportExportProps {
    currentUser: User;
    studentId?: string;
}

type ExportFormat = 'pdf' | 'csv' | 'json';
type ReportType = 'monthly' | 'attendance' | 'homework' | 'study_log';

export const ReportExport: React.FC<ReportExportProps> = ({ currentUser, studentId }) => {
    const [selectedType, setSelectedType] = useState<ReportType>('monthly');
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);

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

        // Simulate export generation delay
        await new Promise(r => setTimeout(r, 1500));

        const filename = `${selectedType}_${selectedMonth}_${currentUser.name}`;

        try {
            switch (selectedFormat) {
                case 'csv': {
                    let data: any[] = [];
                    let headers: string[] = [];

                    if (selectedType === 'monthly') {
                        headers = ['date', 'type', 'subject', 'duration', 'notes'];
                        data = [
                            { date: '2025-12-01', type: '授業', subject: '算数', duration: '120分', notes: '分数の計算' },
                            { date: '2025-12-03', type: '宿題', subject: '国語', duration: '30分', notes: '漢字練習' },
                            { date: '2025-12-05', type: '自習', subject: '理科', duration: '45分', notes: '植物の観察' },
                        ];
                    } else if (selectedType === 'attendance') {
                        headers = ['date', 'startTime', 'endTime', 'duration', 'status', 'amount'];
                        data = [
                            { date: '2025-12-01', startTime: '16:00', endTime: '18:00', duration: '120分', status: '完了', amount: '10000' },
                            { date: '2025-12-08', startTime: '16:00', endTime: '18:00', duration: '120分', status: '完了', amount: '10000' },
                        ];
                    } else if (selectedType === 'homework') {
                        headers = ['title', 'dueDate', 'status', 'estimatedMinutes', 'completedDate'];
                        data = [
                            { title: '算数 計算ドリル P.20-25', dueDate: '2025-12-05', status: '完了', estimatedMinutes: '30', completedDate: '2025-12-04' },
                            { title: '国語 漢字プリント', dueDate: '2025-12-10', status: '未完了', estimatedMinutes: '20', completedDate: '' },
                        ];
                    } else {
                        headers = ['date', 'subject', 'type', 'duration', 'notes'];
                        data = [
                            { date: '2025-12-01', subject: '算数', type: '復習', duration: '45分', notes: '分数の練習' },
                            { date: '2025-12-02', subject: '国語', type: '自習', duration: '30分', notes: '読解練習' },
                        ];
                    }

                    const csv = generateCSV(data, headers);
                    downloadFile(csv, `${filename}.csv`, 'text/csv');
                    break;
                }

                case 'json': {
                    const reportData = {
                        type: selectedType,
                        month: selectedMonth,
                        student: currentUser.name,
                        generatedAt: new Date().toISOString(),
                        data: {
                            totalLessons: 8,
                            totalHours: 16,
                            homeworkCompleted: 19,
                            homeworkAssigned: 24,
                            studyMinutes: 1840,
                        }
                    };
                    downloadFile(JSON.stringify(reportData, null, 2), `${filename}.json`, 'application/json');
                    break;
                }

                case 'pdf': {
                    // For PDF, we'll create an HTML template and open print dialog
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
                            <table>
                                <tr><th>項目</th><th>値</th></tr>
                                <tr><td>授業回数</td><td>8回</td></tr>
                                <tr><td>合計時間</td><td>16時間</td></tr>
                                <tr><td>宿題完了</td><td>19/24件 (79%)</td></tr>
                                <tr><td>自主学習</td><td>30時間40分</td></tr>
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                    📥
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">レポート出力</h2>
                    <p className="text-sm text-gray-500">PDF/CSVでダウンロード</p>
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

            {/* Options */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">出力設定</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">対象月</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">出力形式</label>
                        <div className="flex gap-2">
                            {exportFormats.map(ef => (
                                <button
                                    key={ef.format}
                                    onClick={() => setSelectedFormat(ef.format)}
                                    className={`flex-1 px-4 py-2 rounded-lg border-2 font-medium transition-all ${selectedFormat === ef.format
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    {ef.icon} {ef.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Button */}
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
        </div>
    );
};

export default ReportExport;
