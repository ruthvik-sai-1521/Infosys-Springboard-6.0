import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/routes';

/**
 * Service for handling route-related API calls
 */
const routeService = {
    /**
     * Get directions between two points
     * @param {string} origin - Origin address or coordinates
     * @param {string} destination - Destination address or coordinates
     * @param {boolean} alternatives - Whether to fetch alternative routes
     * @returns {Promise<Array>} List of route options
     */
    getDirections: async (origin, destination, alternatives = true) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/directions`, {
                params: { origin, destination, alternatives }
            });
            
            if (response.data.success) {
                return response.data.routes;
            } else {
                throw new Error(response.data.error || 'Failed to fetch directions');
            }
        } catch (error) {
            console.error('Error fetching directions:', error);
            throw error;
        }
    },

    /**
     * Save the selected route to a trip
     * @param {number} tripId - The trip ID
     * @param {object} routeData - The selected route data (distance, duration, polyline)
     * @param {object} sourceData - Source location details (lat, lng, address)
     * @param {object} destData - Destination location details (lat, lng, address)
     * @returns {Promise<object>} The updated trip/response
     */
    saveSelectedRoute: async (tripId, routeData, sourceData = null, destData = null) => {
        try {
            const payload = {
                tripId,
                encodedPolyline: routeData.polyline || routeData.encodedPolyline,
                distanceMeters: routeData.distanceMeters || routeData.distance,
                durationSeconds: routeData.durationSeconds || routeData.duration,
            };

            if (sourceData) {
                if (sourceData.latitude) payload.sourceLatitude = sourceData.latitude;
                if (sourceData.longitude) payload.sourceLongitude = sourceData.longitude;
                if (sourceData.address) payload.sourceAddress = sourceData.address;
            }

            if (destData) {
                if (destData.latitude) payload.destinationLatitude = destData.latitude;
                if (destData.longitude) payload.destinationLongitude = destData.longitude;
                if (destData.address) payload.destinationAddress = destData.address;
            }

            const response = await axios.post(`${API_BASE_URL}/select`, payload);
            return response.data;
        } catch (error) {
            console.error('Error saving route:', error);
            throw error;
        }
    },

    /**
     * Get the saved route for a trip
     * @param {number} tripId 
     * @returns {Promise<object>} Trip route details including decoded coordinates
     */
    getTripRoute: async (tripId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/trip/${tripId}`);
            if (response.data.success) {
                return response.data;
            } else {
                throw new Error(response.data.error || 'Trip route not found');
            }
        } catch (error) {
            console.error('Error fetching trip route:', error);
            throw error;
        }
    },

    /**
     * Decode a polyline string into coordinates
     * @param {string} polyline 
     * @returns {Promise<Array>} List of {latitude, longitude}
     */
    decodePolyline: async (polyline) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/decode-polyline`, {
                params: { polyline }
            });
            if (response.data.success) {
                return response.data.coordinates;
            }
            return [];
        } catch (error) {
            console.error('Error decoding polyline:', error);
            return [];
        }
    },

    /**
     * Reverse geocode coordinates to address
     * @param {number} lat 
     * @param {number} lng 
     * @returns {Promise<string>} Address string
     */
    reverseGeocode: async (lat, lng) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/reverse-geocode`, {
                params: { lat, lng }
            });
            if (response.data.success) {
                return response.data.address;
            }
            return null;
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            return null;
        }
    }
};

export default routeService;
