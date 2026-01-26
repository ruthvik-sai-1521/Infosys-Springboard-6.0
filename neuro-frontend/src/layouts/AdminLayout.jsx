import React from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-950 flex">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex-1 ml-64 p-8">
               {children}
            </div>
        </div>
    );
};

export default AdminLayout;
