import apiClient from '../config/apiClient';
import { AUTH_ROUTES } from '../config/routes';
import { saveAuth } from './storage';

export const loginApi = async ({ email, password }) => {
  const payload = {
    email: (email ?? '').trim(),
    password,
  };

  const response = await apiClient.post(AUTH_ROUTES.login, payload);
  const data = response;

  // const token = data?.token || data?.accessToken || data?.data?.token;
  // const user = data?.user || data?.data?.user;

  // if (token || user) {
  //   await saveAuth({ token, user });
  // }

  return data;
};

export const registerInitiate = async ({
  name,
  email,
  password,
  mobile,
  role = 'customer',
}) => {
  const payload = {
    name: (name ?? '').trim(),
    email: (email ?? '').trim(),
    password,
    mobile: (mobile ?? '').trim(),
    role,
  };

  const response = await apiClient.post(AUTH_ROUTES.registerInitiate, payload);
  return response?.data ?? {};
};

export const registerVerify = async ({ mobile, otp }) => {
  const payload = {
    mobile: (mobile ?? '').trim(),
    otp: (otp ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.registerVerify, payload);
  const data = response?.data ?? {};

  const token = data?.token || data?.accessToken || data?.data?.token;
  const user = data?.user || data?.data?.user;

  if (token || user) {
    await saveAuth({ token, user });
  }

  return data;
};

export const resendOtp = async ({ mobile, email }) => {
  const payload = {
    mobile: (mobile ?? '').trim(),
    email: (email ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.resendOtp, payload);
  return response?.data ?? {};
};

export const checkVerificationStatus = async ({ mobile, email }) => {
  const payload = {
    mobile: (mobile ?? '').trim(),
    email: (email ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.checkVerificationStatus, payload);
  return response?.data ?? {};
};

export const forgotPasswordInitiate = async ({ email, mobile }) => {
  const payload = {
    email: (email ?? '').trim(),
    mobile: (mobile ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.forgotPassword, payload);
  return response?.data ?? {};
};

export const forgotPasswordVerifyOTP = async ({ email, mobile, otp }) => {
  const payload = {
    email: (email ?? '').trim(),
    mobile: (mobile ?? '').trim(),
    otp: (otp ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.forgotPasswordVerifyOTP, payload);
  return response?.data ?? {};
};

export const forgotPasswordResendOTP = async ({ email, mobile }) => {
  const payload = {
    email: (email ?? '').trim(),
    mobile: (mobile ?? '').trim(),
  };

  const response = await apiClient.post(AUTH_ROUTES.forgotPasswordResendOTP, payload);
  return response?.data ?? {};
};

export const resetPassword = async ({ resetToken, newPassword }) => {
  const payload = {
    resetToken: (resetToken ?? '').trim(),
    newPassword,
  };

  const response = await apiClient.post(AUTH_ROUTES.resetPassword, payload);
  return response?.data ?? {};
};
