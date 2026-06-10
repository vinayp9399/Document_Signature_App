import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function SignatureToolbar() {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: 'new-signature-field',
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 w-52 flex-shrink-0">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Signature Fields</h3>
      <p className="text-xs text-gray-500 mb-4">
        Drag the field below onto the document to place a signature.
      </p>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="bg-yellow-100 border-2 border-dashed border-yellow-400 rounded px-3 py-2 text-xs font-medium text-yellow-800 text-center select-none"
      >
       Signature Field
      </div>
    </div>
  );
}

export default SignatureToolbar;
