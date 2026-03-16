import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, AlertTriangle, Info, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useNavigate } from 'react-router-dom';

const DriverAlertsNotification = ({ driverId }) => {
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toast, setToast] = useState(null);
    const stompClientRef = useRef(null);
    const dropdownRef = useRef(null);

    // Fetch initial alerts
    useEffect(() => {
        if (!driverId) return;
        fetchAlerts();
        connectWebSocket();

        // Click outside to close
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
        };
    }, [driverId]);

    const fetchAlerts = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            const res = await axios.get(`/api/health/alerts/driver/${driverId}`, config);
            // Sort by date desc
            const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAlerts(sorted);
            updateUnreadCount(sorted);
        } catch (e) {
            console.error("Error fetching alerts:", e);
        }
    };

    const updateUnreadCount = (list) => {
        // Assuming 'ACTIVE' is unread, or we could add an 'isRead' flag if backend supported it.
        // For now, let's treat ACTIVE/WARNING/CRITICAL as "unread" or needing attention.
        // The user requirement says "badge showing unread alert count".
        // Let's assume all fetched alerts are 'active' based on the endpoint usage in previous steps.
        // But if endpoint returns all, filter by status.
        const unread = list.filter(a => a.status === 'ACTIVE').length;
        setUnreadCount(unread);
    };

    const connectWebSocket = () => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                // Health/vehicle alerts
                client.subscribe(`/topic/alerts/driver/${driverId}`, (message) => {
                    const alert = JSON.parse(message.body);
                    handleNewAlert(alert);
                });
                // Maintenance submission review results from manager
                client.subscribe(`/topic/notifications/driver/${driverId}`, (message) => {
                    const notif = JSON.parse(message.body);
                    handleMaintenanceReviewNotif(notif);
                });
            },
            onStompError: (frame) => {
                console.error('WS Error: ' + frame.headers['message']);
            },
        });
        client.activate();
        stompClientRef.current = client;
    };

    const handleMaintenanceReviewNotif = (notif) => {
        const approved = notif.approved;
        const syntheticAlert = {
            id: 'mnt_' + Date.now(),
            title: approved ? '✅ Vehicle Released' : '❌ Submission Rejected',
            description: notif.message || (approved
                ? `Vehicle ${notif.vehicleNumber} has been released for trips.`
                : `Your submission for ${notif.vehicleNumber} was rejected. ${notif.reviewNotes || ''}`),
            severity: approved ? 'INFO' : 'HIGH',
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            vehicle: { vehicleNumber: notif.vehicleNumber }
        };
        setAlerts(prev => {
            const updated = [syntheticAlert, ...prev];
            updateUnreadCount(updated);
            return updated;
        });
        // Show toast
        setToast(syntheticAlert);
        setTimeout(() => setToast(null), 7000);
    };

    const handleNewAlert = (newAlert) => {
        setAlerts(prev => {
            const updated = [newAlert, ...prev];
            updateUnreadCount(updated);
            return updated;
        });

        // Show Toast for High/Critical
        if (['CRITICAL', 'HIGH'].includes(newAlert.severity)) {
            setToast(newAlert);
            setTimeout(() => setToast(null), 5000); // Hide after 5s
        }
    };

    const handleAcknowledge = async (e, alertId) => {
        e.stopPropagation(); // Prevent dropdown close or navigation
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            // Pass userId 0 or fetch actual user id if needed, but endpoint needs param
            // Note: In a real app we'd get userId from context. For now using 0 as system/driver default.
            await axios.post(`/api/health/alerts/${alertId}/acknowledge?userId=${driverId || 0}`, {}, config);
            
            // Update local state
            setAlerts(prev => prev.map(a => 
                a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a
            ));
            // Re-calc unread (if acknowledged counts as read)
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error("Ack error", e);
        }
    };

    const handleAlertClick = (alert) => {
        setIsOpen(false);
        // Navigate to vehicle health page
        // Since we don't have a specific vehicle health route, we go to fleet page
        // We could pass state to open the modal automatically.
        navigate('/driver/my-fleet', { state: { openHealthVehicleId: alert.vehicleId } });
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'CRITICAL': return 'bg-red-500';
            case 'HIGH': return 'bg-orange-500';
            case 'MEDIUM': return 'bg-amber-500';
            default: return 'bg-blue-500';
        }
    };

    const getIcon = (severity) => {
        switch (severity) {
            case 'CRITICAL': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'INFO': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const timeAgo = (dateStr) => {
        const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Toast Notification */}
            {toast && (
                <div className="fixed top-24 right-4 z-[100] bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-fade-in max-w-sm">
                   <div className={`mt-1 w-2 h-2 rounded-full ${getSeverityColor(toast.severity)} flex-shrink-0`} />
                   <div className="flex-1">
                       <h4 className="text-white font-bold text-sm">{toast.title}</h4>
                       <p className="text-slate-400 text-xs">{toast.description}</p>
                   </div>
                   <button onClick={() => setToast(null)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Bell Icon */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-slate-800 text-slate-300 transition-colors"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold border border-slate-900">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <h3 className="font-bold text-white text-sm">Notifications</h3>
                        {unreadCount > 0 && <span className="text-xs text-slate-400">{unreadCount} unread</span>}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {alerts.length === 0 ? (
                            <div className="p-6 text-center text-slate-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            alerts.map(alert => (
                                <div 
                                    key={alert.id}
                                    onClick={() => handleAlertClick(alert)}
                                    className={`p-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors group flex gap-3 ${alert.status === 'ACTIVE' ? 'bg-slate-800/20' : ''}`}
                                >
                                    <div className="mt-1">{getIcon(alert.severity)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className={`text-sm font-bold truncate ${alert.status === 'ACTIVE' ? 'text-white' : 'text-slate-400'}`}>
                                                {alert.title}
                                            </p>
                                            <span className="text-[10px] text-slate-500 whitespace-nowrap ml-2">{timeAgo(alert.createdAt)}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">{alert.description}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                                {alert.vehicle?.vehicleNumber || 'Vehicle'}
                                            </span>
                                            {alert.status === 'ACTIVE' && (
                                                <button 
                                                    onClick={(e) => handleAcknowledge(e, alert.id)}
                                                    className="text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 px-2 py-1 rounded font-bold transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
                                                >
                                                    <Check className="w-3 h-3" /> Mark Read
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <div className="p-2 border-t border-slate-800 bg-slate-950/50 text-center">
                        <button onClick={() => navigate('/driver/my-fleet')} className="text-xs text-blue-400 hover:text-blue-300 font-bold">
                            View All Alerts
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DriverAlertsNotification;
