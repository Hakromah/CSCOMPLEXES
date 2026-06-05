import axios from 'axios';
import qs from 'qs';
import Cookies from 'js-cookie';

const baseURL = `${process.env.NEXT_PUBLIC_STRAPI_URL || 'https://api.2cscomplexes.com'}/api`;

const api = axios.create({
  baseURL: baseURL,
  paramsSerializer: params => {
    return qs.stringify(params, { arrayFormat: 'brackets' });
  },
  withCredentials: true, // Send cookies with every request
});

// Explicitly attach the JWT token from our First-Party Domain Cookie.
// This resolves the Cross-Origin Cookie Dropping bug on Safari/Chrome when Strapi runs remotely.
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');

    // Do not attach the Authorization header if we are explicitly trying to login/register!
    // Strapi's security firewall will return 403 Forbidden if a Bearer token is sent to the Auth Gateway.
    const isAuthRoute = config.url?.includes('/auth/local');

    if (token && config.headers && !isAuthRoute) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
