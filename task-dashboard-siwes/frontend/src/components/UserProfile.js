import React from 'react';

export default function UserProfile({
  userName,
  userEmail,
  tasks = [],
  onBackToDashboard,
  onSignOut,
  previewMode = false,
}) {
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const inProgressTasks = tasks.filter((t) => t.status === 'in-progress');
  const todoTasks = tasks.filter((t) => t.status === 'todo' || !t.status);
  const pendingTasks = inProgressTasks.length + todoTasks.length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.due_date && new Date(t.due_date).getTime() < Date.now()
  );

  const totalTasksCount = tasks.length;
  const completionPercentage = totalTasksCount
    ? Math.round((completedTasks.length / totalTasksCount) * 100)
    : 0;

  // Category breakdown
  const categoryCounts = tasks.reduce((acc, task) => {
    const cat = task.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  // Priority breakdown
  const highCount = tasks.filter((t) => t.priority === 'high').length;
  const medCount = tasks.filter((t) => t.priority === 'medium').length;
  const lowCount = tasks.filter((t) => t.priority === 'low' || !t.priority).length;

  const displayName = userName || (userEmail ? userEmail.split('@')[0].replace(/[._-]/g, ' ') : 'User');
  const userInitial = displayName.slice(0, 1).toUpperCase();

  return (
    <div className="profile-page-shell">
      {/* Profile Top Navigation Header */}
      <header className="profile-header">
        <button type="button" className="profile-back-btn" onClick={onBackToDashboard}>
          <span aria-hidden="true">&lt;-</span> Back to Dashboard
        </button>
        <div className="profile-header-actions">
          <button type="button" className="profile-signout-btn" onClick={onSignOut}>
            {previewMode ? 'Exit Preview' : 'Sign Out'}
          </button>
        </div>
      </header>

      <div className="profile-content-grid">
        {/* Main User Card */}
        <section className="profile-card profile-user-card">
          <div className="profile-avatar-large">
            <span>{userInitial}</span>
          </div>
          <div className="profile-user-info">
            <h2>{displayName}</h2>
            <p className="profile-email">{userEmail || 'user@example.com'}</p>
            <div className="profile-badges">
              <span className="profile-badge badge-primary">
                {previewMode ? 'Design Preview Account' : 'SIWES Verified Member'}
              </span>
              <span className="profile-badge badge-secondary">Personal Workspace</span>
            </div>
          </div>
        </section>

        {/* Task Overview Stats Cards */}
        <section className="profile-stats-grid" aria-label="Task Performance Statistics">
          <div className="profile-stat-card tone-blue">
            <div className="stat-icon" aria-hidden="true">T</div>
            <div className="stat-data">
              <span className="stat-label">Tasks Created</span>
              <strong className="stat-value">{totalTasksCount}</strong>
            </div>
            <span className="stat-subtext">Total workspace tasks</span>
          </div>

          <div className="profile-stat-card tone-green">
            <div className="stat-icon" aria-hidden="true">C</div>
            <div className="stat-data">
              <span className="stat-label">Tasks Completed</span>
              <strong className="stat-value">{completedTasks.length}</strong>
            </div>
            <span className="stat-subtext">{completionPercentage}% completion rate</span>
          </div>

          <div className="profile-stat-card tone-sky">
            <div className="stat-icon" aria-hidden="true">P</div>
            <div className="stat-data">
              <span className="stat-label">Tasks Pending</span>
              <strong className="stat-value">{pendingTasks}</strong>
            </div>
            <span className="stat-subtext">{inProgressTasks.length} in progress, {todoTasks.length} to do</span>
          </div>

          <div className="profile-stat-card tone-red">
            <div className="stat-icon" aria-hidden="true">!</div>
            <div className="stat-data">
              <span className="stat-label">Overdue Tasks</span>
              <strong className="stat-value">{overdueTasks.length}</strong>
            </div>
            <span className="stat-subtext">
              {overdueTasks.length ? 'Action required' : 'All clear on deadlines'}
            </span>
          </div>
        </section>

        {/* Progress & Category Details Grid */}
        <div className="profile-details-split">
          {/* Productivity & Priority Progress */}
          <section className="profile-card profile-section-card">
            <h3>Productivity Overview</h3>
            <div className="profile-progress-block">
              <div className="progress-info-row">
                <span>Overall Task Completion</span>
                <strong>{completionPercentage}%</strong>
              </div>
              <div className="profile-progress-bar">
                <div
                  className="profile-progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="progress-note">
                {completedTasks.length} of {totalTasksCount} tasks successfully marked as done.
              </p>
            </div>

            <div className="profile-divider" />

            <h4 className="sub-heading">Priority Breakdown</h4>
            <div className="priority-pill-grid">
              <div className="priority-pill priority-high">
                <span>High Priority</span>
                <strong>{highCount}</strong>
              </div>
              <div className="priority-pill priority-medium">
                <span>Medium Priority</span>
                <strong>{medCount}</strong>
              </div>
              <div className="priority-pill priority-low">
                <span>Low Priority</span>
                <strong>{lowCount}</strong>
              </div>
            </div>
          </section>

          {/* Category Distribution Card */}
          <section className="profile-card profile-section-card">
            <h3>Categories Breakdown</h3>
            <p className="card-subtitle">Distribution of tasks across project categories</p>
            <div className="category-list">
              {Object.keys(categoryCounts).length > 0 ? (
                Object.entries(categoryCounts).map(([cat, count]) => {
                  const catPercentage = totalTasksCount ? Math.round((count / totalTasksCount) * 100) : 0;
                  return (
                    <div key={cat} className="category-item">
                      <div className="category-header-row">
                        <span className="category-name">{cat}</span>
                        <span className="category-count">{count} task{count > 1 ? 's' : ''} ({catPercentage}%)</span>
                      </div>
                      <div className="category-bar">
                        <div className="category-fill" style={{ width: `${catPercentage}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="empty-subtext">No task categories created yet.</p>
              )}
            </div>
          </section>
        </div>

        {/* Recent Activity List */}
        <section className="profile-card profile-section-card">
          <h3>Recent Tasks Summary</h3>
          <p className="card-subtitle">Snapshot of your latest tasks</p>
          <div className="profile-recent-tasks">
            {tasks.length > 0 ? (
              tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="profile-task-item">
                  <div className="task-status-indicator">
                    <span className={`status-dot ${task.status === 'done' ? 'is-done' : task.status === 'in-progress' ? 'is-progress' : 'is-todo'}`} />
                  </div>
                  <div className="task-details">
                    <span className="task-item-title">{task.title}</span>
                    <span className="task-item-category">{task.category || 'General'}</span>
                  </div>
                  <div className="task-item-meta">
                    <span className={`priority-tag ${task.priority || 'medium'}`}>{task.priority || 'medium'}</span>
                    <span className="task-status-pill">{task.status === 'done' ? 'Completed' : task.status === 'in-progress' ? 'In Progress' : 'To Do'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-subtext">No tasks available to display.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
