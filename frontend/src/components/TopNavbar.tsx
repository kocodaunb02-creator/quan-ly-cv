import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, LogOut, Bell, UserCircle2, Settings } from 'lucide-react';

const TopNavbar: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 w-full bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-50">
            {/* Logo Group */}
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-100">
                    <LogIn className="text-white w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">
                        QuanLyCV
                    </h2>
                    <p className="text-xs text-slate-500 font-medium leading-none">Recruitment System</p>
                </div>
            </div>

            {/* Right Actions & Profile */}
            <div className="flex items-center gap-6">
                {/* Notifications */}
                <button className="relative p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                {/* Settings */}
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-slate-50 hidden sm:block">
                    <Settings className="w-5 h-5" />
                </button>

                {/* Vertical Divider */}
                <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                {/* Current User */}
                <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-sm font-semibold text-slate-800">{user?.fullName || 'User'}</span>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md mt-0.5">{user?.roles.join(', ')}</span>
                    </div>
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 overflow-hidden">
                        <UserCircle2 className="w-6 h-6 text-slate-400" />
                    </div>
                </div>

                {/* Logout */}
                <button
                    onClick={logout}
                    title="Đăng xuất"
                    className="p-2 text-red-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default TopNavbar;
