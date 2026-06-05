import Cookies from 'js-cookie';

export const getUserRole = (): string | null => {
  // Read the 'userRole' cookie
  const role = Cookies.get('userRole');
  return role || null;
};

export const isLoggedIn = (): boolean => {
  // Check if the 'userRole' cookie is set
  return !!Cookies.get('userRole');
};

