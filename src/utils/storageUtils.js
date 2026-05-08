import { createClient } from '@supabase/supabase-js';

let storageClient = null;

export const initStorageClient = (url, key) => {
  storageClient = createClient(url, key);
  return storageClient;
};

export const getStorageClient = () => storageClient;

export const resetStorageClient = () => {
  storageClient = null;
};

// Upload a file to Supabase Storage and return its public URL
export const uploadFileToStorage = async (bucket, userId, file) => {
  if (!storageClient) throw new Error('Storage client not initialized');

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId}/${timestamp}-${sanitizedName}`;

  const { error } = await storageClient.storage
    .from(bucket)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data: urlData } = storageClient.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: urlData.publicUrl,
  };
};

// Delete a file from Supabase Storage
export const deleteFileFromStorage = async (bucket, filePath) => {
  if (!storageClient) throw new Error('Storage client not initialized');
  const { error } = await storageClient.storage.from(bucket).remove([filePath]);
  if (error) throw error;
};

// Get public URL for an existing file path
export const getFileUrl = (bucket, filePath) => {
  if (!storageClient) throw new Error('Storage client not initialized');
  const { data } = storageClient.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

// Determine Supabase Storage bucket from file type
export const getBucketForType = (type) => {
  switch (type) {
    case 'video': return 'videos';
    case 'image': return 'images';
    case 'audio': return 'audio';
    default: return 'documents';
  }
};
