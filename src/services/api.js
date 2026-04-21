const baseURL = 'https://lms-backend-sjt2.onrender.com';

const buildHeaders = (customHeaders = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...customHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response, responseType) => {
  if (responseType === 'blob') {
    return response.blob();
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
};

const request = async (path, options = {}) => {
  const { responseType, headers, ...fetchOptions } = options;

  const response = await fetch(`${baseURL}${path}`, {
    ...fetchOptions,
    headers: buildHeaders(headers),
  });

  const data = await parseResponse(response, responseType);

  if (!response.ok) {
    const error = new Error('Request failed');
    error.response = {
      status: response.status,
      data,
    };
    throw error;
  }

  return { data, status: response.status };
};

const api = {
  get(path, options = {}) {
    return request(path, {
      method: 'GET',
      ...options,
    });
  },

  post(path, body, options = {}) {
    return request(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  },

  put(path, body, options = {}) {
    return request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
  },

  delete(path, options = {}) {
    return request(path, {
      method: 'DELETE',
      ...options,
    });
  },
};

export default api;
