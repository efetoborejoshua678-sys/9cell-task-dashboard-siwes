import React from 'react';

export default function NotificationDropdown({
  notifications = [],
  dueSoonTasks = [],
  overdueTasks = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onClose,
}) {
  const combinedList = [
    ...overdueTasks.map((task) => ({
      id: `overdue-${task.id}`,
      type: 'overdue',
      message: `Task "${task.title}" is overdue!`,
      time: task.due_date,
      is_read: false,
      rawTask: task,
    })),
    ...dueSoonTasks.map((task) => ({
      id: `duesoon-${task.id}`,
      type: 'reminder',
      message: `Task "${task.title}" is due soon.`,
      time: task.due_date,
      is_read: false,
      rawTask: task,
    })),
    ...notifications,
  ];

  const unreadCount = combinedList.filter((item) => !item.is_read).length;

  return (
    <div className="notification-dropdown-panel" role="dialog" aria-label="Notifications Panel">
      <div className="notification-panel-header">
        <div className="panel-title-wrap">
          <h3>Notifications</h3>
          {unreadCount > 0 && <span className="unread-badge">{unreadCount} new</span>}
        </div>
        <div className="panel-header-actions">
          {unreadCount > 0 && (
            <button type="button" className="mark-all-btn" onClick={onMarkAllAsRead}>
              Mark all read
            </button>
          )}
          <button type="button" className="panel-close-btn" onClick={onClose} aria-label="Close notifications">
            x
          </button>
        </div>
      </div>

      <div className="notification-panel-body">
        {combinedList.length > 0 ? (
          combinedList.map((item) => (
            <div
              key={item.id}
              className={`notification-item ${item.type} ${item.is_read ? 'is-read' : 'unread'}`}
              onClick={() => onMarkAsRead(item.id)}
            >
              <div className="item-icon-col">
                <span className={`item-type-icon ${item.type}`}>
                  {item.type === 'overdue' ? '!' : item.type === 'reminder' ? 'D' : 'N'}
                </span>
              </div>
              <div className="item-text-col">
                <p className="item-message">{item.message}</p>
                <span className="item-time">
                  {item.time
                    ? new Date(item.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                    : 'Recent'}
                </span>
              </div>
              {!item.is_read && <span className="unread-dot" title="Unread" />}
            </div>
          ))
        ) : (
          <div className="notification-empty">
            <span className="empty-bell">N</span>
            <p>You're all caught up!</p>
            <small>No pending task reminders or alerts right now.</small>
          </div>
        )}
      </div>
    </div>
  );
}
