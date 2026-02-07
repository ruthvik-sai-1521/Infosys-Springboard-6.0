import axios from 'axios';

const API_URL = 'http://localhost:8080/api/health';

// Helper to get auth header (assuming token is stored in localStorage)
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

const healthService = {
  // --- Vehicle Health ---
  getVehicleHealth: async (vehicleId) => {
    const response = await axios.get(`${API_URL}/vehicle/${vehicleId}`, getAuthHeader());
    return response.data;
  },

  getDriverVehiclesHealth: async (driverId) => {
    const response = await axios.get(`${API_URL}/driver/${driverId}/vehicles`, getAuthHeader());
    return response.data;
  },

  // --- Fleet Summary ---
  getFleetHealthSummary: async () => {
    const response = await axios.get(`${API_URL}/fleet/summary`, getAuthHeader());
    return response.data;
  },

  // --- Trends ---
  getVehicleHealthTrend: async (vehicleId, days = 30) => {
    const response = await axios.get(`${API_URL}/vehicle/${vehicleId}/trend?days=${days}`, getAuthHeader());
    return response.data;
  },

  // --- Alerts ---
  getAllActiveAlerts: async () => {
    const response = await axios.get(`${API_URL}/alerts`, getAuthHeader());
    return response.data;
  },

  getVehicleAlerts: async (vehicleId) => {
    const response = await axios.get(`${API_URL}/alerts/vehicle/${vehicleId}`, getAuthHeader());
    return response.data;
  },

  acknowledgeAlert: async (alertId, userId) => {
    const response = await axios.post(`${API_URL}/alerts/${alertId}/acknowledge?userId=${userId}`, {}, getAuthHeader());
    return response.data;
  },

  resolveAlert: async (alertId, userId) => {
    const response = await axios.post(`${API_URL}/alerts/${alertId}/resolve?userId=${userId}`, {}, getAuthHeader());
    return response.data;
  },

  // --- Maintenance ---
  performMaintenance: async (vehicleId, components) => {
    const response = await axios.post(`${API_URL}/vehicle/${vehicleId}/maintenance`, { components }, getAuthHeader());
    return response.data;
  },
  
  simulateWear: async (vehicleId, distanceKm) => {
    const response = await axios.post(`${API_URL}/vehicle/${vehicleId}/simulate-wear?distanceKm=${distanceKm}`, {}, getAuthHeader());
    return response.data;
  }
};

export default healthService;
