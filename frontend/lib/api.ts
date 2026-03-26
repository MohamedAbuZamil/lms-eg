import axios, { AxiosInstance, AxiosError } from 'axios';

const SERVICES = {
  identity:     process.env.NEXT_PUBLIC_IDENTITY_URL     || 'http://localhost:3001',
  course:       process.env.NEXT_PUBLIC_COURSE_URL       || 'http://localhost:3002',
  content:      process.env.NEXT_PUBLIC_CONTENT_URL      || 'http://localhost:3003',
  staff:        process.env.NEXT_PUBLIC_STAFF_URL        || 'http://localhost:3004',
  assessment:   process.env.NEXT_PUBLIC_ASSESSMENT_URL   || 'http://localhost:3005',
  enrollment:   process.env.NEXT_PUBLIC_ENROLLMENT_URL   || 'http://localhost:3006',
  progress:     process.env.NEXT_PUBLIC_PROGRESS_URL     || 'http://localhost:3007',
  commerce:     process.env.NEXT_PUBLIC_COMMERCE_URL     || 'http://localhost:3008',
  notification: process.env.NEXT_PUBLIC_NOTIFICATION_URL || 'http://localhost:3009',
};

function createClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 30_000 });

  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err: AxiosError) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    },
  );

  return client;
}

export const identityApi     = createClient(SERVICES.identity);
export const courseApi       = createClient(SERVICES.course);
export const contentApi      = createClient(SERVICES.content);
export const staffApi        = createClient(SERVICES.staff);
export const assessmentApi   = createClient(SERVICES.assessment);
export const enrollmentApi   = createClient(SERVICES.enrollment);
export const progressApi     = createClient(SERVICES.progress);
export const commerceApi     = createClient(SERVICES.commerce);
export const notificationApi = createClient(SERVICES.notification);
