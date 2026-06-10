import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function DraggableSignature({ id, x, y, signerName, status }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: String(id),
  });

  const style = {
    position: 'absolute',
    left: `${x}%`,
    top: `${y}%`,
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 50 : 10,
    opacity: isDragging ? 0.8 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`px-2 py-1 rounded border-2 text-xs font-medium shadow select-none ${
        status === 'signed'
          ? 'bg-green-200 border-green-500 text-green-800'
          : status === 'rejected'
          ? 'bg-red-200 border-red-500 text-red-800'
          : 'bg-yellow-200 border-yellow-500 text-yellow-800'
      }`}
    >
     {signerName || 'Signature'}
    </div>
  );
}

export default DraggableSignature;
