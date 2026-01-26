import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { CheckCircle, ArrowLeft, Loader, User, FileText, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DriverProfilePage = ({ embed = false }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        mobile: '', aadhaar: '', licenseImage: '', profileImage: ''
    });
    const [status, setStatus] = useState('LOADING');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Separate file states
    const [selectedProfileFile, setSelectedProfileFile] = useState(null);
    const [selectedLicenseFile, setSelectedLicenseFile] = useState(null);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/api/driver/profile');
            const data = res.data;
            if (data) {
                setStatus(data.verificationStatus || 'NOT_SUBMITTED');
                setFormData({
                    mobile: data.mobileNumber || '',
                    aadhaar: data.aadhaarNumber || '',
                    licenseImage: data.drivingLicense || '',
                    profileImage: data.profileImage || ''
                });
            }
        } catch (err) {
            console.error(err);
            setStatus('NOT_SUBMITTED');
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // 1. HELPER: Upload File
    const uploadFile = async (file) => {
        const data = new FormData();
        data.append('file', file);
        // Assuming we use the standard upload endpoint for simplicity or driver specific if needed
        // Using the driver specific one we made which returns { imageUrl: ... }
        const driverId = 1; // context user id needed, defaulting for now
        const res = await axios.post(`/api/driver/${driverId}/upload-profile-image`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.imageUrl;
    };

    // 2. ACTION: Update Only Image (No Verification)
    const handleImageUpdate = async () => {
        if (!selectedProfileFile) return setMsg({ type: 'error', text: 'Please select an image first.' });
        setLoading(true);
        try {
            const imgUrl = await uploadFile(selectedProfileFile);
            await axios.post('/api/driver/profile/image/update', { profileImage: imgUrl });
            setMsg({ type: 'success', text: 'Profile photo updated successfully!' });
            fetchProfile();
            setSelectedProfileFile(null);
        } catch (error) {
            setMsg({ type: 'error', text: 'Failed to update photo.' });
        }
        setLoading(false);
    };

    // 3. ACTION: Update Details (Triggers Verification)
    const handleDetailsSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let lImg = formData.licenseImage;
            if (selectedLicenseFile) {
                lImg = await uploadFile(selectedLicenseFile);
            }

            const payload = {
                mobileNumber: formData.mobile,
                aadhaarNumber: formData.aadhaar,
                drivingLicense: lImg,
                profileImage: formData.profileImage // Send existing image
            };
            
            await axios.post('/api/driver/profile/update', payload);
            setMsg({ type: 'success', text: 'Details submitted for Admin Verification.' });
            setStatus('PENDING_VERIFICATION');
            fetchProfile();
        } catch (error) {
            setMsg({ type: 'error', text: 'Failed to submit details.' });
        }
        setLoading(false);
    };

    // 3. Helper for Image URL
    const getImageUrl = (path) => {
        if (!path) return "https://via.placeholder.com/150";
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        return `http://localhost:8080${path}`;
    };

    return (
        <div className={embed ? "" : "min-h-screen bg-slate-950 text-white pb-20"}>
            {!embed && <Navbar />}
            <div className={embed ? "" : "pt-24 max-w-5xl mx-auto px-6 animate-fade-in"}>
                
                {!embed && (
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => navigate('/driver')} className="flex items-center text-slate-400 hover:text-white transition-colors text-sm font-medium">
                            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </button>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${ status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                            STATUS: {status}
                        </div>
                    </div>
                )}

                {msg.text && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${msg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {msg.type === 'error' ? <span className="font-bold">Error:</span> : <CheckCircle className="w-5 h-5" />}
                        {msg.text}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: Profile Image (Separate Flow) */}
                    <div className="lg:col-span-1">
                        <div className="glass-panel p-6 rounded-2xl border border-slate-700 shadow-xl text-center">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center justify-center gap-2">
                                <User className="w-5 h-5 text-blue-400" /> Profile Photo
                            </h3>
                            
                            <div className="relative w-40 h-40 mx-auto mb-6">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-slate-800 bg-slate-900 shadow-inner">
                                    {selectedProfileFile ? (
                                        <img src={URL.createObjectURL(selectedProfileFile)} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={getImageUrl(formData.profileImage)} alt="Current" className="w-full h-full object-cover" />
                                    )}
                                </div>
                                <label className="absolute bottom-1 right-1 bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-full cursor-pointer shadow-lg transition-transform hover:scale-105">
                                    <Camera className="w-5 h-5" />
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setSelectedProfileFile(e.target.files[0])} />
                                </label>
                            </div>

                            {selectedProfileFile && (
                                <button 
                                    onClick={handleImageUpdate}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-900/20"
                                >
                                    {loading ? 'Saving...' : 'Save New Photo'}
                                </button>
                            )}
                            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                                Updating your photo initiates an immediate update without admin verification.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Personal Details (Verification Flow) */}
                    <div className="lg:col-span-2">
                        <div className="glass-panel p-8 rounded-2xl border border-slate-700 shadow-xl relative overflow-hidden">
                             {status === 'APPROVED' && <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-bl-lg">VERIFIED DATA</div>}
                             
                             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-emerald-400" /> Personal Details
                            </h3>
                            
                            <form onSubmit={handleDetailsSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Mobile Number</label>
                                        <input type="text" name="mobile" value={formData.mobile} required onChange={handleChange} 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-slate-400 mb-1">Aadhaar Number</label>
                                        <input type="text" name="aadhaar" value={formData.aadhaar} required onChange={handleChange} 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:border-emerald-500 transition-colors" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-slate-400 mb-2">Driving License Document</label>
                                    <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                        <div className="flex-1">
                                            {selectedLicenseFile ? (
                                                <span className="text-blue-400 text-sm font-medium">{selectedLicenseFile.name}</span>
                                            ) : (
                                                 formData.licenseImage ? (
                                                    <a href={formData.licenseImage} target="_blank" rel="noreferrer" className="text-emerald-400 text-sm hover:underline flex items-center gap-1">
                                                        <CheckCircle className="w-4 h-4" /> Current Document Uploaded
                                                    </a>
                                                 ) : <span className="text-slate-500 text-sm">No document uploaded</span>
                                            )}
                                        </div>
                                        <label className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer border border-slate-700 transition-colors">
                                            {formData.licenseImage ? 'Change File' : 'Upload File'}
                                            <input type="file" accept="image/*,.pdf" onChange={(e) => setSelectedLicenseFile(e.target.files[0])} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800">
                                    <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-900/20 flex justify-center items-center gap-2 transition-all hover:scale-[1.01]">
                                        {loading && <Loader className="w-4 h-4 animate-spin" />}
                                        {status === 'APPROVED' ? 'Update Details (Re-verify)' : 'Submit Details'}
                                    </button>
                                    <p className="text-center text-xs text-slate-500 mt-3">
                                        Changing these details will revert your status to <strong>PENDING_VERIFICATION</strong>.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default DriverProfilePage;
