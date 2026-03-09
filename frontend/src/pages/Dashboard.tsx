import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import TopNavbar from '../components/TopNavbar';
import FilterBox from '../components/FilterBox';
import CandidateTable, { Candidate } from '../components/CandidateTable';
import UploadModal from '../components/UploadModal';
import UpdateModal from '../components/UpdateModal';
import CandidateDetailSlide from '../components/CandidateDetailSlide';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const Dashboard: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isDetailSlideOpen, setIsDetailSlideOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
    const [candidateToDeleteName, setCandidateToDeleteName] = useState<string | undefined>(undefined);

    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
    const [itemsPerPage, setItemsPerPage] = useState(Number(searchParams.get('limit')) || 10);
    const [totalRecords, setTotalRecords] = useState(0);

    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [stateFilter, setStateFilter] = useState(searchParams.get('state') || '');
    const [roleFilter, setRoleFilter] = useState(searchParams.get('role') || '');
    const [levelFilter, setLevelFilter] = useState(searchParams.get('level') || '');

    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const params = new URLSearchParams();
        if (currentPage > 1) params.set('page', currentPage.toString());
        if (itemsPerPage !== 10) params.set('limit', itemsPerPage.toString());
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (stateFilter) params.set('state', stateFilter);
        if (roleFilter) params.set('role', roleFilter);
        if (levelFilter) params.set('level', levelFilter);
        setSearchParams(params, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, itemsPerPage, debouncedSearch, stateFilter, roleFilter, levelFilter]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, stateFilter, roleFilter, levelFilter]);

    const fetchCandidates = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/candidates', {
                params: {
                    page: currentPage,
                    limit: itemsPerPage,
                    search: debouncedSearch || undefined,
                    state: stateFilter || undefined,
                    role: roleFilter || undefined,
                    level: levelFilter || undefined
                }
            });
            setCandidates(response.data.data);
            setTotalRecords(response.data.meta?.total || 0);
        } catch (error) {
            console.error("Failed to fetch candidates:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCandidates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, itemsPerPage, debouncedSearch, stateFilter, roleFilter, levelFilter]);

    const handleViewDetail = (id: number) => {
        setSelectedCandidateId(id);
        setIsDetailSlideOpen(true);
    };

    const handleDeleteRequest = (id: number) => {
        const candidate = candidates.find(c => c.id === id);
        setSelectedCandidateId(id);
        setCandidateToDeleteName(candidate?.name);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedCandidateId) return;
        try {
            await apiClient.delete(`/candidates/${selectedCandidateId}`);
            setIsDeleteModalOpen(false);
            fetchCandidates();
        } catch (error) {
            console.error('Failed to delete candidate:', error);
            alert('Có lỗi xảy ra khi xóa hồ sơ');
        }
    };

    const handleEdit = (id: number) => {
        setSelectedCandidateId(id);
        setIsUpdateModalOpen(true);
    };

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] font-sans flex flex-col">
            <TopNavbar />

            <main className="flex-1 p-8 w-full max-w-[1440px] mx-auto flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Quản lý Hồ sơ Ứng viên</h1>
                        <p className="text-sm text-slate-500 mt-1">Hệ thống quản lý và chấm điểm ứng viên nội bộ</p>
                    </div>
                </div>

                <FilterBox
                    initialSearch={searchTerm}
                    initialState={stateFilter}
                    initialRole={roleFilter}
                    initialLevel={levelFilter}
                    onSearch={setSearchTerm}
                    onStateFilter={setStateFilter}
                    onRoleFilter={setRoleFilter}
                    onLevelFilter={setLevelFilter}
                    onUploadClick={() => setIsUploadModalOpen(true)}
                />

                <CandidateTable
                    candidates={candidates}
                    isLoading={isLoading}
                    onViewDetail={handleViewDetail}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalRecords={totalRecords}
                    onPageChange={setCurrentPage}
                    onLimitChange={setItemsPerPage}
                />
            </main>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={fetchCandidates}
            />

            <UpdateModal
                isOpen={isUpdateModalOpen}
                candidateId={selectedCandidateId}
                onClose={() => setIsUpdateModalOpen(false)}
                onUpdateSuccess={fetchCandidates}
            />

            <CandidateDetailSlide
                isOpen={isDetailSlideOpen}
                onClose={() => setIsDetailSlideOpen(false)}
                candidateId={selectedCandidateId}
                onStatusChange={fetchCandidates}
                onEdit={(id) => {
                    setIsDetailSlideOpen(false);
                    handleEdit(id);
                }}
            />

            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                candidateName={candidateToDeleteName}
            />
        </div>
    );
};

export default Dashboard;
