const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('codenest_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('codenest_token', token);
  } else {
    localStorage.removeItem('codenest_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detailMessage = 'Request failed';
    try {
      const errorData = await response.json();
      if (errorData && errorData.detail) {
        detailMessage = Array.isArray(errorData.detail)
          ? errorData.detail[0]?.msg || 'Validation error'
          : String(errorData.detail);
      }
    } catch {
      detailMessage = `HTTP error ${response.status}`;
    }
    throw new Error(detailMessage);
  }

  return response.json();
}

export const api = {
  signup: (payload) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request('/auth/me'),
  getPlans: () => request('/plans'),
  subscribePlan: (planId) =>
    request('/plans/subscribe', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId }),
    }),
  getCourses: (level = null) => {
    const query = level ? `?level=${encodeURIComponent(level)}` : '';
    return request(`/courses${query}`);
  },
  getCourseDetail: (courseId) => request(`/courses/${courseId}`),
  getCourseReviewSummary: (courseId) => request(`/courses/${courseId}/reviews/summary`),
  enrollCourse: (courseId) =>
    request(`/courses/${courseId}/enroll`, {
      method: 'POST',
    }),
  getProgress: () => request('/progress'),
  completeLesson: (lessonId) =>
    request(`/lessons/${lessonId}/complete`, {
      method: 'POST',
    }),
  getQuiz: (quizId) => request(`/quizzes/${quizId}`),
  submitQuiz: (quizId, answers) =>
    request(`/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  getProjects: () => request('/projects'),
  subscribeNewsletter: (email) =>
    request('/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
