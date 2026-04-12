// API Configuration
// Credentials should be provided via environment variables for security
// REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_KEY must be set

export const API_CONFIG = {
  USE_PYTHON_SERVER: false,
  PYTHON_SERVER_URL: '/',
  // Use environment variables for security - fallback to empty strings if not set
  get SUPABASE_URL() {
    return process.env.REACT_APP_SUPABASE_URL || '';
  },
  get SUPABASE_KEY() {
    return process.env.REACT_APP_SUPABASE_KEY || '';
  },
};

export const getApiBaseUrl = () => {
  if (API_CONFIG.USE_PYTHON_SERVER) {
    return API_CONFIG.PYTHON_SERVER_URL;
  }
  const url = API_CONFIG.SUPABASE_URL;
  if (!url) {
    console.warn('Supabase URL not configured. Please set REACT_APP_SUPABASE_URL environment variable.');
  }
  return url;
};

export const getApiHeaders = (supabaseKey) => {
  const key = supabaseKey || API_CONFIG.SUPABASE_KEY;
  
  if (!key) {
    console.warn('Supabase key not configured. Please set REACT_APP_SUPABASE_KEY environment variable.');
  }
  
  if (API_CONFIG.USE_PYTHON_SERVER) {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
};

export const apiRequest = async (endpoint, options = {}, supabaseKey) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    ...getApiHeaders(supabaseKey),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
