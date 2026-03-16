import axios from 'axios';

const API_URL = 'http://localhost:8080/api/maintenance';

const maintenanceService = {
  // Submit maintenance completion with images
  submitMaintenance: async (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    };
    const response = await axios.post(`${API_URL}/submit`, formData, config);
    return response.data;
  },

  // Get driver's submission history
  getMySubmissions: async (driverId) => {
    const response = await axios.get(`${API_URL}/my-submissions`, {
      params: { driverId },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // Get pending submissions (for managers)
  getPendingSubmissions: async () => {
    const response = await axios.get(`${API_URL}/pending`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  },

  // Approve submission
  approveSubmission: async (submissionId, managerId, notes = '') => {
    const response = await axios.post(
      `${API_URL}/${submissionId}/approve`,
      null,
      {
        params: { managerId, notes },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );
    return response.data;
  },

  // Reject submission
  rejectSubmission: async (submissionId, managerId, notes = '') => {
    const response = await axios.post(
      `${API_URL}/${submissionId}/reject`,
      null,
      {
        params: { managerId, notes },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    );
    return response.data;
  },

  // Get vehicle submissions
  getVehicleSubmissions: async (vehicleId) => {
    const response = await axios.get(`${API_URL}/vehicle/${vehicleId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    return response.data;
  }
};

export default maintenanceService;
