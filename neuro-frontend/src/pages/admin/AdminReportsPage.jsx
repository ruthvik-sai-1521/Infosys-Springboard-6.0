import React, { useState } from 'react';
import axios from 'axios';
import './AdminReports Page.css';

const AdminReportsPage = () => {
    const [reportType, setReportType] = useState('');
    const [format, setFormat] = useState('csv');
    const [loading, setLoading] = useState(false);
    const [tripFilter, setTripFilter] = useState('ALL');

    const reportTypes = [
        { value: 'drivers', label: 'Drivers List' },
        { value: 'vehicles', label: 'Vehicles List' },
        { value: 'blocked-vehicles', label: 'Blocked Vehicles' },
        { value: 'blocked-drivers', label: 'Blocked Drivers' },
        { value: 'trips', label: 'Trips Report' },
    ];

    const tripFilters = [
        { value: 'ALL', label: 'All Trips' },
        { value: 'UPCOMING', label: 'Upcoming Trips' },
        { value: 'COMPLETED', label: 'Completed Trips' },
    ];

    const handleDownload = async () => {
        if (!reportType) {
            alert('Please select a report type');
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:8080/api/reports/${reportType}/${format}`;
            
            // Add filter for trips report
            if (reportType === 'trips') {
                url += `?filter=${tripFilter}`;
            }

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                responseType: 'blob'
            });

            // Create download link
            const blob = new Blob([response.data]);
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            
            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const filterSuffix = reportType === 'trips' ? `_${tripFilter.toLowerCase()}` : '';
            link.setAttribute('download', `${reportType}${filterSuffix}_report_${timestamp}.${format}`);
            
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            alert('Report downloaded successfully!');
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download report. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-reports-page">
            <div className="reports-header">
                <h1>📊 Reports</h1>
                <p>Generate and download comprehensive reports</p>
            </div>

            <div className="reports-card">
                <div className="form-group">
                    <label>Select Report Type</label>
                    <select 
                        value={reportType} 
                        onChange={(e) => setReportType(e.target.value)}
                        className="report-select"
                    >
                        <option value="">-- Select Report --</option>
                        {reportTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {reportType === 'trips' && (
                    <div className="form-group">
                        <label>Filter Trips By</label>
                        <select 
                            value={tripFilter} 
                            onChange={(e) => setTripFilter(e.target.value)}
                            className="report-select"
                        >
                            {tripFilters.map(filter => (
                                <option key={filter.value} value={filter.value}>
                                    {filter.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label>Export Format</label>
                    <div className="format-buttons">
                        <button 
                            className={`format-btn ${format === 'csv' ? 'active' : ''}`}
                            onClick={() => setFormat('csv')}
                        >
                            <span>📄</span> CSV
                        </button>
                        <button 
                            className={`format-btn ${format === 'pdf' ? 'active' : ''}`}
                            onClick={() => setFormat('pdf')}
                        >
                            <span>📑</span> PDF
                        </button>
                    </div>
                </div>

                <button 
                    className="download-btn" 
                    onClick={handleDownload}
                    disabled={loading || !reportType}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span> Generating...
                        </>
                    ) : (
                        <>
                            🔽 Download Report
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AdminReportsPage;
