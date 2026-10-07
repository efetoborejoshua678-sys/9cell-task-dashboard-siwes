import { supabase } from '../lib/supabase';

// Helper for local caching fallback
function storageKey(userId = 'guest') {
  return `task-dashboard:tasks:${userId}`;
}

function readLocal(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(userId, tasks) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(tasks));
  } catch (err) {
    console.warn('localStorage write failed:', err);
  }
}

/**
 * Fetch tasks from Supabase with optional filters.
 */
export async function fetchTasks(filters = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { tasks: [], source: 'unauthenticated' };
    }

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    writeLocal(user.id, data || []);
    return { tasks: data || [], source: 'supabase' };
  } catch (err) {
    console.warn('Supabase fetchTasks error, falling back to local:', err.message);
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: {} }));
    return { tasks: applyLocalFilters(readLocal(user?.id), filters), source: 'local', error: err.message };
  }
}

/**
 * Create a new task in Supabase.
 */
export async function createTask(taskData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be logged in to create a task.');

  const payload = {
    user_id: user.id,
    title: taskData.title?.trim(),
    description: taskData.description?.trim() || '',
    due_date: taskData.due_date || taskData.dueDate || null,
    priority: taskData.priority || 'medium',
    category: taskData.category || 'General',
    status: taskData.status || 'todo',
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const local = readLocal(user.id);
  writeLocal(user.id, [data, ...local]);

  return { task: data, source: 'supabase' };
}

/**
 * Update an existing task in Supabase.
 */
export async function updateTask(id, taskData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be logged in to update a task.');

  const payload = {};
  if (taskData.title !== undefined) payload.title = taskData.title.trim();
  if (taskData.description !== undefined) payload.description = taskData.description.trim();
  if (taskData.due_date !== undefined || taskData.dueDate !== undefined) {
    payload.due_date = taskData.due_date ?? taskData.dueDate ?? null;
  }
  if (taskData.priority !== undefined) payload.priority = taskData.priority;
  if (taskData.category !== undefined) payload.category = taskData.category;
  if (taskData.status !== undefined) payload.status = taskData.status;

  const { data, error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  const local = readLocal(user.id).map((t) => (t.id === id ? data : t));
  writeLocal(user.id, local);

  return { task: data, source: 'supabase' };
}

/**
 * Move / update status or order of a task in Supabase.
 */
export async function moveTask(id, { status, order }) {
  const payload = {};
  if (status) payload.status = status;
  if (order !== undefined) payload.task_order = order;

  return updateTask(id, payload);
}

/**
 * Delete a task from Supabase.
 */
export async function deleteTask(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User must be logged in to delete a task.');

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  const local = readLocal(user.id).filter((t) => t.id !== id);
  writeLocal(user.id, local);

  return { source: 'supabase' };
}

/**
 * Fetch notifications for current user from Supabase.
 */
export async function fetchNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { notifications: [] };

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return { notifications: data || [] };
}

/**
 * Mark a notification as read in Supabase.
 */
export async function markNotificationRead(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}

/**
 * Create a notification in Supabase.
 */
export async function createNotification({ task_id, message, type = 'reminder' }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      task_id: task_id || null,
      message,
      type,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.warn('Failed to insert notification:', error.message);
    return null;
  }
  return data;
}

/**
 * Mark all notifications as read in Supabase.
 */
export async function markAllNotificationsRead() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) console.warn('Failed to mark all read:', error.message);
}

function applyLocalFilters(tasks, { priority, category, search }) {
  return tasks.filter((t) => {
    if (priority && t.priority !== priority) return false;
    if (category && t.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      const hit =
        t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q);
      if (!hit) return false;
    }
    return true;
  });
}
