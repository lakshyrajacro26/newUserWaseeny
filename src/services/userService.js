import apiClient from '../config/apiClient';
import { USER_ROUTES } from '../config/routes';
import { clearAuth } from './storage';

export const deleteAccount = async (reason) => {
  const payload = {
    reason: reason || 'No reason provided',
  };
  
  const response = await apiClient.delete(USER_ROUTES.deleteAccount, {
    data: payload,
  });
  
  // Clear local auth data after successful deletion
  await clearAuth();
  
  return response.data;
};

export const getUserProfile = async () => {
  const response = await apiClient.get(USER_ROUTES.profile);
  return response.data;
};

export const updateUserProfile = async (payload) => {
  const response = await apiClient.put(USER_ROUTES.updateProfile, payload);
  return response.data;
};
