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

  // Add debug logging to track props changes
  useEffect(() => {
    console.log("[GameTimer] Props updated:", { 
      isActive, 
      timerStartedAt, 
      timerPausedAt, 
      timerDuration,
      isVisible
    });
  }, [isActive, timerStartedAt, timerPausedAt, timerDuration, isVisible]);

  // Always show timer if it's active or has been active
  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
    }
  }, [isActive]);

  // Timer update logic
  useEffect(() => {
    // Safety check - only run timer if we have valid data
    if (isActive && timerStartedAt) {
      console.log("[GameTimer] Starting interval timer");
      setIsVisible(true);
      
      const interval = setInterval(() => {
        // Get current time for calculation
        const currentTime = timerPausedAt || Date.now();
        const elapsed = currentTime - timerStartedAt;
        const remaining = Math.max(0, timerDuration - elapsed);
        
        // Update timer state
        setTimeRemaining(remaining);
        
        // Set warning colors
        setIsWarning(remaining <= 3 * 60 * 1000 && remaining > 1 * 60 * 1000);
        setIsDanger(remaining <= 1 * 60 * 1000);
        
        // Log current time remaining
        if (remaining % 10000 < 1000) { // Log roughly every 10 seconds
          console.log("[GameTimer] Time remaining:", formatTime(remaining));
        }
        
        // Stop timer when it reaches zero
        if (remaining <= 0) {
          console.log("[GameTimer] Timer reached zero");
          clearInterval(interval);
        }
      }, 1000);
      
      return () => {
        console.log("[GameTimer] Clearing interval timer");
        clearInterval(interval);
      };
    } else if (!isActive && timerStartedAt === null) {
      // Reset timer when not active and no start time
      console.log("[GameTimer] Resetting timer");
      setTimeRemaining(timerDuration);
      setIsWarning(false);
      setIsDanger(false);
    }
  }, [isActive, timerStartedAt, timerPausedAt, timerDuration]);

  // Helper function to format time
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Format time as MM:SS
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // Don't render anything if not visible
  if (!isVisible) {
    return null;
  }

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