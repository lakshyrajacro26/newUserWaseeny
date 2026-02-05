import apiClient from '../config/apiClient';
import { HOME_ROUTES } from '../config/routes';

/**
 * Get home page data including banners, categories, and restaurant sections
 * @param {Object} params - Query parameters
 * @param {number} params.lat - Latitude for location-based data
 * @param {number} params.long - Longitude for location-based data
 * @returns {Promise<Object>} Home data with banners, categories, sections, and tabs
 */
export const getHomeData = async ({ lat, long } = {}) => {
  const params = {};
  if (lat !== undefined && long !== undefined) {
    params.lat = lat;
    params.long = long;
  }

  const response = await apiClient.get(HOME_ROUTES.getHomeData, { params });
  return response?.data ?? {};
};
