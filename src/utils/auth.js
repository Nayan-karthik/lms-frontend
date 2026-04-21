export const parseJwt = (token) => {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = window.atob(normalized);
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  return parseJwt(token);
};

export const isAdminUser = () => getCurrentUser()?.role === 'admin';
