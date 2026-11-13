const API_BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveMediaUrl(url) {
  if (!url) {
    return '';
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return `${API_ORIGIN}${url}`;
  }
  return url;
}

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

async function parseErrorResponse(response) {
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
  return new Error(detailMessage);
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

  if (response.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event('codenest:unauthorized'));
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
  }

  return response.json();
}

async function uploadVideoEndpoint(endpoint, fileOrUrl) {
  if (typeof fileOrUrl === 'string') {
    return request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ video_url: fileOrUrl }),
    });
  }

  const token = getToken();
  const headers = {
    'Content-Type': fileOrUrl.type || 'video/mp4',
    'X-Filename': fileOrUrl.name || 'lesson_video.mp4',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: fileOrUrl,
  });

  if (response.status === 401 && token) {
    setToken(null);
    window.dispatchEvent(new Event('codenest:unauthorized'));
  }

  if (!response.ok) {
    throw await parseErrorResponse(response);
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
  createCourse: (payload) =>
    request('/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCourseDetail: (courseId) => request(`/courses/${courseId}`),
  createModule: (courseId, payload) =>
    request(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createLesson: (courseId, payload) =>
    request(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  uploadCourseVideo: (courseId, fileOrUrl) =>
    uploadVideoEndpoint(`/courses/${courseId}/video`, fileOrUrl),
  uploadCourseLessonVideo: (courseId, lessonId, fileOrUrl) =>
    uploadVideoEndpoint(`/courses/${courseId}/lessons/${lessonId}/video`, fileOrUrl),
  uploadLessonVideo: (lessonId, fileOrUrl) =>
    uploadVideoEndpoint(`/lessons/${lessonId}/video`, fileOrUrl),
  getCourseReviewSummary: (courseId) => request(`/courses/${courseId}/reviews/summary`),
  submitCourseReview: (courseId, stars) =>
    request(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({ stars }),
    }),
  enrollCourse: (courseId) =>
    request(`/courses/${courseId}/enroll`, {
      method: 'POST',
    }),
  enrollByCode: (accessCode) =>
    request('/courses/enroll-code', {
      method: 'POST',
      body: JSON.stringify({ access_code: accessCode }),
    }),
  getProgress: (courseId = null) => {
    const query = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';
    return request(`/progress${query}`);
  },
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
  getProjects: (courseId = null) => {
    const query = courseId ? `?course_id=${encodeURIComponent(courseId)}` : '';
    return request(`/projects${query}`);
  },
  createProject: (payload) =>
    request('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  subscribeNewsletter: (email) =>
    request('/newsletter', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};
