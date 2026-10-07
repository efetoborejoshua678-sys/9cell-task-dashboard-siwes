import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

const priorityLabel = { high: 'High', medium: 'Medium', low: 'Low' };

function formatDueDate(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = date < today;
  const label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return { label, isOverdue };
}

export default function TaskCard({ task, index, onEdit, onDelete }) {
  const taskId = String(task.id || task._id || index);
  const due = formatDueDate(task.due_date || task.dueDate);

  return (
    <Draggable draggableId={taskId} index={index}>
      {(provided, snapshot) => (
        <article
          className={`task-card priority-${task.priority || 'medium'} ${snapshot.isDragging ? 'is-dragging' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="task-card-top">
            <span className={`priority-dot priority-dot-${task.priority || 'medium'}`} title={`${priorityLabel[task.priority || 'medium']} priority`} />
            <span className="task-category">{task.category || 'General'}</span>
          </div>

          <h3 className="task-title">{task.title}</h3>
          {task.description && <p className="task-description">{task.description}</p>}

          <div className="task-card-bottom">
            {due && (
              <span className={`due-badge ${due.isOverdue ? 'due-overdue' : ''}`}>
                {due.isOverdue ? 'Overdue' : 'Due'} {due.label}
              </span>
            )}
            <div className="task-card-actions">
              {onEdit && (
                <button type="button" className="icon-btn" onClick={() => onEdit(task)} aria-label="Edit task">
                  Edit
                </button>
              )}
              {onDelete && (
                <button type="button" className="icon-btn icon-btn-danger" onClick={() => onDelete(task)} aria-label="Delete task">
                  Delete
                </button>
              )}
            </div>
          </div>
        </article>
      )}
    </Draggable>
  );
}
