import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp?: number;
  iat?: number;
  id?: number;
}

export const getUserRole = (): string | null => {
  const role = Cookies.get('userRole');
  return role || null;
};

export const isLoggedIn = (): boolean => {
  const token = Cookies.get('accessToken');
  if (!token) return false;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      // Token expired — clear cookies
      Cookies.remove('accessToken', { path: '/' });
      Cookies.remove('userRole', { path: '/' });
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const getCurrentUserId = (): number | null => {
  const token = Cookies.get('accessToken');
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return decoded.id || null;
  } catch {
    return null;
  }
};

export const logout = () => {
  Cookies.remove('accessToken', { path: '/' });
  Cookies.remove('userRole', { path: '/' });
};
