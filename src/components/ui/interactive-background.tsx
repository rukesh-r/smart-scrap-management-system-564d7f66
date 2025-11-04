import React from 'react';

export const InteractiveBackground = () => {
  return (
    <canvas
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};