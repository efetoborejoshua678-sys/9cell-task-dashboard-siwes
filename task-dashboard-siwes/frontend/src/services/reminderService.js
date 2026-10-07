import { createNotification } from './taskService';

const REMINDER_CACHE_KEY = 'task-dashboard:sent-reminders';

function getSentReminders() {
  try {
    const raw = localStorage.getItem(REMINDER_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function markReminderSent(taskId, stage) {
  const cache = getSentReminders();
  cache[`${taskId}:${stage}`] = Date.now();
  try {
    localStorage.setItem(REMINDER_CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn('Failed to save reminder cache:', err);
  }
}

function hasReminderBeenSent(taskId, stage) {
  const cache = getSentReminders();
  return Boolean(cache[`${taskId}:${stage}`]);
}

/**
 * Automatically inspect active tasks against current time:
 * 1. Overdue: past due_date and status !== 'done'
 * 2. Urgent (2h): due within 2 hours
 * 3. Due Soon (24h): due within 24 hours
 *
 * Emits notifications and returns real-time toast alert objects.
 */
export async function checkTaskReminders(tasks = []) {
  const now = Date.now();
  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const newToastAlerts = [];

  for (const task of tasks) {
    if (task.status === 'done' || !task.due_date) continue;

    const dueTime = new Date(task.due_date).getTime();
    if (Number.isNaN(dueTime)) continue;

    const diff = dueTime - now;

    // Rule 1: OVERDUE (past due date)
    if (diff < 0) {
      if (!hasReminderBeenSent(task.id, 'overdue')) {
        markReminderSent(task.id, 'overdue');
        const timeStr = new Date(task.due_date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
        const message = `Task "${task.title}" is OVERDUE! It was due at ${timeStr}.`;

        await createNotification({
          task_id: task.id,
          message,
          type: 'overdue',
        }).catch(() => null);

        newToastAlerts.push({
          id: `toast-overdue-${task.id}-${now}`,
          type: 'overdue',
          title: '🚨 Task Overdue!',
          message: `"${task.title}" has passed its due date.`,
        });
      }
    }
    // Rule 2: URGENT (due within 2 hours)
    else if (diff <= TWO_HOURS_MS) {
      if (!hasReminderBeenSent(task.id, '2h')) {
        markReminderSent(task.id, '2h');
        const message = `Urgent Reminder: Task "${task.title}" is due in less than 2 hours!`;

        await createNotification({
          task_id: task.id,
          message,
          type: 'reminder',
        }).catch(() => null);

        newToastAlerts.push({
          id: `toast-2h-${task.id}-${now}`,
          type: 'warning',
          title: '⚡ Urgent: Due in < 2 Hours!',
          message: `"${task.title}" needs completion soon.`,
        });
      }
    }
    // Rule 3: DUE SOON (due within 24 hours)
    else if (diff <= TWENTY_FOUR_HOURS_MS) {
      if (!hasReminderBeenSent(task.id, '24h')) {
        markReminderSent(task.id, '24h');
        const message = `Reminder: Task "${task.title}" is due within 24 hours.`;

        await createNotification({
          task_id: task.id,
          message,
          type: 'reminder',
        }).catch(() => null);

        newToastAlerts.push({
          id: `toast-24h-${task.id}-${now}`,
          type: 'info',
          title: '🔔 Due Soon (24 Hours)',
          message: `"${task.title}" is due within 24 hours.`,
        });
      }
    }
  }

  return newToastAlerts;
}
