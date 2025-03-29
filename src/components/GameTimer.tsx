'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaClock } from 'react-icons/fa';

interface GameTimerProps {
  isActive: boolean;
  timerStartedAt: number | null;
  timerPausedAt: number | null;
  timerDuration: number;
}

export default function GameTimer({ 
  isActive, 
  timerStartedAt, 
  timerPausedAt,
  timerDuration = 10 * 60 * 1000 // 10 min in ms
}: GameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timerDuration);
  const [isVisible, setIsVisible] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [isDanger, setIsDanger] = useState(false);

  useEffect(() => {
    if (isActive && timerStartedAt) {
      setIsVisible(true);
      
      const interval = setInterval(() => {
        // If paused, use the pause time for calculation
        // Otherwise use current time
        const currentTime = timerPausedAt || Date.now();
        const elapsed = currentTime - timerStartedAt;
        const remaining = Math.max(0, timerDuration - elapsed);
        
        setTimeRemaining(remaining);
        
        // Set warning at 3 minutes
        setIsWarning(remaining <= 3 * 60 * 1000 && remaining > 1 * 60 * 1000);
        
        // Set danger at 1 minute
        setIsDanger(remaining <= 1 * 60 * 1000);
        
        // Stop timer when it reaches zero
        if (remaining <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (!isActive && timerStartedAt === null) {
      // Reset timer when not active and no start time
      setTimeRemaining(timerDuration);
      setIsWarning(false);
      setIsDanger(false);
      setIsVisible(false);
    }
  }, [isActive, timerStartedAt, timerPausedAt, timerDuration]);

  if (!isVisible) return null;

  // Format time as MM:SS
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className={`fixed top-4 right-4 z-50 flex items-center justify-center p-3 rounded-lg shadow-lg ${
        isDanger 
          ? 'bg-red-600 text-white' 
          : isWarning 
            ? 'bg-yellow-500 text-white' 
            : 'bg-blue-600 text-white'
      }`}
    >
      <FaClock className="mr-2" />
      <motion.span 
        className="text-2xl font-bold font-mono"
        animate={{ 
          scale: [1, 1.15, 1],
        }}
        transition={{ 
          duration: 1,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          repeatDelay: isDanger ? 0.2 : 1
        }}
      >
        {formattedTime}
      </motion.span>
    </motion.div>
  );
} 