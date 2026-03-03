import axios, { AxiosRequestConfig } from 'axios';
import { auth } from '../config/firebase';

const API_BASE_URL = 'http://localhost:4000/api';

/**
 * Get the current user's Firebase ID token
 */
export const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Create axios config with authentication header
 */
export const createAuthConfig = async (
  config: AxiosRequestConfig = {}
): Promise<AxiosRequestConfig> => {
  const token = await getAuthToken();
  
  return {
    ...config,
    headers: {
      ...config.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };
};

/**
 * Make authenticated GET request
 */
export const authenticatedGet = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const authConfig = await createAuthConfig(config);
  const response = await axios.get(`${API_BASE_URL}${endpoint}`, authConfig);
  return response.data;
};

/**
 * Make authenticated POST request
 */
export const authenticatedPost = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const authConfig = await createAuthConfig(config);
  const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, authConfig);
  return response.data;
};

/**
 * Make authenticated PUT request
 */
export const authenticatedPut = async <T = any>(
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const authConfig = await createAuthConfig(config);
  const response = await axios.put(`${API_BASE_URL}${endpoint}`, data, authConfig);
  return response.data;
};

/**
 * Make authenticated DELETE request
 */
export const authenticatedDelete = async <T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  const authConfig = await createAuthConfig(config);
  const response = await axios.delete(`${API_BASE_URL}${endpoint}`, authConfig);
  return response.data;
};

/**
 * Upload file with authentication
 */
export const authenticatedFileUpload = async <T = any>(
  endpoint: string,
  file: File,
  additionalData?: Record<string, any>
): Promise<T> => {
  const formData = new FormData();
  formData.append('resume', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const authConfig = await createAuthConfig({
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, authConfig);
  return response.data;
};

/**
 * Download PDF with authentication
 */
export const downloadAuthenticatedPDF = async (
  endpoint: string,
  data: any,
  filename: string = 'Resume.pdf'
): Promise<void> => {
  const authConfig = await createAuthConfig({
    responseType: 'blob',
  });

  const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, authConfig);
  
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return auth.currentUser !== null;
};

/**
 * Require authentication before executing a function
 */
export const requireAuth = <T extends any[]>(
  fn: (...args: T) => void | Promise<void>,
  onUnauthenticated?: () => void
) => {
  return async (...args: T) => {
    if (!isAuthenticated()) {
      if (onUnauthenticated) {
        onUnauthenticated();
      }
      return;
    }
    return await fn(...args);
  };
};