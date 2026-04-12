const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache

export const fetchWithCache = async (key, fetcher, cacheDuration = CACHE_DURATION) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return cached.data;
  }

  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};

export const invalidateCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

export const createPaginatedFetcher = (baseUrl, options = {}) => {
  const { pageSize = 20, cacheDuration = CACHE_DURATION } = options;

  return async (page = 0, filters = {}) => {
    const offset = page * pageSize;
    const queryParams = new URLSearchParams();
    
    queryParams.set('select', '*');
    queryParams.set('limit', pageSize.toString());
    queryParams.set('offset', offset.toString());

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.set(key, value);
      }
    });

    const url = `${baseUrl}?${queryParams.toString()}`;
    const cacheKey = `${url}-${page}`;

    return fetchWithCache(cacheKey, async () => {
      const response = await fetch(url, {
        headers: {
          'apikey': options.apiKey,
          'Authorization': `Bearer ${options.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      return response.json();
    }, cacheDuration);
  };
};

export const batchRequests = async (requests) => {
  return Promise.all(requests.map(req => req()));
};

export const createOptimizedFetcher = (config) => {
  const { url, apiKey } = config;

  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

  return {
    get: async (endpoint, params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `${url}/rest/v1/${endpoint}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(fullUrl, { headers });
      if (!response.ok) {
        throw new Error(`GET ${endpoint} failed`);
      }
      return response.json();
    },

    post: async (endpoint, data) => {
      const response = await fetch(`${url}/rest/v1/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`POST ${endpoint} failed`);
      }
      return response.json();
    },

    patch: async (endpoint, data) => {
      const response = await fetch(`${url}/rest/v1/${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error(`PATCH ${endpoint} failed`);
      }
      return response.json();
    },

    delete: async (endpoint) => {
      const response = await fetch(`${url}/rest/v1/${endpoint}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) {
        throw new Error(`DELETE ${endpoint} failed`);
      }
    }
  };
};
