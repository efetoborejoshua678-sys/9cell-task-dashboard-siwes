import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

export default function Column({ column, tasks, onEdit, onDelete, onAdd }) {
  return (
    <div className="column">
      <div className="column-header">
        <div className={`column-marker column-marker-${column.id}`} />
        <h2>{column.title}</h2>
        <span className="column-count">{tasks.length}</span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            className={`column-body ${snapshot.isDraggingOver ? 'is-dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="column-empty">Nothing here yet.</p>
            )}
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id || task._id || index}
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {onAdd && (
        <button type="button" className="column-add-btn" onClick={() => onAdd(column.id)}>
          + Add task
        </button>
      )}
    </div>
  );
}
