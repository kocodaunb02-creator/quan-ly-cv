import React, { useState } from 'react';
import { Clock, CheckCircle2, UserCircle2, X } from 'lucide-react';
import apiClient from '../services/apiClient';

interface HistoryLog {
    id: number;
    action_type: string;
    old_state?: { name: string; state_code: string };
    new_state?: { name: string; state_code: string };
    cv_states_cv_history_previous_state_idTocv_states?: { name: string; state_code: string };
    cv_states_cv_history_new_state_idTocv_states?: { name: string; state_code: string };
    users?: { name: string; email: string; full_name?: string; username?: string };
    changes_payload?: any;
    change_reason?: string;
    created_at: string;
}

interface CandidateHistoryTimelineProps {
    historyLogs: HistoryLog[];
    candidateId: number | null;
}

const formatCurrency = (value: any) => {
    if (!value || isNaN(value)) return value;
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatKeyName = (key: string) => {
    const keyMap: Record<string, string> = {
        'name': 'Họ và tên',
        'salary_offer': 'Mức lương offer',
        'salary_expectation': 'Mức lương mong muốn',
        'phone': 'Số điện thoại',
        'email': 'Email',
        'level': 'Cấp bậc',
        'experience_years': 'Năm kinh nghiệm',
        'cv_source': 'Nguồn CV',
        'school_name': 'Trường học',
        'role_name': 'Vị trí ứng tuyển',
        'demo_link': 'Link sản phẩm',
        'note': 'Ghi chú',
        'file_name': 'Tên file CV'
    };
    return keyMap[key] || key;
};

const CandidateHistoryTimeline: React.FC<CandidateHistoryTimelineProps> = ({ historyLogs, candidateId }) => {
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
    const [expandedReasonId, setExpandedReasonId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedLogId(prev => prev === id ? null : id);
    };

    const toggleReason = (id: number) => {
        setExpandedReasonId(prev => prev === id ? null : id);
    };

    const handleViewCV = async (filePath: string) => {
        try {
            const response = await apiClient.get(`/candidates/proxy/cv?path=${encodeURIComponent(filePath)}`, {
                responseType: 'blob'
            });

            // Need to set correct mime type to enable browser preview instead of force download
            const contentType = response.headers['content-type'] || 'application/pdf';
            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error('Lỗi khi tải CV:', error);
            alert('Không thể xem file CV. Vui lòng thử lại.');
        }
    };

    if (!historyLogs || historyLogs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200 mt-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-[15px] font-medium text-slate-700">Chưa có lịch sử</h3>
                <p className="text-[13px] text-slate-500 mt-1">Chưa có lịch sử tương tác nào được ghi nhận cho ứng viên này.</p>
            </div>
        );
    }

    return (
        <div className="relative mt-4">
            <div className="text-[11px] font-semibold tracking-wider text-[#888888] font-mono mb-4 uppercase">Lịch sử tương tác kể từ khi nhận CV</div>
            <div className="flex flex-col gap-6 w-full">
                {historyLogs.map((log, index) => {
                    const isLast = index === historyLogs.length - 1;
                    const userName = log.users?.full_name || log.users?.username || log.users?.name || 'Hệ thống';
                    const timeStr = new Date(log.created_at).toLocaleString('vi-VN', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    });

                    // Determine Dot Color & Logic
                    let dotColor = '#888888'; // Default Grey
                    let title = '';
                    const payload = log.changes_payload || {};
                    const oldState = log.cv_states_cv_history_previous_state_idTocv_states;
                    const newState = log.cv_states_cv_history_new_state_idTocv_states;

                    if (log.action_type === 'CHANGE_STATE') {
                        title = `${userName} đã thay đổi trạng thái CV`;
                        if (newState?.state_code === 'Rejected' || newState?.state_code === 'Declined') {
                            dotColor = '#D32F2F'; // Red
                            title = `${userName} từ chối hồ sơ`;
                        } else {
                            dotColor = '#0D6E6E'; // Green
                            if (newState?.state_code === 'Manager_Review') title = `${userName} đánh giá 'Đồng ý vòng CV'`;
                            else if (newState?.state_code === 'Offering') title = `${userName} quyết định 'Đạt Phỏng vấn'`;
                            else if (newState?.state_code === 'Onboarding') title = `Ứng viên 'Đồng ý Offer'`;
                            else title = `${userName} duyệt hồ sơ`;
                        }
                    } else if (log.action_type === 'UPLOAD_CV') {
                        dotColor = '#888888';
                        title = `${userName} tải lên hệ thống CV`;
                    } else if (log.action_type === 'UPDATE_CV') {
                        dotColor = '#888888';
                        title = `${userName} cập nhật hồ sơ`;
                    } else if (log.action_type === 'UPDATE_INFO') {
                        dotColor = '#888888';
                        title = `${userName} cập nhật thông tin cá nhân`;
                    } else {
                        title = `${userName} thao tác trên hệ thống`;
                    }

                    // Pre-process Diffs
                    let diffFields: { key: string; old: any; new: any }[] = [];
                    const excludedFields = ['old_file_path', 'new_file_path', 'old_file_name', 'new_file_name', 'file_name', 'file_path', 'message'];
                    if (payload && typeof payload === 'object') {
                        Object.keys(payload).forEach(key => {
                            if (!excludedFields.includes(key) && payload[key] && payload[key].old !== undefined && payload[key].new !== undefined) {
                                diffFields.push({
                                    key,
                                    old: payload[key].old,
                                    new: payload[key].new
                                });
                            }
                        });
                    }

                    const isExpanded = expandedLogId === log.id;
                    const displayedDiffs = isExpanded ? diffFields : diffFields.slice(0, 3);
                    const hasMoreDiffs = diffFields.length > 3;

                    return (
                        <div key={log.id} className="flex flex-row gap-3 w-full">
                            {/* Left column: Dot and Line */}
                            <div className="flex flex-col items-center w-4 shrink-0 pt-[6px]">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }}></div>
                                {!isLast && <div className="w-[2px] h-full mt-2 bg-slate-200"></div>}
                            </div>

                            {/* Right column: Content */}
                            <div className={`flex flex-col gap-2 w-full ${!isLast ? 'pb-6' : ''}`}>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[13px] font-medium text-[#1A1A1A]">{title}</span>
                                    <span className="text-[12px] text-[#888888]">{timeStr}</span>
                                </div>

                                {/* CASE 1: Status Change Diff */}
                                {log.action_type === 'CHANGE_STATE' && oldState && newState && (
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F9F9F9] rounded-md mt-1 w-fit">
                                        <span className="text-[13px] text-[#666666]">Trạng thái:</span>
                                        <span className="text-[13px] text-[#D32F2F] line-through">{oldState.name}</span>
                                        <span className="text-[13px] text-[#888888]">→</span>
                                        <span className="text-[13px] font-semibold text-[#0D6E6E]">{newState.name}</span>
                                    </div>
                                )}

                                {/* CASE 2: CV Document Update Diff & Link */}
                                {(log.action_type === 'UPLOAD_CV' || log.action_type === 'UPDATE_CV') && (
                                    <div className="flex flex-col gap-2 mt-1">
                                        <div className="flex items-center gap-2 px-3 py-2.5 bg-[#F9F9F9] rounded-md w-fit">
                                            {payload.old_file_path && payload.new_file_path ? (
                                                <>
                                                    <span className="text-[13px] text-[#666666]">CV cũ:</span>
                                                    <button onClick={() => handleViewCV(payload.old_file_path)} className="text-[13px] text-[#0D6E6E] hover:underline font-medium">📎 {payload.old_file_name || 'Bản cũ'}</button>
                                                    <span className="text-[13px] text-[#888888]">→</span>
                                                    <span className="text-[13px] text-[#666666]">CV mới:</span>
                                                    <button onClick={() => handleViewCV(payload.new_file_path)} className="text-[13px] text-[#0D6E6E] hover:underline font-medium">📎 {payload.new_file_name || 'Bản mới'}</button>
                                                </>
                                            ) : payload.cv_url || payload.file_path ? (
                                                <button onClick={() => handleViewCV(payload.cv_url || payload.file_path)} className="text-[13px] text-[#0D6E6E] hover:underline font-medium">📎 {payload.file_name || 'Xem tài liệu đính kèm'}</button>
                                            ) : (
                                                <span className="text-[13px] text-slate-500 italic">Không có tài liệu lưu giữ</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* CASE 3: Multi-field Info Diff */}
                                {diffFields.length > 0 && (
                                    <div className="flex flex-col gap-2 px-3 py-3 bg-[#F9F9F9] rounded-md border border-slate-100 mt-1 w-full max-w-md">
                                        {displayedDiffs.map((diff, i) => {
                                            const isCurrency = diff.key.includes('salary');
                                            return (
                                                <div key={i} className="flex gap-2 items-center">
                                                    <div className="text-[13px] text-[#666666] w-32 shrink-0 truncate" title={formatKeyName(diff.key)}>{formatKeyName(diff.key)}:</div>
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <span className="text-[13px] text-[#D32F2F] line-through truncate">
                                                            {isCurrency ? formatCurrency(diff.old) : (diff.old || 'Trống')}
                                                        </span>
                                                        <span className="text-[13px] text-[#888888] shrink-0">→</span>
                                                        <span className="text-[13px] font-semibold text-[#0D6E6E] truncate">
                                                            {isCurrency ? formatCurrency(diff.new) : (diff.new || 'Trống')}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {hasMoreDiffs && (
                                            <button
                                                onClick={() => toggleExpand(log.id)}
                                                className="mt-1 text-left text-[13px] font-semibold text-[#0D6E6E] hover:underline w-fit"
                                            >
                                                {isExpanded ? 'Thu gọn' : `Xem chi tiết (còn ${diffFields.length - 3} trường thay đổi)`}
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Reject/Note Reason */}
                                {log.change_reason && (
                                    <div className={`mt-1 flex flex-col gap-1 px-3 py-2.5 rounded-md ${dotColor === '#D32F2F' ? 'bg-[#FCE4E4] border border-[#F8BBD0]' : 'bg-[#FAFAFA]'}`}>
                                        <p className={`text-[13px] italic ${dotColor === '#D32F2F' ? 'text-[#D32F2F]' : 'text-[#666666]'}`}>
                                            {!expandedReasonId || expandedReasonId !== log.id
                                                ? log.change_reason.substring(0, 100) + (log.change_reason.length > 100 ? '...' : '')
                                                : log.change_reason}
                                        </p>
                                        {log.change_reason.length > 100 && (
                                            <button
                                                onClick={() => toggleReason(log.id)}
                                                className={`text-left text-[13px] font-semibold underline ${dotColor === '#D32F2F' ? 'text-[#B71C1C]' : 'text-[#0D6E6E]'}`}
                                            >
                                                {expandedReasonId === log.id ? 'Thu gọn' : 'Xem thêm'}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CandidateHistoryTimeline;
