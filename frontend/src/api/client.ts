import axios from 'axios';
import { Task, User, PaginationMeta, TaskFilters } from '../types';

const client = axios.create({ baseURL: '/api' });

// Request interceptor: attach token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: (data: { email: string; password: string; name: string }) =>
    client.post<{ data: User }>('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    client.post<{ data: { token: string; user: User } }>('/auth/login', data),
  me: () => client.get<{ data: User }>('/auth/me'),
};

// Tasks API
export const tasksApi = {
  list: (params: Partial<TaskFilters>) =>
    client.get<{ data: Task[]; meta: PaginationMeta }>('/tasks', { params }),
  get: (id: string) => client.get<{ data: Task }>(`/tasks/${id}`),
  create: (data: Partial<Task>) => client.post<{ data: Task }>('/tasks', data),
  update: (id: string, data: Partial<Task>) => client.put<{ data: Task }>(`/tasks/${id}`, data),
  delete: (id: string) => client.delete(`/tasks/${id}`),
};

// Users API
export const usersApi = {
  list: () => client.get<{ data: User[] }>('/users'),
};

export default client;
