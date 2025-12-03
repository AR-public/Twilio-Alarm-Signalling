import React from 'react';

interface TimerProps {
  secondsElapsed: number;
}

const Timer: React.FC<TimerProps> = ({ secondsElapsed }) => {
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '2rem' }}>
      {formatTime(secondsElapsed)}
    </div>
  );
};

export default Timer;
