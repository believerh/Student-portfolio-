/**
 * Full-text search utility for Student Portfolio
 * Searches across files, users, and comments in-memory.
 * Supports fuzzy matching on name, email, tags, and content.
 */

/**
 * Normalize a string for search comparison
 */
const normalize = (str) => (str || '').toLowerCase().trim();

/**
 * Check if a value matches the search query (partial/fuzzy)
 */
const matches = (value, query) => {
  if (!query) return true;
  const norm = normalize(value);
  // Split query into words for multi-word matching
  const words = query.split(/\s+/).filter(Boolean);
  return words.every((w) => norm.includes(w));
};

/**
 * Search across files
 */
export const searchFiles = (files, query, filters = {}) => {
  const { type = 'all', dateFrom, dateTo } = filters;

  const allFiles = Object.entries(files).flatMap(([studentId, fileList]) =>
    fileList.map((f) => ({ ...f, ownerUserId: studentId }))
  );

  return allFiles.filter((file) => {
    // Text search across name, type, mime_type, description, tags
    const searchable = [file.name, file.type, file.mime_type, file.description, ...(file.tags || [])].join(' ');
    if (!matches(searchable, query)) return false;

    // Type filter
    if (type !== 'all' && file.type !== type) return false;

    // Date filters
    if (dateFrom && file.created_at) {
      const fileDate = new Date(file.created_at);
      const fromDate = new Date(dateFrom);
      if (fileDate < fromDate) return false;
    }
    if (dateTo && file.created_at) {
      const fileDate = new Date(file.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (fileDate > toDate) return false;
    }

    return true;
  });
};

/**
 * Search across users (students + teachers)
 */
export const searchUsers = (students, teachers, query, filters = {}) => {
  const { role = 'all' } = filters;

  const results = [];

  if (role === 'all' || role === 'student') {
    (students || []).forEach((s) => {
      const searchable = [s.name, s.email, s.role, ...(s.skills || [])].join(' ');
      if (matches(searchable, query)) {
        results.push({ ...s, role: 'student' });
      }
    });
  }

  if (role === 'all' || role === 'teacher') {
    (teachers || []).forEach((t) => {
      const searchable = [t.name, t.email, t.role, ...(t.skills || [])].join(' ');
      if (matches(searchable, query)) {
        results.push({ ...t, role: 'teacher' });
      }
    });
  }

  return results;
};

/**
 * Search across comments
 */
export const searchComments = (comments, query, files = {}) => {
  if (!query) return [];

  const results = [];
  Object.entries(comments).forEach(([fileId, commentList]) => {
    commentList.forEach((comment) => {
      if (matches(comment.text, query) || matches(comment.author, query)) {
        // Find the associated file for context
        let associatedFile = null;
        for (const [userId, fileList] of Object.entries(files)) {
          const found = fileList.find((f) => f.id === fileId);
          if (found) {
            associatedFile = { ...found, ownerUserId: userId };
            break;
          }
        }
        results.push({ ...comment, fileId, file: associatedFile });
      }
    });
  });

  return results;
};

/**
 * Unified search — returns { files, users, comments }
 */
export const performSearch = (query, filters, data) => {
  const { files, students, teachers, comments } = data;

  if (!query && !filters.type && !filters.dateFrom && !filters.dateTo && filters.role === 'all') {
    return { files: [], users: [], comments: [], active: false };
  }

  return {
    files: searchFiles(files, query, filters),
    users: searchUsers(students, teachers, query, filters),
    comments: searchComments(comments, query, files),
    active: true,
  };
};
