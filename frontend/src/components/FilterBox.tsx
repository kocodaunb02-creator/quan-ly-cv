import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import Select, { MultiValue } from 'react-select';

interface Option {
    value: string;
    label: string;
}

const stateOptions: Option[] = [
    { value: 'Sourcing', label: 'Nguồn CV / Tìm kiếm' },
    { value: 'Manager_Review', label: 'Quản lý Đánh giá' },
    { value: 'Interviewing', label: 'Phỏng vấn' },
    { value: 'Offering', label: 'Đề xuất Lương' },
    { value: 'Rejected', label: 'Từ chối / Bị loại' }
];

const roleOptions: Option[] = [
    { value: 'DEV', label: 'Lập trình viên (Dev)' },
    { value: 'ARTIST', label: 'Game Artist' },
    { value: 'DESIGNER', label: 'Game Designer' },
    { value: 'TESTER', label: 'QA/QC Tester' },
    { value: 'ADMONET', label: 'Admonet / C.A.T' },
    { value: 'VIDEO_EDITOR', label: 'Video Editor' }
];

const levelOptions: Option[] = [
    { value: 'Intern', label: 'Thực tập sinh (Intern)' },
    { value: 'Fresher', label: 'Fresher' },
    { value: 'Junior', label: 'Junior' },
    { value: 'Middle', label: 'Middle' },
    { value: 'Senior', label: 'Senior' },
    { value: 'Lead', label: 'Lead' },
    { value: 'Manager', label: 'Manager' }
];

interface FilterBoxProps {
    initialSearch: string;
    initialState: string;
    initialRole: string;
    initialLevel: string;
    onSearch: (searchTerm: string) => void;
    onStateFilter: (state: string) => void;
    onRoleFilter: (role: string) => void;
    onLevelFilter: (level: string) => void;
    onUploadClick: () => void;
}

const FilterBox: React.FC<FilterBoxProps> = ({
    initialSearch, initialState, initialRole, initialLevel,
    onSearch, onStateFilter, onRoleFilter, onLevelFilter, onUploadClick
}) => {
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    useEffect(() => {
        setSearchTerm(initialSearch);
    }, [initialSearch]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        onSearch(e.target.value);
    };

    const parseOptions = (csv: string, optionsList: Option[]) => {
        if (!csv) return [];
        const values = csv.split(',');
        return optionsList.filter(opt => values.includes(opt.value));
    };

    const handleChangeMulti = (
        newValue: MultiValue<Option>,
        callback: (val: string) => void
    ) => {
        const selectedValues = newValue.map(v => v.value).join(',');
        callback(selectedValues);
    };

    const customStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            minHeight: '42px',
            backgroundColor: 'white',
            borderColor: state.isFocused ? '#6366f1' : '#e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(99, 102, 241, 0.5)' : 'none',
            '&:hover': {
                borderColor: '#6366f1'
            },
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: 'text'
        }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.5rem',
            overflow: 'hidden',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            zIndex: 50
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            fontSize: '0.875rem',
            backgroundColor: state.isSelected ? '#e0e7ff' : state.isFocused ? '#f8fafc' : 'white',
            color: state.isSelected ? '#4f46e5' : '#334155',
            cursor: 'pointer',
            fontWeight: state.isSelected ? 600 : 400,
            '&:active': {
                backgroundColor: '#c7d2fe'
            }
        }),
        multiValue: (provided: any) => ({
            ...provided,
            backgroundColor: '#e0e7ff',
            borderRadius: '0.375rem',
        }),
        multiValueLabel: (provided: any) => ({
            ...provided,
            color: '#4338ca',
            fontSize: '0.75rem',
            fontWeight: 600,
        }),
        multiValueRemove: (provided: any) => ({
            ...provided,
            color: '#4338ca',
            ':hover': {
                backgroundColor: '#c7d2fe',
                color: '#312e81',
                borderRadius: '0 0.375rem 0.375rem 0'
            },
        }),
        placeholder: (provided: any) => ({
            ...provided,
            color: '#94a3b8',
            fontWeight: 400
        })
    };

    return (
        <div className="w-full bg-white rounded-xl p-5 mb-6 shadow-sm border border-slate-200 flex flex-col items-start justify-between gap-5 xl:flex-row xl:items-center">

            {/* Left side filters */}
            <div className="flex flex-col md:flex-row items-end gap-4 w-full xl:w-auto flex-wrap flex-1">
                {/* Search Bar */}
                <div className="relative w-full md:w-72 flex flex-col gap-1.5 min-w-[200px]">
                    <label className="text-xs font-semibold text-slate-600 block">Tìm kiếm</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700"
                            placeholder="Tên, SĐT, Email"
                        />
                    </div>
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap items-center gap-3 w-full md:flex-1 min-w-[250px]">
                    {/* Status Filter */}
                    <div className="relative w-full sm:w-56 flex flex-col gap-1.5 flex-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-slate-600 block">Trạng thái</label>
                        <Select
                            isMulti
                            options={stateOptions}
                            value={parseOptions(initialState, stateOptions)}
                            onChange={(val) => handleChangeMulti(val, onStateFilter)}
                            placeholder="Tất cả trạng thái"
                            styles={customStyles}
                            className="w-full"
                            closeMenuOnSelect={false}
                        />
                    </div>

                    {/* Role Filter */}
                    <div className="relative w-full sm:w-56 flex flex-col gap-1.5 flex-1 min-w-[200px]">
                        <label className="text-xs font-semibold text-slate-600 block">Vị trí (Role)</label>
                        <Select
                            isMulti
                            options={roleOptions}
                            value={parseOptions(initialRole, roleOptions)}
                            onChange={(val) => handleChangeMulti(val, onRoleFilter)}
                            placeholder="Tất cả vị trí"
                            styles={customStyles}
                            className="w-full"
                            closeMenuOnSelect={false}
                        />
                    </div>

                    {/* Level Filter */}
                    <div className="relative w-full sm:w-48 flex flex-col gap-1.5 flex-1 min-w-[180px]">
                        <label className="text-xs font-semibold text-slate-600 block">Cấp bậc</label>
                        <Select
                            isMulti
                            options={levelOptions}
                            value={parseOptions(initialLevel, levelOptions)}
                            onChange={(val) => handleChangeMulti(val, onLevelFilter)}
                            placeholder="Tất cả cấp bậc"
                            styles={customStyles}
                            className="w-full"
                            closeMenuOnSelect={false}
                        />
                    </div>
                </div>
            </div>

            {/* Right side actions */}
            <div className="w-full xl:w-auto flex justify-end shrink-0">
                <button
                    onClick={onUploadClick}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm shadow-indigo-600/20 w-full md:w-auto"
                >
                    <Plus className="w-4 h-4" />
                    Thêm CV Mới
                </button>
            </div>
        </div>
    );
};

export default FilterBox;
