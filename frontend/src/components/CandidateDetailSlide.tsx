import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, UserCircle2, Download, ExternalLink } from 'lucide-react';
import apiClient from '../services/apiClient';
import { Candidate } from './CandidateTable';
import CandidateHistoryTimeline from './CandidateHistoryTimeline';

interface SlideProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: number | null;
    onStatusChange: () => void;
    onEdit: (id: number) => void;
}

interface HistoryLog {
    id: number;
    action_type: string;
    old_state?: { name: string; state_code: string };
    new_state?: { name: string; state_code: string };
    cv_states_cv_history_previous_state_idTocv_states?: { name: string; state_code: string };
    cv_states_cv_history_new_state_idTocv_states?: { name: string; state_code: string };
    users?: { name: string; email: string };
    changes_payload?: any;
    created_at: string;
}

const getStatusColor = (stateCode: string) => {
    switch (stateCode) {
        case 'Sourcing': return 'bg-slate-100 text-slate-700';
        case 'HR_Screening': return 'bg-teal-50 text-teal-700';
        case 'Manager_Review': return 'bg-purple-50 text-purple-700';
        case 'Interviewing': return 'bg-orange-50 text-orange-700';
        case 'Offering': return 'bg-indigo-50 text-indigo-700';
        case 'Onboarding': return 'bg-emerald-50 text-emerald-700';
        case 'Rejected': return 'bg-red-50 text-red-700';
        default: return 'bg-slate-100 text-slate-700';
    }
};

const CandidateDetailSlide: React.FC<SlideProps> = ({ isOpen, onClose, candidateId, onStatusChange, onEdit }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'eval' | 'history'>('info');
    const [candidateData, setCandidateData] = useState<Candidate | null>(null);
    const [viewTimestamp, setViewTimestamp] = useState<string | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const [activeAction, setActiveAction] = useState<{
        type: 'state' | 'assign' | 'assign_and_state';
        targetState?: string;
        label: string;
        actionClass: string;
    } | null>(null);
    const [actionNote, setActionNote] = useState('');
    const [isSubmittingAction, setIsSubmittingAction] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const [historyLogs, setHistoryLogs] = useState<HistoryLog[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    useEffect(() => {
        if (isOpen && candidateId) {
            fetchDetail();
            // Always fetch history because the Stepper UI needs the timestamps
            fetchHistory();
        } else {
            setCandidateData(null);
            setViewTimestamp(null);
            setHistoryLogs([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, candidateId, activeTab]);

    const fetchDetail = async () => {
        if (!candidateId) return;
        setIsLoadingData(true);
        try {
            const res = await apiClient.get(`/candidates/${candidateId}`);
            setCandidateData(res.data.data);
            setViewTimestamp(res.data.data.updated_at);
        } catch (error) {
            console.error("Failed to fetch detail:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const fetchHistory = async () => {
        if (!candidateId) return;
        setIsLoadingHistory(true);
        try {
            const res = await apiClient.get(`/history/candidates/${candidateId}`);
            setHistoryLogs(res.data.data);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleActionClick = (
        type: 'state' | 'assign' | 'assign_and_state',
        label: string,
        actionClass: string,
        targetState?: string
    ) => {
        if (activeAction?.label === label) {
            // Toggle off if clicking the same action again
            setActiveAction(null);
            setActionNote('');
            setActionError(null);
        } else {
            setActiveAction({ type, label, actionClass, targetState });
            setActionNote('');
            setActionError(null);
        }
    };

    const submitAction = async () => {
        if (!activeAction || !candidateId) return;
        setIsSubmittingAction(true);
        setActionError(null);

        try {
            if (activeAction.type === 'state' && activeAction.targetState) {
                await apiClient.post(`/workflow/candidates/${candidateId}/state`, {
                    new_state_code: activeAction.targetState,
                    note: actionNote,
                    view_timestamp: viewTimestamp
                });
            } else if (activeAction.type === 'assign') {
                await apiClient.post(`/workflow/candidates/${candidateId}/assign`, {
                    note: actionNote,
                    view_timestamp: viewTimestamp
                });
            } else if (activeAction.type === 'assign_and_state' && activeAction.targetState) {
                // Execute Assign first
                await apiClient.post(`/workflow/candidates/${candidateId}/assign`, {
                    note: 'Hệ thống tự động gán lúc Duyệt hồ sơ.',
                    view_timestamp: viewTimestamp
                });

                // Fetch fresh updated_at timestamp since the assign action changed it
                const freshRes = await apiClient.get(`/candidates/${candidateId}`);
                const freshTimestamp = freshRes.data.data.updated_at;

                // Then Transition State
                await apiClient.post(`/workflow/candidates/${candidateId}/state`, {
                    new_state_code: activeAction.targetState,
                    note: actionNote,
                    view_timestamp: freshTimestamp
                });
            }

            // Success: Reset UI and refresh everything
            setActiveAction(null);
            setActionNote('');
            onStatusChange(); // Update parent dashboard

            // Reload local data
            await fetchDetail();
            // Stepper needs history log timestamps always
            await fetchHistory();

        } catch (err: any) {
            console.error("Action error:", err);
            if (err.response?.status === 409) {
                setActionError('Hồ sơ này vừa có sự thay đổi thông tin hoặc trạng thái từ người dùng khác. Dữ liệu mới nhất đang được tải lại.');
                // Auto refresh
                await fetchDetail();
                await fetchHistory();
                setTimeout(() => setActiveAction(null), 4000); // Clear action UI after 4 seconds of showing error
            } else {
                setActionError(err.response?.data?.message || 'Có lỗi xảy ra khi thực hiện hành động này.');
            }
        } finally {
            setIsSubmittingAction(false);
        }
    };

    const getAvailableActions = (): Array<{
        label: string;
        actionClass: string;
        type: 'state' | 'assign' | 'assign_and_state';
        targetState?: string;
    }> => {
        if (!candidateData || !candidateData.cv_states) return [];
        const currentState = candidateData.cv_states.state_code;

        switch (currentState) {
            case 'Sourcing':
                return [
                    { label: 'Từ chối', actionClass: 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400', type: 'state', targetState: 'Rejected' },
                    { label: 'Đạt Sơ loại', actionClass: 'bg-[#0D6E6E] text-white hover:bg-[#0a5a5a]', type: 'state', targetState: 'Manager_Review' } // Direct to Manager Review to match business doc
                ];
            case 'HR_Screening':
                return [
                    { label: 'Từ chối', actionClass: 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400', type: 'state', targetState: 'Rejected' },
                    { label: 'Duyệt hồ sơ', actionClass: 'bg-[#0D6E6E] text-white hover:bg-[#0a5a5a]', type: 'assign_and_state', targetState: 'Manager_Review' }
                ];
            case 'Manager_Review':
                return [
                    { label: 'Từ chối', actionClass: 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400', type: 'state', targetState: 'Rejected' },
                    { label: 'Duyệt hồ sơ', actionClass: 'bg-[#0D6E6E] text-white hover:bg-[#0a5a5a]', type: 'assign_and_state', targetState: 'Interviewing' }
                ];
            case 'Interviewing':
                return [
                    { label: 'Loại (Fail)', actionClass: 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400', type: 'state', targetState: 'Rejected' },
                    { label: 'Đạt Phỏng vấn', actionClass: 'bg-[#0D6E6E] text-white hover:bg-[#0a5a5a]', type: 'state', targetState: 'Offering' }
                ];
            case 'Offering':
                return [
                    { label: 'Từ chối Offer', actionClass: 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400', type: 'state', targetState: 'Rejected' },
                    { label: 'Đồng ý Offer', actionClass: 'bg-[#0D6E6E] text-white hover:bg-[#0a5a5a]', type: 'state', targetState: 'Onboarding' }
                ];
            case 'Rejected':
                return [
                    { label: 'Khôi phục (Revert)', actionClass: 'bg-emerald-600 text-white hover:bg-emerald-700 border-none', type: 'state', targetState: 'Manager_Review' }
                ];
            case 'Onboarding':
                return []; // No actions from Onboarding right now
            default:
                return [];
        }
    };

    if (!isOpen) return null;

    const roleName = candidateData?.candidate_roles?.name || candidateData?.candidate_roles?.role_code || 'Chưa định dạng';
    const stateName = candidateData?.cv_states?.name || candidateData?.cv_states?.state_code || 'Sourcing';

    // Role Authorization Logic
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userPermissions = currentUser?.permissions || [];
    const userTeamId = currentUser?.teamId || null;

    const hasFullAccess = userPermissions.includes('MANAGE_ALL_CANDIDATES');
    const isManager = userPermissions.includes('MANAGE_TEAM_CANDIDATES');

    const isMyTeam = candidateData?.assigned_team_id === userTeamId;
    const isUnassigned = !candidateData?.assigned_team_id;
    const isRejectedOrSourcing = ['Sourcing', 'Rejected'].includes(candidateData?.cv_states?.state_code || '');

    let canAction = hasFullAccess;
    if (!hasFullAccess && isManager) {
        if (isUnassigned || isRejectedOrSourcing || isMyTeam) {
            canAction = true;
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            <div className="absolute inset-y-0 right-0 max-w-[600px] w-full flex">
                <div className="w-full h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out translate-x-0">

                    {/* Header */}
                    <div className="px-8 py-6 bg-[#FAFAFA] border-b border-slate-100 flex items-center justify-between shrink-0">
                        {isLoadingData || !candidateData ? (
                            <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
                        ) : (
                            <div className="flex items-center gap-6">
                                <h2 className="text-2xl font-medium font-serif text-[#1A1A1A]">{candidateData.name}</h2>
                                {canAction && (
                                    <button
                                        onClick={() => candidateId && onEdit(candidateId)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-[#0D6E6E] hover:text-[#0D6E6E] text-[#888888] transition-colors"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                        </svg>
                                        <span className="text-[13px] font-semibold text-[#0D6E6E]">Chỉnh sửa</span>
                                    </button>
                                )}
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-white flex flex-col gap-8">
                        {isLoadingData || !candidateData ? (
                            <div className="flex-1 flex justify-center items-center h-full">
                                <svg className="animate-spin h-8 w-8 text-teal-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : (
                            <>
                                {/* Process Stepper */}
                                <div className="mb-4 mt-2">
                                    <div className="relative flex items-start justify-between w-full">
                                        {/* Back line structure */}
                                        <div className="absolute top-[11px] left-[10%] right-[10%] h-[2px] bg-slate-200 z-0 overflow-hidden">
                                            {(() => {
                                                const stepperNodes = [
                                                    { key: 'Sourcing', label: 'Tiếp nhận CV' },
                                                    { key: 'HR_Screening', label: 'Sơ loại HR' },
                                                    { key: 'Manager_Review', label: 'Quản lý Đánh giá' },
                                                    { key: 'Interviewing', label: 'Phỏng vấn' },
                                                    { key: 'Offering', label: 'Đề xuất Lương' }
                                                ];

                                                const currentState = candidateData.cv_states?.state_code || 'Sourcing';
                                                const isRejected = currentState === 'Rejected';

                                                const getStepTimestamp = (stateCode: string) => {
                                                    const logs = historyLogs.filter(log => log.cv_states_cv_history_new_state_idTocv_states?.state_code === stateCode);
                                                    if (logs.length > 0) {
                                                        const earliest = logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
                                                        return new Date(earliest.created_at);
                                                    }
                                                    if (stateCode === 'Sourcing' && candidateData) {
                                                        return new Date(candidateData.created_at);
                                                    }
                                                    return null;
                                                };

                                                let currentStepIndex = stepperNodes.findIndex(n => n.key === currentState);
                                                if (currentState === 'Onboarding') currentStepIndex = stepperNodes.length;
                                                if (currentStepIndex === -1 && isRejected) {
                                                    const reachedKeys = stepperNodes.map(n => n.key).filter(k => getStepTimestamp(k) !== null);
                                                    const lastReachedKey = reachedKeys[reachedKeys.length - 1] || 'Sourcing';
                                                    currentStepIndex = stepperNodes.findIndex(n => n.key === lastReachedKey);
                                                }

                                                // Determine width of active connection line
                                                const progressWidth = `${Math.min(100, (currentStepIndex / (stepperNodes.length - 1)) * 100)}%`;

                                                return (
                                                    <div
                                                        className="h-full bg-[#0D6E6E] transition-all duration-300 ease-in-out"
                                                        style={{ width: progressWidth }}
                                                    ></div>
                                                );
                                            })()}
                                        </div>
                                        {(() => {
                                            const stepperNodes = [
                                                { key: 'Sourcing', label: 'Tiếp nhận CV' },
                                                { key: 'HR_Screening', label: 'Sơ loại HR' },
                                                { key: 'Manager_Review', label: 'Quản lý Đánh giá' },
                                                { key: 'Interviewing', label: 'Phỏng vấn' },
                                                { key: 'Offering', label: 'Đề xuất Lương' }
                                            ];

                                            // Determine timestamps and current index
                                            const getStepTimestamp = (stateCode: string) => {
                                                const logs = historyLogs.filter(log => log.cv_states_cv_history_new_state_idTocv_states?.state_code === stateCode);
                                                if (logs.length > 0) {
                                                    const earliest = logs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
                                                    return new Date(earliest.created_at);
                                                }
                                                if (stateCode === 'Sourcing' && candidateData) {
                                                    return new Date(candidateData.created_at);
                                                }
                                                return null;
                                            };

                                            const currentState = candidateData.cv_states?.state_code || 'Sourcing';
                                            const isRejected = currentState === 'Rejected';

                                            // To determine where to put the red mark, find latest positive state before rejection
                                            // by scanning history, or just mark all reached steps, and the last reached one gets red if rejected.
                                            let currentStepIndex = stepperNodes.findIndex(n => n.key === currentState);
                                            if (currentState === 'Onboarding') currentStepIndex = stepperNodes.length;
                                            if (currentStepIndex === -1 && isRejected) {
                                                // Find the last reached valid step
                                                const reachedKeys = stepperNodes.map(n => n.key).filter(k => getStepTimestamp(k) !== null);
                                                const lastReachedKey = reachedKeys[reachedKeys.length - 1] || 'Sourcing';
                                                currentStepIndex = stepperNodes.findIndex(n => n.key === lastReachedKey);
                                            }

                                            return stepperNodes.map((node, index) => {
                                                const timestamp = getStepTimestamp(node.key);
                                                const isCompleted = index < currentStepIndex;
                                                const isCurrent = index === currentStepIndex && !isRejected;
                                                const isFailurePoint = index === currentStepIndex && isRejected;
                                                const isFuture = !isCompleted && !isCurrent && !isFailurePoint;

                                                let iconColor = "bg-slate-200 text-slate-400"; // Future
                                                let textColor = "text-slate-400";

                                                if (isCompleted) {
                                                    iconColor = "bg-[#0D6E6E] text-white";
                                                    textColor = "text-[#1A1A1A]";
                                                } else if (isCurrent) {
                                                    iconColor = "bg-[#0D6E6E] text-white ring-4 ring-teal-50";
                                                    textColor = "text-[#0D6E6E] font-semibold";
                                                } else if (isFailurePoint) {
                                                    iconColor = "bg-red-500 text-white ring-4 ring-red-50";
                                                    textColor = "text-red-600 font-semibold";
                                                }

                                                const formattedTime = timestamp
                                                    ? timestamp.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : '--';

                                                return (
                                                    <div key={node.key} className="relative z-10 flex flex-col items-center gap-2 flex-1">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${iconColor}`}>
                                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : isFailurePoint ? <X className="w-4 h-4" /> : (index + 1)}
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className={`text-[13px] text-center whitespace-nowrap mt-1 ${textColor}`}>
                                                                {node.label}
                                                            </span>
                                                            <span className="text-[11px] text-slate-500 font-mono mt-0.5 whitespace-nowrap">
                                                                {formattedTime}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex border-b border-slate-100 gap-8">
                                    <button
                                        onClick={() => setActiveTab('info')}
                                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'info'
                                            ? 'border-[#0D6E6E] text-[#0D6E6E]'
                                            : 'border-transparent text-[#888888] hover:text-[#1A1A1A]'
                                            }`}
                                    >
                                        Thông tin
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('history')}
                                        className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'history'
                                            ? 'border-[#0D6E6E] text-[#0D6E6E]'
                                            : 'border-transparent text-[#888888] hover:text-[#1A1A1A]'
                                            }`}
                                    >
                                        Lịch sử
                                    </button>
                                </div>

                                {/* Tab Contents */}
                                <div className="flex-1 w-full">
                                    {activeTab === 'info' && (
                                        <div className="flex flex-col gap-8">
                                            {/* Basic Info Grid */}
                                            <div className="grid grid-cols-3 gap-y-6 gap-x-4 w-full">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs text-[#888888]">Ngày nhận CV</span>
                                                    <span className="text-sm font-medium text-[#1A1A1A]">{new Date(candidateData.created_at).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs text-[#888888]">Nguồn CV</span>
                                                    <span className="text-sm font-medium text-[#1A1A1A]">{(candidateData as any).cv_source || 'Chưa có'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs text-[#888888]">Trường học</span>
                                                    <span className="text-sm font-medium text-[#1A1A1A]">{candidateData.schools?.name || 'Tự do'}</span>
                                                </div>

                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs text-[#888888]">Email</span>
                                                    <span className="text-sm font-medium text-[#1A1A1A]">{candidateData.email || 'Chưa cập nhật'}</span>
                                                </div>
                                                <div className="flex flex-col gap-1.5 ">
                                                    <span className="text-xs text-[#888888]">Số điện thoại</span>
                                                    <span className="text-sm font-medium text-[#1A1A1A]">{candidateData.phone || 'Chưa cập nhật'}</span>
                                                </div>
                                                <div></div>

                                                <div className="flex flex-col gap-1.5">
                                                    <span className="text-xs text-[#888888]">Offer (Chỉ HR)</span>
                                                    <span className="text-sm font-semibold text-[#0D6E6E]">
                                                        {candidateData.salary_offer
                                                            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(candidateData.salary_offer)
                                                            : 'Chưa nhập'}
                                                    </span>
                                                </div>
                                                <div className="col-span-2 flex flex-col gap-1.5">
                                                    <span className="text-xs text-[#888888]">Ghi chú</span>
                                                    <span className="text-sm text-[#1A1A1A] whitespace-pre-wrap">{(candidateData as any).note || 'Không có ghi chú'}</span>
                                                </div>
                                            </div>

                                            {/* Links Section */}
                                            <div className="flex flex-col gap-4 mt-4">
                                                <h4 className="text-[11px] font-semibold tracking-wider text-[#888888] font-mono">HỒ SƠ ĐÍNH KÈM & LINKS</h4>
                                                <div className="flex flex-col gap-3">
                                                    <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg border border-slate-100">
                                                        <div className="flex items-center gap-3">
                                                            <Download className="w-5 h-5 text-slate-400" />
                                                            <span className="text-sm font-medium text-[#1A1A1A]">{candidateData.cv_original_name || 'Bản CV'}</span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (!candidateId) return;
                                                                const token = localStorage.getItem('token');
                                                                window.open(`/api/candidates/${candidateId}/cv?token=${token}`, '_blank');
                                                            }}
                                                            className="text-[13px] text-[#666666] hover:text-[#1A1A1A] transition-colors"
                                                        >
                                                            Xem / Tải xuống
                                                        </button>
                                                    </div>

                                                    {candidateData.demo_link && (
                                                        <div className="flex items-center justify-between p-4 bg-[#FAFAFA] rounded-lg border border-slate-100">
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <ExternalLink className="w-5 h-5 text-slate-400 shrink-0" />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-sm font-medium text-[#1A1A1A]">Link Demo / Portfolio</span>
                                                                    <span className="text-[13px] text-[#888888] truncate" title={candidateData.demo_link}>
                                                                        {candidateData.demo_link}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <a href={candidateData.demo_link} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-[#0D6E6E] hover:underline">
                                                                Mở liên kết
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'history' && (
                                        <CandidateHistoryTimeline
                                            historyLogs={historyLogs as any}
                                            candidateId={candidateId}
                                        />
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer Actions */}
                    {candidateData && (
                        <div className="border-t border-slate-200 bg-white shrink-0">
                            {/* Inline Expand Input Area */}
                            {activeAction && (
                                <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex flex-col gap-3 transition-all animate-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-semibold text-slate-700">
                                            Lý do / Ghi chú cho hành động: <span className="text-[#0D6E6E]">{activeAction.label}</span>
                                        </label>
                                        <button
                                            onClick={() => setActiveAction(null)}
                                            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                            disabled={isSubmittingAction}
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <textarea
                                        value={actionNote}
                                        onChange={(e) => setActionNote(e.target.value)}
                                        placeholder="Nhập lý do hoặc ghi chú (tùy chọn)..."
                                        rows={2}
                                        disabled={isSubmittingAction}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm text-slate-700 resize-none"
                                    ></textarea>
                                    {actionError && (
                                        <span className="text-xs font-medium text-red-600">{actionError}</span>
                                    )}
                                    <div className="flex justify-end gap-2 mt-1">
                                        <button
                                            onClick={() => setActiveAction(null)}
                                            disabled={isSubmittingAction}
                                            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                                        >
                                            Hủy bỏ
                                        </button>
                                        <button
                                            onClick={submitAction}
                                            disabled={isSubmittingAction}
                                            className="px-4 py-2 text-xs font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0a5a5a] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                                        >
                                            {isSubmittingAction ? (
                                                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                                            ) : (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            )}
                                            Xác nhận
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons Row */}
                            {!canAction ? (
                                <div className="px-8 py-5 bg-orange-50/50 border-t border-orange-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                            <ExternalLink className="w-4 h-4 text-orange-600" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-orange-800">Chỉ xem (Read-only)</span>
                                            <span className="text-xs text-orange-600">
                                                Hồ sơ này đang được phụ trách bởi {candidateData.teams?.name || 'một phòng ban khác'}. Bạn không có quyền thao tác.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-8 py-5 flex items-center justify-end gap-3 flex-wrap">
                                    {getAvailableActions().map((action, idx) => {
                                        const isActive = activeAction?.label === action.label;
                                        // Make button visually depressed and distinct if active
                                        const activeStyles = isActive ? 'ring-2 ring-offset-2 ring-indigo-500 opacity-90' : '';
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleActionClick(action.type as any, action.label, action.actionClass, action.targetState)}
                                                className={`py-2.5 px-5 text-sm font-semibold rounded-lg transition-all border ${action.actionClass} ${activeStyles}`}
                                            >
                                                {action.label}
                                            </button>
                                        );
                                    })}
                                    {getAvailableActions().length === 0 && (
                                        <span className="text-sm text-slate-500 italic py-2.5">Không có hành động khả dụng cho luồng này.</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CandidateDetailSlide;
