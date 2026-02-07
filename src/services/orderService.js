import apiClient from '../config/apiClient';
import { ORDER_ROUTES } from '../config/routes';

export const getOrders = async () => {
  try {
    const response = await apiClient.get(ORDER_ROUTES.getOrders);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const url = ORDER_ROUTES.getOrderById.replace(':id', orderId);
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

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
