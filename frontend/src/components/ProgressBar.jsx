import React, { useEffect, useState } from 'react';

const ProgressBar = ({ value, color }) => {
  const [internal, setInternal] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setInternal(value);
    }, 50);
    return () => clearTimeout(timeout);
  }, [value]);

  const background =
    color ||
    'linear-gradient(90deg, rgba(22,163,74,1) 0%, rgba(234,179,8,1) 50%, rgba(239,68,68,1) 100%)';

  return (
    <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${internal}%`,
          backgroundImage: background
        }}
      />
    </div>
  );
};

export default ProgressBar;

