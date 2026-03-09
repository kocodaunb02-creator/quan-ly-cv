import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, X, CheckCircle2 } from 'lucide-react';
import Select from 'react-select';

const sourceOptions = [
    { value: 'Facebook', label: 'Lấy từ nhóm Facebook' },
    { value: 'LinkedIn', label: 'Qua LinkedIn' },
    { value: 'Referral', label: 'Do nhân viên nội bộ giới thiệu' },
    { value: 'Website', label: 'Website Tuyển dụng' },
    { value: 'Khác', label: 'Nguồn khác' }
];

const roleOptions = [
    { value: 'DEV', label: 'Lập trình viên (Dev)' },
    { value: 'ARTIST', label: 'Game Artist' },
    { value: 'DESIGNER', label: 'Game Designer' },
    { value: 'TESTER', label: 'QA/QC Tester' },
    { value: 'ADMONET', label: 'Admonet / C.A.T' },
    { value: 'VIDEO_EDITOR', label: 'Video Editor' }
];

const levelOptions = [
    { value: 'Intern', label: 'Thực tập sinh (Intern)' },
    { value: 'Fresher', label: 'Fresher' },
    { value: 'Junior', label: 'Junior' },
    { value: 'Middle', label: 'Middle' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Lead', label: 'Lead' },
    { value: 'Manager', label: 'Manager' }
];

const schoolOptions = [
    { value: "HUST", label: "Đại học Bách khoa Hà Nội (HUST)" },
    { value: "NEU", label: "Đại học Kinh tế Quốc dân (NEU)" },
    { value: "VNU", label: "Đại học Quốc gia Hà Nội (VNU)" },
    { value: "PTIT", label: "Học viện Công nghệ Bưu chính Viễn thông (PTIT)" },
    { value: "FTU", label: "Đại học Ngoại thương (FTU)" },
    { value: "FPT", label: "Đại học FPT" },
    { value: "KHTN", label: "Đại học Khoa học Tự nhiên (KHTN)" },
    { value: "Khác", label: "Khác / Không có" }
];

const customSelectStyles = {
    control: (base: any, state: any) => ({
        ...base,
        minHeight: '42px',
        backgroundColor: '#f8fafc',
        borderColor: state.isFocused ? '#c7d2fe' : '#e2e8f0',
        borderRadius: '0.5rem',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.5)' : 'none',
        '&:hover': {
            borderColor: state.isFocused ? '#c7d2fe' : '#94a3b8'
        }
    })
};
import apiClient from '../services/apiClient';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [roleCode, setRoleCode] = useState('');
    const [level, setLevel] = useState('');
    const [schoolCode, setSchoolCode] = useState('');
    const [demoLink, setDemoLink] = useState('');
    const [cvSource, setCvSource] = useState('');
    const [salaryOffer, setSalaryOffer] = useState('');
    const [note, setNote] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '');
        if (!rawValue) {
            setSalaryOffer('');
            return;
        }
        const formatted = parseInt(rawValue, 10).toLocaleString('en-US');
        setSalaryOffer(formatted);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setError(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!file) {
            setError('Vui lòng chọn file CV để upload.');
            return;
        }

        if (!name.trim()) {
            setError('Tên ứng viên không được để trống.');
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('cvFile', file);
            if (salaryOffer) {
                formData.append('salary_offer', salaryOffer.replace(/,/g, ''));
            }
            formData.append('name', name);
            if (email) formData.append('email', email);
            if (phone) formData.append('phone', phone);
            if (roleCode) formData.append('role_code', roleCode);
            if (level) formData.append('level', level);
            if (schoolCode) formData.append('school_code', schoolCode);
            if (demoLink) formData.append('demo_link', demoLink);
            if (cvSource) formData.append('cv_source', cvSource);
            if (note) formData.append('note', note);

            await apiClient.post('/candidates/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            // Reset form
            setFile(null);
            setName('');
            setEmail('');
            setPhone('');
            setRoleCode('');
            setLevel('');
            setSchoolCode('');
            setDemoLink('');
            setCvSource('');
            setSalaryOffer('');

            onUploadSuccess();
            onClose();

        } catch (err: any) {
            console.error('Upload Error:', err);
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi upload CV.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity opacity-100"
                onClick={!isLoading ? onClose : undefined}
            ></div>

            {/* Modal Panel */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[680px] flex flex-col max-h-[90vh] overflow-hidden transform transition-all">
                {/* Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Thêm Hồ Sơ Ứng Viên</h3>
                        <p className="text-sm text-slate-500 mt-1">Hệ thống sẽ tự động gán trạng thái Sourcing ban đầu</p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body Form */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-6">

                        {/* File Upload Area */}
                        <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">Upload File CV <span className="text-red-500">*</span></label>

                            {!file ? (
                                <div
                                    className="w-full border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-colors cursor-pointer group"
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <UploadCloud className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-700">Nhấn vào đây hoặc kéo thả file</p>
                                    <p className="text-xs text-slate-500 mt-1">Hỗ trợ định dạng .PDF, .DOCX (Tối đa 10MB)</p>
                                </div>
                            ) : (
                                <div className="w-full border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-lg shadow-sm">
                                            <File className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{file.name}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFile(null)}
                                        className="text-slate-400 hover:text-red-500 p-2"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Full Name */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Họ tên ứng viên <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nhập họ tên..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 text-sm"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Nhập số điện thoại..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 text-sm"
                                />
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Nhập email..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 text-sm"
                                />
                            </div>

                            {/* Nguồn CV */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Nguồn CV</label>
                                <Select
                                    options={sourceOptions}
                                    value={sourceOptions.find(opt => opt.value === cvSource) || null}
                                    onChange={(sel) => setCvSource(sel ? sel.value : '')}
                                    placeholder="Chọn nguồn..."
                                    isClearable
                                    styles={customSelectStyles}
                                />
                            </div>

                            {/* Role */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Vị trí ứng tuyển <span className="text-red-500">*</span></label>
                                <Select
                                    options={roleOptions}
                                    value={roleOptions.find(opt => opt.value === roleCode) || null}
                                    onChange={(sel) => setRoleCode(sel ? sel.value : '')}
                                    placeholder="Chọn vị trí..."
                                    isClearable
                                    styles={customSelectStyles}
                                />
                            </div>

                            {/* Level */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Cấp bậc</label>
                                <Select
                                    options={levelOptions}
                                    value={levelOptions.find(opt => opt.value === level) || null}
                                    onChange={(sel) => setLevel(sel ? sel.value : '')}
                                    placeholder="Chọn cấp bậc..."
                                    isClearable
                                    styles={customSelectStyles}
                                />
                            </div>

                            {/* Demo Link */}
                            <div className="flex flex-col gap-1.5 md:col-span-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Link Demo / Portfolio</label>
                                <input
                                    type="url"
                                    value={demoLink}
                                    onChange={(e) => setDemoLink(e.target.value)}
                                    placeholder="Nhập link..."
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 text-sm"
                                />
                            </div>

                            {/* School */}
                            <div className="flex flex-col gap-1.5 md:col-span-1">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Trường học</label>
                                <Select
                                    options={schoolOptions}
                                    value={schoolOptions.find(opt => opt.value === schoolCode) || null}
                                    onChange={(sel) => setSchoolCode(sel ? sel.value : '')}
                                    placeholder="Chọn trường đại học..."
                                    isClearable
                                    styles={customSelectStyles}
                                />
                            </div>

                            {/* Salary Offer */}
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Mức lương đề xuất (VNĐ)</label>
                                <input
                                    type="text"
                                    value={salaryOffer}
                                    onChange={handleSalaryChange}
                                    placeholder="Vd: 15,000,000"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 text-sm"
                                />
                            </div>

                            {/* Note */}
                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700 ml-1">Ghi chú</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Nhập ghi chú cho ứng viên..."
                                    rows={4}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-700 text-sm resize-y"
                                ></textarea>
                            </div>
                        </div>

                    </form>

                    {/* Error Alerts */}
                    {error && (
                        <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:opacity-50"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        form="upload-form"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-70"
                    >
                        {isLoading ? (
                            <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : <CheckCircle2 className="w-4 h-4" />}
                        Tạo Hồ Sơ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadModal;
