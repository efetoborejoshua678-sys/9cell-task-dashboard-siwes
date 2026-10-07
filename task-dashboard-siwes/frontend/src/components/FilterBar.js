import React from 'react';

export default function FilterBar({ filters, onChange, categories }) {
  const handle = (key) => (e) => onChange({ ...filters, [key]: e.target.value });

  const hasActiveFilters = filters.search || filters.priority || filters.category;

  return (
    <div className="filter-bar">
      <input
        type="text"
        className="filter-input filter-search"
        placeholder="Search tasks..."
        value={filters.search}
        onChange={handle('search')}
      />

      <select className="filter-input" value={filters.priority} onChange={handle('priority')}>
        <option value="">Any priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <select className="filter-input" value={filters.category} onChange={handle('category')}>
        <option value="">Any category</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          className="filter-clear"
          onClick={() => onChange({ search: '', priority: '', category: '' })}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
