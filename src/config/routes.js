export const AUTH_ROUTES = {
  login: '/api/auth/login',
  registerInitiate: '/api/auth/register/initiate',
  registerVerify: '/api/auth/register/verify',
  resendOtp: '/api/auth/resend-otp',
  checkVerificationStatus: '/api/auth/check-verification-status',
  forgotPassword: '/api/auth/forgot-password',
  forgotPasswordVerifyOTP: '/api/auth/forgot-password/verify-otp',
  forgotPasswordResendOTP: '/api/auth/forgot-password/resend-otp',
  resetPassword: '/api/auth/reset-password',
};

export const RESTAURANT_ROUTES = {
  getDetails: '/api/restaurants/:id/details',
  getMenu: '/api/menu/:restaurantId',
};

export const ORDER_ROUTES = {
  placeOrder: '/api/orders/place',
};

export const HOME_ROUTES = {
  getHomeData: '/api/home',
};

export const CART_ROUTES = {
  getCart: '/api/cart',
  addItem: '/api/cart/item',
  removeItem: '/api/cart/item/:itemId',
  updateQuantity: '/api/cart/item/:itemId/quantity',
};

export const USER_ROUTES = {
  profile: '/api/user/profile',
  addresses: '/api/user/address',
  addressById: '/api/user/address/:id',
};
