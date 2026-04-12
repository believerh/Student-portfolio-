import { createClient } from '@supabase/supabase-js';

let storageClient = null;

export const initStorageClient = (url, key) => {
  if (!storageClient) {
    storageClient = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return storageClient;
};

export const getStorageClient = () => storageClient;

export const uploadFileToStorage = async (bucket, filePath, file) => {
  if (!storageClient) {
    throw new Error('Storage client not initialized');
  }

  const { data, error } = await storageClient
    .storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  return data;
};

export const getFileUrl = (bucket, filePath) => {
  if (!storageClient) {
    throw new Error('Storage client not initialized');
  }

  const { data } = storageClient
    .storage
    .from(bucket)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const deleteFileFromStorage = async (bucket, filePath) => {
  if (!storageClient) {
    throw new Error('Storage client not initialized');
  }

  const { error } = await storageClient
    .storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw error;
  }
};

export const generateStoragePath = (userId, fileName) => {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${userId}/${timestamp}-${sanitizedName}`;
};
