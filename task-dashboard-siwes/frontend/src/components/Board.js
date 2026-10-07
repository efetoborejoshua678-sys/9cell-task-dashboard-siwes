import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import Column from './Column';

export const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function Board({ tasksByColumn, onDragEnd, onEdit, onDelete, onAdd }) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="board">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
            onEdit={onEdit}
            onDelete={onDelete}
            onAdd={onAdd}
          />
        ))}
      </div>
    </DragDropContext>
  );
}
