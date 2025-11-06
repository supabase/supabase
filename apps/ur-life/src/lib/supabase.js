/**
 * Supabase Client Configuration
 * Handles Supabase authentication and database operations
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// ===================================================================
// AUTHENTICATION FUNCTIONS
// ===================================================================

/**
 * Sign in user with email and password
 */
export async function signIn(netId, password) {
  try {
    // Convert netId to email format (netId@ur-life.app)
    const email = `${netId}@ur-life.app`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return { success: true, user: data.user, session: data.session };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign up new user
 */
export async function signUp(netId, password, userData) {
  try {
    const email = `${netId}@ur-life.app`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          net_id: netId,
          name: userData.name,
          major: userData.major,
          year: userData.year
        }
      }
    });

    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Signout error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current user session
 */
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session?.user || null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, error: error.message };
  }
}

// ===================================================================
// PROFILE FUNCTIONS
// ===================================================================

/**
 * Get user profile
 */
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Get profile error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update user profile
 */
export async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Update profile error:', error);
    return { success: false, error: error.message };
  }
}

// ===================================================================
// TASKS FUNCTIONS
// ===================================================================

/**
 * Get all tasks for user
 */
export async function getTasks(userId) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Get tasks error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add new task
 */
export async function addTask(userId, taskData) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        user_id: userId,
        text: taskData.text,
        date: taskData.date,
        completed: false
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Add task error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update task
 */
export async function updateTask(taskId, updates) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Update task error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete task
 */
export async function deleteTask(taskId) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete task error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Move task to history
 */
export async function completeTask(taskId, userId, taskText, originalDate) {
  try {
    // Add to history
    const { error: historyError } = await supabase
      .from('task_history')
      .insert([{
        user_id: userId,
        text: taskText,
        original_date: originalDate
      }]);

    if (historyError) throw historyError;

    // Delete from tasks
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Complete task error:', error);
    return { success: false, error: error.message };
  }
}

// ===================================================================
// TASK HISTORY FUNCTIONS
// ===================================================================

/**
 * Get task history
 */
export async function getTaskHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('task_history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Get history error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Restore task from history
 */
export async function restoreTask(historyId, userId, taskText, originalDate) {
  try {
    // Add back to tasks
    const { error: taskError } = await supabase
      .from('tasks')
      .insert([{
        user_id: userId,
        text: taskText,
        date: originalDate || new Date().toISOString().split('T')[0],
        completed: false
      }]);

    if (taskError) throw taskError;

    // Delete from history
    const { error: deleteError } = await supabase
      .from('task_history')
      .delete()
      .eq('id', historyId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Restore task error:', error);
    return { success: false, error: error.message };
  }
}

// ===================================================================
// CONTACTS FUNCTIONS
// ===================================================================

/**
 * Get all contacts for user
 */
export async function getContacts(userId) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Get contacts error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add new contact
 */
export async function addContact(userId, contactData) {
  try {
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        user_id: userId,
        category: contactData.category,
        name: contactData.name,
        email: contactData.email
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Add contact error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete contact
 */
export async function deleteContact(contactId) {
  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete contact error:', error);
    return { success: false, error: error.message };
  }
}

// ===================================================================
// DEGREE PROGRESS FUNCTIONS
// ===================================================================

/**
 * Get degree progress for user
 */
export async function getDegreeProgress(userId) {
  try {
    const { data, error } = await supabase
      .from('degree_progress')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Get degree progress error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update degree progress item
 */
export async function updateDegreeProgress(userId, category, courseCode, completed) {
  try {
    const { data, error } = await supabase
      .from('degree_progress')
      .update({ completed })
      .eq('user_id', userId)
      .eq('category', category)
      .eq('course_code', courseCode)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Update degree progress error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Initialize degree progress for new user
 */
export async function initializeDegreeProgress(userId, major) {
  // This would be called when a new user is created
  // You can customize the courses based on the major
  const defaultCourses = {
    'Computer Science': [
      { category: 'premajor', course_code: 'CSC 171', course_name: 'Introduction to Computer Science' },
      { category: 'premajor', course_code: 'CSC 172', course_name: 'Data Structures and Algorithms' },
      { category: 'core', course_code: 'CSC 252', course_name: 'Computer Organization' },
      { category: 'math', course_code: 'MTH 150', course_name: 'Discrete Mathematics' },
      // Add more courses as needed
    ]
  };

  try {
    const courses = defaultCourses[major] || [];
    const inserts = courses.map(course => ({
      user_id: userId,
      category: course.category,
      course_code: course.course_code,
      course_name: course.course_name,
      completed: false
    }));

    const { error } = await supabase
      .from('degree_progress')
      .insert(inserts);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Initialize degree progress error:', error);
    return { success: false, error: error.message };
  }
}

// ===================================================================
// COURSES FUNCTIONS
// ===================================================================

/**
 * Get all courses for user
 */
export async function getCourses(userId) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Get courses error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add new course
 */
export async function addCourse(userId, courseData) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        user_id: userId,
        day: courseData.day,
        start_time: courseData.start_time,
        end_time: courseData.end_time,
        course_name: courseData.course_name,
        location: courseData.location,
        color: courseData.color || '#4a90e2'
      }])
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Add course error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update course
 */
export async function updateCourse(courseId, updates) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Update course error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete course
 */
export async function deleteCourse(courseId) {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Delete course error:', error);
    return { success: false, error: error.message };
  }
}
