import React from 'react';

export default function Loader({ size = 18, color = 'border-white' }) {
  const px = typeof size === 'number' ? `${size}px` : size;
  return (
    <span
      aria-label="loading"
      className={`inline-block align-middle border-2 ${color} border-t-transparent rounded-full animate-spin`}
      style={{ width: px, height: px }}
    />
  );
}


