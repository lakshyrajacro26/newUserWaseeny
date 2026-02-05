import apiClient from '../config/apiClient';
import { ORDER_ROUTES } from '../config/routes';

export const placeOrder = async orderData => {
  try {
    const response = await apiClient.post(ORDER_ROUTES.placeOrder, orderData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export function generateOrderId(prefix = 'ORD') {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yyyy}${mm}${dd}-${rand}`;
}
