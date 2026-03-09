import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, Edit2, FileText, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

export interface Candidate {
    id: number;
    name: string;
    email: string | null;
    phone: string | null;
    cv_original_name: string | null;
    cv_file_size: number | null;
    demo_link: string | null;
    level: string | null;
    salary_offer: number | null;
    created_at: string;
    candidate_roles?: { name: string; role_code: string; };
    cv_states?: { name: string; state_code: string; };
    teams?: { name: string; };
    schools?: { name: string; };
    assigned_team_id?: number | null;
}

interface CandidateTableProps {
    candidates: Candidate[];
    isLoading: boolean;
    onViewDetail: (id: number) => void;
    onEdit?: (id: number) => void;
    onDelete?: (id: number) => void;
    currentPage: number;
    itemsPerPage: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

const getStatusColor = (stateCode: string) => {
    switch (stateCode) {
        case 'Sourcing': return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'HR_Screening': return 'bg-blue-100 text-blue-700 border-blue-200';
        case 'Manager_Review': return 'bg-purple-100 text-purple-700 border-purple-200';
        case 'Interviewing': return 'bg-orange-100 text-orange-700 border-orange-200';
        case 'Offering': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
        case 'Onboarding': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
};

const CandidateTable: React.FC<CandidateTableProps> = ({
    candidates,
    isLoading,
    onViewDetail,
    onEdit,
    onDelete,
    currentPage,
    itemsPerPage,
    totalRecords,
    onPageChange,
    onLimitChange
}) => {
    const { user } = useAuth();
    const canViewSalary = user?.permissions.includes('VIEW_SALARY');
    const hasFullAccess = user?.permissions.includes('MANAGE_ALL_CANDIDATES');
    const isManager = user?.permissions.includes('MANAGE_TEAM_CANDIDATES');
    const [openDropdownId, setOpenDropdownId] = React.useState<number | null>(null);

    React.useEffect(() => {
        const handleClickOutside = () => setOpenDropdownId(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="w-full h-64 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm font-medium text-slate-500">Đang tải dữ liệu...</span>
                </div>
            </div>
        );
    }

    if (candidates.length === 0) {
        return (
            <div className="w-full h-64 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center gap-2">
                <FileText className="w-10 h-10 text-slate-300" />
                <p className="text-slate-500 font-medium">Không tìm thấy ứng viên nào.</p>
            </div>
        );
    }

    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalRecords);

    const generatePageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Họ và tên</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vị trí</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cấp bậc</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Team</th>
                            {canViewSalary && (
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Mức lương ĐX</th>
                            )}
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {candidates.map((candidate) => {
                            const isUnassigned = !candidate.assigned_team_id;
                            const isRejectedOrSourcing = ['Sourcing', 'Rejected'].includes(candidate.cv_states?.state_code || '');
                            const isMyTeam = candidate.assigned_team_id === user?.teamId;

                            let canAction = hasFullAccess;
                            if (!hasFullAccess && isManager) {
                                if (isUnassigned || isRejectedOrSourcing || isMyTeam) {
                                    canAction = true;
                                }
                            }

                            return (
                                <tr key={candidate.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-800">{candidate.name}</span>
                                            <span className="text-xs text-slate-500 mt-0.5">{candidate.email || 'Không có email'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-slate-700 font-medium">{candidate.candidate_roles?.name || 'Chưa định dạng'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-slate-600 font-semibold">{candidate.level || 'Chưa rõ'}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded border ${getStatusColor(candidate.cv_states?.state_code || '')}`}>
                                            {candidate.cv_states?.name || 'Sourcing'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-slate-600">{candidate.teams?.name || '---'}</span>
                                    </td>
                                    {canViewSalary && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {candidate.salary_offer ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(candidate.salary_offer) : 'Chưa nhập'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center gap-2 justify-end">
                                            <button
                                                onClick={() => onViewDetail(candidate.id)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                            >
                                                <Eye className="w-4 h-4" />
                                                <span className="text-xs font-semibold">Xem</span>
                                            </button>
                                            <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => setOpenDropdownId(openDropdownId === candidate.id ? null : candidate.id)}
                                                    className={`p-1.5 rounded-lg transition-colors ${openDropdownId === candidate.id ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100'}`}
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {openDropdownId === candidate.id && (
                                                    <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-100 py-1.5 z-20 overflow-hidden font-sans">
                                                        {canAction && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenDropdownId(null);
                                                                        if (onEdit) onEdit(candidate.id);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2.5 transition-colors"
                                                                >
                                                                    <Edit2 className="w-4 h-4 text-slate-500" />
                                                                    <span className="font-medium">Sửa hồ sơ</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setOpenDropdownId(null);
                                                                        if (onDelete) onDelete(candidate.id);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5 transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                    <span className="font-medium">Xóa hồ sơ</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        {!canAction && (
                                                            <div className="px-4 py-2 text-xs text-slate-400 italic">Không có quyền thao tác</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => onLimitChange(Number(e.target.value))}
                                className="appearance-none bg-white border border-slate-200 text-slate-800 font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer text-sm transition-all"
                            >
                                <option value={10}>10 / trang</option>
                                <option value={20}>20 / trang</option>
                                <option value={50}>50 / trang</option>
                                <option value={100}>100 / trang</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </div>
                    <span>Hiển thị <span className="font-semibold text-slate-700">{totalRecords > 0 ? startIndex + 1 : 0}</span> - <span className="font-semibold text-slate-700">{endIndex}</span> trong số <span className="font-semibold text-slate-700">{totalRecords}</span> ứng viên</span>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {generatePageNumbers().map((page, idx) => (
                            <button
                                key={idx}
                                onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                                disabled={page === '...'}
                                className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${page === currentPage
                                    ? 'bg-indigo-600 text-white font-bold border border-indigo-600 shadow-sm shadow-indigo-600/20'
                                    : page === '...'
                                        ? 'text-slate-400 cursor-default'
                                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateTable;
