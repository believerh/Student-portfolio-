import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const createFetcher = (config) => {
  const { url, apiKey } = config;
  
  const headers = {
    'apikey': apiKey,
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
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
        const error = await response.json();
        throw new Error(error.message || `POST ${endpoint} failed`);
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
        const error = await response.json();
        throw new Error(error.message || `PATCH ${endpoint} failed`);
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

let globalConfig = null;

export const setGlobalConfig = (config) => {
  globalConfig = config;
};

const getFetcher = () => {
  if (!globalConfig) {
    throw new Error('Global config not set. Call setGlobalConfig first.');
  }
  return createFetcher(globalConfig);
};

export const useStudents = (options = {}) => {
  return useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const fetcher = getFetcher();
      return fetcher.get('students', { select: '*' });
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useTeachers = (options = {}) => {
  return useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const fetcher = getFetcher();
      return fetcher.get('teachers', { select: '*' });
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

export const useFiles = (studentId = null, options = {}) => {
  return useQuery({
    queryKey: ['files', studentId],
    queryFn: async () => {
      const fetcher = getFetcher();
      if (studentId) {
        return fetcher.get('files', { 
          select: '*',
          student_id: `eq.${studentId}`,
          order: 'created_at.desc'
        });
      }
      return fetcher.get('files', { 
        select: '*',
        order: 'created_at.desc',
        limit: 20
      });
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useComments = (fileIds = [], options = {}) => {
  return useQuery({
    queryKey: ['comments', fileIds.join(',')],
    queryFn: async () => {
      if (!fileIds || fileIds.length === 0) return [];
      const fetcher = getFetcher();
      const fileIdParam = fileIds.join(',');
      return fetcher.get('comments', { 
        select: '*',
        file_id: `in.(${fileIdParam})`
      });
    },
    enabled: fileIds.length > 0,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useLikes = (fileIds = [], options = {}) => {
  return useQuery({
    queryKey: ['likes', fileIds.join(',')],
    queryFn: async () => {
      if (!fileIds || fileIds.length === 0) return [];
      const fetcher = getFetcher();
      const fileIdParam = fileIds.join(',');
      return fetcher.get('likes', { 
        select: '*',
        file_id: `in.(${fileIdParam})`
      });
    },
    enabled: fileIds.length > 0,
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useShares = (userId = null, options = {}) => {
  return useQuery({
    queryKey: ['shares', userId],
    queryFn: async () => {
      const fetcher = getFetcher();
      if (userId) {
        return fetcher.get('shares', { 
          select: '*',
          or: `(recipient_id.eq.${userId},owner_id.eq.${userId})`
        });
      }
      return fetcher.get('shares', { select: '*', limit: 100 });
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

export const useChatMessages = (userId = null, options = {}) => {
  return useQuery({
    queryKey: ['chatMessages', userId],
    queryFn: async () => {
      const fetcher = getFetcher();
      if (userId) {
        const [general, privateMsgs] = await Promise.all([
          fetcher.get('chat_messages', { 
            select: '*',
            is_general: 'eq.true',
            order: 'created_at.desc',
            limit: 50
          }),
          fetcher.get('chat_messages', { 
            select: '*',
            or: `(sender_id.eq.${userId},recipient_id.eq.${userId})`,
            order: 'created_at.desc',
            limit: 50
          })
        ]);
        const combined = [...(general || []), ...(privateMsgs || [])];
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        return unique.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
      return fetcher.get('chat_messages', { 
        select: '*',
        order: 'created_at.desc',
        limit: 50
      });
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30,
    ...options,
  });
};

export const useNotifications = (userId, options = {}) => {
  return useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const fetcher = getFetcher();
      return fetcher.get('notifications', { 
        select: '*',
        user_id: `eq.${userId}`,
        order: 'created_at.desc',
        limit: 50
      });
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    ...options,
  });
};

export const useAddFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileData) => {
      const fetcher = getFetcher();
      return fetcher.post('files', fileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (commentData) => {
      const fetcher = getFetcher();
      return fetcher.post('comments', commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
};

export const useLikeFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ fileId, userId }) => {
      const fetcher = getFetcher();
      return fetcher.post('likes', { file_id: fileId, user_id: userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likes'] });
    },
  });
};

export const useShareFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (shareData) => {
      const fetcher = getFetcher();
      return fetcher.post('shares', shareData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shares'] });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fileId) => {
      const fetcher = getFetcher();
      return fetcher.delete(`files?id=eq.${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
};
