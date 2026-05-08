// LMS Integration Utilities for Student Portfolio
// Supports Moodle, Canvas, Google Classroom APIs

/**
 * LMS API Client Base Class
 */
class LMSClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LMS API error: ${response.status} ${error}`);
    }
    
    return response.json();
  }
}

/**
 * Moodle API Client
 * Uses REST API format: /webservice/rest/server.php?wsfunction=xxx&wstoken=yyy&moodlewsrestformat=json
 */
export class MoodleClient extends LMSClient {
  constructor(moodleUrl, token) {
    super(`${moodleUrl}/webservice/rest/server.php`, token);
    this.format = 'json';
  }

  async request(endpoint, options = {}) {
    const params = new URLSearchParams({
      wstoken: this.token,
      moodlewsrestformat: this.format,
      ...options.params
    });
    
    const url = `${this.baseUrl}${endpoint}&${params}`;
    const response = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json' } });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Moodle API error: ${response.status} ${error}`);
    }
    
    return response.json();
  }

  async getCourses() {
    return this.request(`?wsfunction=core_course_get_courses`);
  }

  async getAssignments(courseId) {
    return this.request(`?wsfunction=mod_assign_get_assignments&courseids[0]=${courseId}`);
  }

  async getStudents(courseId) {
    return this.request(`?wsfunction=core_enrol_get_enrolled_users&courseid=${courseId}`);
  }

  async syncAssignment(assignment) {
    // Convert Moodle assignment to local format
    return {
      id: assignment.id.toString(),
      title: assignment.name,
      description: assignment.intro || '',
      dueDate: assignment.duedate ? new Date(assignment.duedate * 1000).toISOString() : null,
      maxPoints: assignment.grade ? parseInt(assignment.grade) : 100,
      courseId: assignment.course,
      externalId: assignment.id.toString()
    };
  }
}

/**
 * Canvas API Client
 * Uses REST API format: /api/v1/
 */
export class CanvasClient extends LMSClient {
  constructor(canvasUrl, token) {
    super(`${canvasUrl}/api/v1`, token);
  }

  async getCourses() {
    return this.request('/courses');
  }

  async getAssignments(courseId) {
    return this.request(`/courses/${courseId}/assignments`);
  }

  async getStudents(courseId) {
    return this.request(`/courses/${courseId}/students`);
  }

  async syncAssignment(assignment) {
    return {
      id: assignment.id.toString(),
      title: assignment.name,
      description: assignment.description || '',
      dueDate: assignment.due_at,
      maxPoints: assignment.points_possible || 100,
      courseId: assignment.course_id.toString(),
      externalId: assignment.id.toString()
    };
  }
}

/**
 * Google Classroom API Client
 * Uses Google APIs format
 */
export class GoogleClassroomClient {
  constructor(accessToken) {
    this.baseUrl = 'https://classroom.googleapis.com/v1';
    this.token = accessToken;
  }

  async request(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Classroom error: ${response.status}`);
    }

    return response.json();
  }

  async getCourses() {
    return this.request('/courses');
  }

  async getAssignments(courseId) {
    return this.request(`/courses/${courseId}/courseWork`);
  }

  async getStudents(courseId) {
    return this.request(`/courses/${courseId}/students`);
  }

  async syncAssignment(assignment) {
    return {
      id: assignment.courseWorkId,
      title: assignment.title,
      description: assignment.description || '',
      dueDate: assignment.dueDate ? 
        `${assignment.dueDate.year}-${assignment.dueDate.month.toString().padStart(2, '0')}-${assignment.dueDate.day.toString().padStart(2, '0')}` : 
        null,
      maxPoints: assignment.maxPoints || 100,
      courseId: assignment.courseId,
      externalId: assignment.courseWorkId
    };
  }
}

/**
 * Factory to create appropriate LMS client
 */
export function createLMSClient(type, ...args) {
  switch (type.toLowerCase()) {
    case 'moodle':
      return new MoodleClient(...args);
    case 'canvas':
      return new CanvasClient(...args);
    case 'google':
    case 'classroom':
      return new GoogleClassroomClient(...args);
    default:
      throw new Error(`Unsupported LMS type: ${type}`);
  }
}

/**
 * Sync assignments from LMS to local database
 */
export async function syncLMSAssignments(client, courseId, studentId) {
  try {
    const assignments = await client.getAssignments(courseId);
    return assignments.map(a => client.syncAssignment(a));
  } catch (error) {
    console.error('LMS sync error:', error);
    return [];
  }
}

const lmsUtils = {
  MoodleClient,
  CanvasClient,
  GoogleClassroomClient,
  createLMSClient,
  syncLMSAssignments
};

export default lmsUtils;