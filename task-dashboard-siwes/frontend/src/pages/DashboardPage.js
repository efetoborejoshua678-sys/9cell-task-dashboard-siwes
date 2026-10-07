import React, { useState, useEffect } from 'react';
import appIcon from '../assest/9cel_app-icon.png';
import UserProfile from '../components/UserProfile';
import NotificationDropdown from '../components/NotificationDropdown';
import ToastAlert from '../components/ToastAlert';
import Board from '../components/Board';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '../services/taskService';
import { checkTaskReminders } from '../services/reminderService';

const dashboardViews = [
  { id: 'all', label: 'Home', icon: 'H' },
  { id: 'my-tasks', label: 'My Tasks', icon: 'T' },
  { id: 'kanban', label: 'Kanban Board', icon: 'K' },
  { id: 'today', label: 'Today', icon: 'D' },
  { id: 'upcoming', label: 'Upcoming', icon: 'U' },
  { id: 'completed', label: 'Completed', icon: 'C' },
  { id: 'profile', label: 'Profile', icon: 'P' },
];

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(value) {
  if (!value) return 'No deadline';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No deadline';
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getCalendarDates(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const offset = firstDay.getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cellCount = Math.ceil((offset + daysInMonth) / 7) * 7;

  return Array.from({ length: cellCount }, (_value, index) => (
    new Date(monthDate.getFullYear(), monthDate.getMonth(), index - offset + 1)
  ));
}

export default function DashboardPage({ tasks, userEmail, userName, onBackToLanding, onCreateTask, onEditTask, onDeleteTask, onToggleTask, onMoveTask, taskError, previewMode = false }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [activeView, setActiveView] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications & Toast State
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [readVirtualIds, setReadVirtualIds] = useState(new Set());

  const todayKey = getDateKey(today);
  const selectedKey = getDateKey(selectedDate);
  const todayTasks = tasks.filter((task) => task.status !== 'done' && task.due_date && getDateKey(new Date(task.due_date)) === todayKey);
  const selectedTasks = tasks.filter((task) => task.status !== 'done' && task.due_date && getDateKey(new Date(task.due_date)) === selectedKey);
  const completedTasks = tasks.filter((task) => task.status === 'done');
  const inProgressTasks = tasks.filter((task) => task.status === 'in-progress');
  const overdueTasks = tasks.filter((task) => task.status !== 'done' && task.due_date && new Date(task.due_date).getTime() < Date.now());
  const dueSoonTasks = tasks.filter(
    (task) =>
      task.status !== 'done' &&
      task.due_date &&
      new Date(task.due_date).getTime() >= Date.now() &&
      new Date(task.due_date).getTime() <= Date.now() + 24 * 60 * 60 * 1000
  );

  // Periodic reminder engine: checks 24h, 2h, and overdue rules automatically
  useEffect(() => {
    let timerId;

    const runReminderCheck = async () => {
      if (!tasks.length) return;
      const newAlerts = await checkTaskReminders(tasks);
      if (newAlerts && newAlerts.length > 0) {
        setToasts((prev) => [...prev, ...newAlerts]);
      }
      if (!previewMode) {
        const { notifications: fetched } = await fetchNotifications();
        setDbNotifications(fetched || []);
      }
    };

    runReminderCheck();
    timerId = setInterval(runReminderCheck, 60000); // Re-check every 60s

    return () => clearInterval(timerId);
  }, [tasks, previewMode]);

  useEffect(() => {
    const unreadOverdue = overdueTasks.filter((t) => !readVirtualIds.has(`overdue-${t.id}`));
    const unreadDueSoon = dueSoonTasks.filter((t) => !readVirtualIds.has(`duesoon-${t.id}`));

    const generatedToasts = [];
    if (unreadOverdue.length > 0) {
      generatedToasts.push({
        id: `toast-overdue-${unreadOverdue[0].id}`,
        type: 'overdue',
        title: `${unreadOverdue.length} Task${unreadOverdue.length > 1 ? 's' : ''} Overdue!`,
        message: `Task "${unreadOverdue[0].title}" requires attention.`,
      });
    }
    if (unreadDueSoon.length > 0) {
      generatedToasts.push({
        id: `toast-duesoon-${unreadDueSoon[0].id}`,
        type: 'warning',
        title: `${unreadDueSoon.length} Task${unreadDueSoon.length > 1 ? 's' : ''} Due Soon!`,
        message: `Task "${unreadDueSoon[0].title}" is due soon.`,
      });
    }

    if (generatedToasts.length > 0) {
      setToasts((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const filtered = generatedToasts.filter((t) => !existingIds.has(t.id));
        return [...prev, ...filtered];
      });
    }
  }, [tasks, readVirtualIds, dueSoonTasks, overdueTasks]);

  const handleMarkAsRead = async (id) => {
    if (typeof id === 'string' && (id.startsWith('overdue-') || id.startsWith('duesoon-'))) {
      setReadVirtualIds((prev) => new Set([...prev, id]));
    } else {
      try {
        await markNotificationRead(id);
        setDbNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      } catch (err) {
        console.warn('Failed to mark read:', err);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    const newVirtuals = new Set(readVirtualIds);
    overdueTasks.forEach((t) => newVirtuals.add(`overdue-${t.id}`));
    dueSoonTasks.forEach((t) => newVirtuals.add(`duesoon-${t.id}`));
    setReadVirtualIds(newVirtuals);

    try {
      await markAllNotificationsRead();
      setDbNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  const dismissToast = (toastId) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const activeOverdueUnread = overdueTasks.filter((t) => !readVirtualIds.has(`overdue-${t.id}`));
  const activeDueSoonUnread = dueSoonTasks.filter((t) => !readVirtualIds.has(`duesoon-${t.id}`));
  const activeDbUnread = dbNotifications.filter((n) => !n.is_read);
  const totalUnreadNotices = activeOverdueUnread.length + activeDueSoonUnread.length + activeDbUnread.length;
  const calendarDates = getCalendarDates(calendarMonth);
  const monthLabel = calendarMonth.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const displayName = userName || userEmail.split('@')[0].replace(/[._-]/g, ' ');
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';
  const overviewCards = [
    { label: 'Total tasks', value: tasks.length, icon: 'T', tone: 'blue' },
    { label: 'Completed', value: completedTasks.length, icon: 'C', tone: 'green' },
    { label: 'In progress', value: inProgressTasks.length, icon: 'P', tone: 'sky' },
    { label: 'Overdue', value: overdueTasks.length, icon: '!', tone: 'red' },
  ];

  const visibleTasks = tasks
    .filter((task) => {
      const matchesSearch = !searchQuery || `${task.title} ${task.description || ''} ${task.category || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (activeView === 'completed') return task.status === 'done';
      if (activeView === 'upcoming') return task.status !== 'done' && task.due_date && new Date(task.due_date).getTime() > Date.now();
      if (activeView === 'today') return task.status !== 'done' && task.due_date && getDateKey(new Date(task.due_date)) === selectedKey;
      return task.status !== 'done';
    })
    .sort((first, second) => {
      if (!first.due_date) return 1;
      if (!second.due_date) return -1;
      return new Date(first.due_date) - new Date(second.due_date);
    });

  const sectionTitle = activeView === 'completed'
    ? 'Completed tasks'
    : activeView === 'upcoming'
      ? 'Upcoming tasks'
      : activeView === 'all'
        ? 'All open tasks'
      : activeView === 'my-tasks'
        ? 'My tasks'
        : selectedKey === todayKey
          ? "Today's tasks"
          : selectedDate.toLocaleDateString([], { month: 'long', day: 'numeric' });

  const changeView = (view) => {
    setActiveView(view);
    if (view === 'today') setSelectedDate(new Date());
  };

  const changeMonth = (offset) => {
    setCalendarMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  if (activeView === 'profile') {
    return (
      <UserProfile
        userName={displayName}
        userEmail={userEmail}
        tasks={tasks}
        onBackToDashboard={() => setActiveView('today')}
        onSignOut={onBackToLanding}
        previewMode={previewMode}
      />
    );
  }

  return (
    <div className="dashboard-shell">
      {/* Toast Alert Notifications Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <ToastAlert key={toast.id} toast={toast} onClose={dismissToast} />
        ))}
      </div>

      <aside className="dashboard-sidebar">
        <div className="dashboard-brand">
          <img src={appIcon} alt="" className="dashboard-brand-icon" />
          <span>Task Dashboard</span>
        </div>

        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          {dashboardViews.map((item) => (
            <button key={`${item.id}-${item.label}`} type="button" className={`dashboard-nav-item ${activeView === item.id ? 'active' : ''}`} onClick={() => changeView(item.id)}>
              <span className="dashboard-nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.label === 'Today' && <span className="dashboard-nav-count">{todayTasks.length}</span>}
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-progress">
          <p>Weekly progress</p>
          <strong>{tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%</strong>
          <div className="dashboard-progress-track"><span style={{ width: `${tasks.length ? (completedTasks.length / tasks.length) * 100 : 0}%` }} /></div>
          <small>{completedTasks.length} of {tasks.length} tasks completed</small>
        </div>

        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-mini-avatar" onClick={() => setActiveView('profile')} style={{ cursor: 'pointer' }} title="View Profile">{displayName.slice(0, 1).toUpperCase()}</div>
          <div className="dashboard-sidebar-user" onClick={() => setActiveView('profile')} style={{ cursor: 'pointer' }} title="View Profile"><strong>{displayName || 'Your workspace'}</strong><span>{previewMode ? 'Design preview' : 'Personal workspace'}</span></div>
          <button type="button" className="dashboard-signout" onClick={onBackToLanding} title={previewMode ? 'Back to home' : 'Sign out'} aria-label={previewMode ? 'Back to home' : 'Sign out'}>
            {previewMode ? 'Home' : 'Exit'}
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-greeting">
            <p>{greeting}, {displayName || 'there'}<span aria-hidden="true">!</span></p>
            <h1>You have {selectedTasks.length} task{selectedTasks.length === 1 ? '' : 's'} due {selectedKey === todayKey ? 'today' : `on ${selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}`}.</h1>
          </div>

          <div className="dashboard-topbar-tools">
            <label className="dashboard-search">
              <span aria-hidden="true">Search</span>
              <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search tasks..." aria-label="Search tasks" />
            </label>
            <button
              type="button"
              className="dashboard-notice-button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              aria-label={`${totalUnreadNotices} task notifications`}
            >
              <span aria-hidden="true">!</span>
              {totalUnreadNotices > 0 && <i>{totalUnreadNotices}</i>}
            </button>
            {isNotificationOpen && (
              <NotificationDropdown
                notifications={dbNotifications}
                dueSoonTasks={dueSoonTasks}
                overdueTasks={overdueTasks}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                onClose={() => setIsNotificationOpen(false)}
              />
            )}
            <div className="dashboard-user-avatar" onClick={() => setActiveView('profile')} style={{ cursor: 'pointer' }} title="View Profile">{displayName.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>

        {previewMode && <p className="dashboard-preview-note" role="status">Read-only design preview with sample tasks.</p>}
        {taskError && <p className="form-error" role="alert">{taskError}</p>}

        <section className="dashboard-summary-grid" aria-label="Task summary">
          {overviewCards.map((card) => (
            <article key={card.label} className="dashboard-summary-card">
              <div className={`dashboard-summary-icon ${card.tone}`} aria-hidden="true">{card.icon}</div>
              <div><span>{card.label}</span><strong>{card.value}</strong></div>
              <span className="dashboard-summary-trend">{card.label === 'Completed' ? 'Done' : card.label === 'Overdue' ? (card.value ? 'Needs attention' : 'All clear') : 'This workspace'}</span>
            </article>
          ))}
        </section>

        <section className="dashboard-task-section">
          <div className="dashboard-section-heading">
            <div>
              <p className="dashboard-section-kicker">YOUR WORKSPACE</p>
              <h2>{sectionTitle}</h2>
            </div>
            <div className="dashboard-view-toggles">
              <button
                type="button"
                className={`dashboard-view-all ${activeView === 'kanban' ? 'active-toggle' : ''}`}
                onClick={() => changeView(activeView === 'kanban' ? 'today' : 'kanban')}
              >
                {activeView === 'kanban' ? 'List View' : 'Kanban Board'} <span aria-hidden="true">-&gt;</span>
              </button>
            </div>
          </div>

          {activeView === 'kanban' ? (
            <Board
              tasksByColumn={{
                todo: tasks.filter((t) => t.status === 'todo' || !t.status),
                'in-progress': tasks.filter((t) => t.status === 'in-progress'),
                done: tasks.filter((t) => t.status === 'done'),
              }}
              onDragEnd={(result) => {
                const { destination, source, draggableId } = result;
                if (!destination) return;
                if (destination.droppableId === source.droppableId && destination.index === source.index) return;
                if (onMoveTask) {
                  onMoveTask(draggableId, destination.droppableId, destination.index);
                }
              }}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onAdd={(colId) => {
                if (onCreateTask) onCreateTask();
              }}
            />
          ) : (
            <div className="dashboard-task-list">
              {visibleTasks.length ? visibleTasks.map((task) => (
                <article className={`dashboard-task-row ${task.status === 'done' ? 'is-complete' : ''}`} key={task.id}>
                  <label className="dashboard-task-check">
                    <input type="checkbox" checked={task.status === 'done'} onChange={() => onToggleTask?.(task)} disabled={previewMode || !onToggleTask} aria-label={`${task.status === 'done' ? 'Reopen' : 'Complete'} ${task.title}`} />
                    <span />
                  </label>
                  <div className="dashboard-task-title-wrap">
                    <h3>{task.title}</h3>
                    <span>{task.category || 'General'}{task.description ? `  /  ${task.description}` : ''}</span>
                  </div>
                  <span className={`dashboard-priority ${task.priority || 'medium'}`}><i />{task.priority || 'medium'}</span>
                  <time>{formatTime(task.due_date)}</time>
                  <div className="dashboard-task-actions">
                    {onEditTask && <button type="button" onClick={() => onEditTask(task)} disabled={previewMode}>Edit</button>}
                    {onDeleteTask && <button type="button" onClick={() => onDeleteTask(task)} disabled={previewMode} aria-label={`Delete ${task.title}`}>Delete</button>}
                  </div>
                </article>
              )) : (
                <div className="dashboard-empty-state">
                  <span className="dashboard-empty-icon">{searchQuery ? 'S' : 'T'}</span>
                  <h3>{searchQuery ? 'No matching tasks' : 'Nothing on your list yet'}</h3>
                  <p>{searchQuery ? 'Try another search.' : 'Add a task to give your day a clear next step.'}</p>
                  {!previewMode && onCreateTask && <button type="button" className="dashboard-primary-button" onClick={onCreateTask}>+ Add task</button>}
                </div>
              )}
            </div>
          )}
          {!previewMode && onCreateTask && <button type="button" className="dashboard-add-task" onClick={onCreateTask}>+ Add a task</button>}
        </section>
      </main>

      <aside className="dashboard-right-rail">
        <section className="dashboard-calendar" id="dashboard-calendar">
          <div className="dashboard-calendar-heading">
            <h2>{monthLabel}</h2>
            <div>
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">&lt;</button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Next month">&gt;</button>
            </div>
          </div>
          <div className="dashboard-calendar-grid dashboard-weekdays">
            {weekdays.map((weekday) => <span key={weekday}>{weekday}</span>)}
          </div>
          <div className="dashboard-calendar-grid">
            {calendarDates.map((date) => {
              const dateKey = getDateKey(date);
              const inCurrentMonth = date.getMonth() === calendarMonth.getMonth();
              const hasTasks = tasks.some((task) => task.due_date && getDateKey(new Date(task.due_date)) === dateKey);
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedKey;
              return (
                <button key={dateKey} type="button" className={`dashboard-calendar-day ${inCurrentMonth ? '' : 'outside-month'} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`} onClick={() => { setSelectedDate(date); setActiveView('today'); }} aria-label={date.toLocaleDateString()} aria-pressed={isSelected}>
                  {date.getDate()}
                  {hasTasks && <i />}
                </button>
              );
            })}
          </div>
          <p className="dashboard-calendar-selected">Selected: {selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
        </section>

        <section className="dashboard-quick-actions">
          <div className="dashboard-quick-heading"><h2>Quick actions</h2><span>+</span></div>
          <button type="button" onClick={onCreateTask} disabled={previewMode || !onCreateTask}><span className="quick-action-icon add">+</span>Add task</button>
          <button type="button" onClick={() => changeView('upcoming')}><span className="quick-action-icon upcoming">U</span>View upcoming</button>
          <button type="button" onClick={() => document.getElementById('dashboard-calendar')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}><span className="quick-action-icon today">C</span>View calendar</button>
        </section>

        <section className="dashboard-focus-note">
          <p>YOUR NEXT STEP</p>
          <h3>{visibleTasks[0]?.title || 'A clear space to begin'}</h3>
          <span>{visibleTasks[0] ? `Priority: ${visibleTasks[0].priority || 'medium'}` : 'Add a task whenever you are ready.'}</span>
        </section>
      </aside>
    </div>
  );
}
