import React, { useState } from 'react';

const emptyTask = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium',
  category: '',
  status: 'todo',
};

function dateInputToEndOfDay(value) {
  if (!value) return null;

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

export default function TaskForm({ initialTask, onSubmit, onCancel, isSubmitting = false, serverError = '' }) {
  const [form, setForm] = useState({
    ...emptyTask,
    ...initialTask,
    dueDate: initialTask?.dueDate ? initialTask.dueDate.slice(0, 10) : '',
  });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Give the task a title before saving.');
      return;
    }
    await onSubmit({
      ...form,
      category: form.category.trim() || 'General',
      dueDate: dateInputToEndOfDay(form.dueDate),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal glass-panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{initialTask ? 'Edit task' : 'New task'}</h2>

        <label className="field-label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="text-input"
          value={form.title}
          onChange={set('title')}
          placeholder="e.g. Write API documentation"
          autoFocus
        />

        <label className="field-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="text-input"
          rows={3}
          value={form.description}
          onChange={set('description')}
          placeholder="Add any useful detail..."
        />

        <div className="field-row">
          <div>
            <label className="field-label" htmlFor="dueDate">
              Due date
            </label>
            <input
              id="dueDate"
              type="date"
              className="text-input"
              value={form.dueDate}
              onChange={set('dueDate')}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="priority">
              Priority
            </label>
            <select id="priority" className="text-input" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <label className="field-label" htmlFor="status">
          Status
        </label>
        <select id="status" className="text-input" value={form.status} onChange={set('status')}>
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>

        <label className="field-label" htmlFor="category">
          Category / tag
        </label>
        <input
          id="category"
          className="text-input"
          value={form.category}
          onChange={set('category')}
          placeholder="e.g. Backend, Research, Report"
        />

        {(error || serverError) && <p className="form-error" role="alert">{error || serverError}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initialTask ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </div>
  );
}
