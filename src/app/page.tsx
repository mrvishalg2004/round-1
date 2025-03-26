'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowRight, FaUsers, FaLock, FaCode } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function Home() {
  const router = useRouter();
  const [gameStatus, setGameStatus] = useState({ isStarted: false });
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const fetchGameStatus = async () => {
      try {
        const response = await fetch('/api/admin/game-status');
        if (response.ok) {
          const data = await response.json();
          setGameStatus(data);
        }
      } catch (error) {
        console.error('Error fetching game status:', error);
      }
    };

    fetchGameStatus();
  }, []);

  const handleStartGame = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/admin/game-status');
      if (response.ok) {
        const data = await response.json();
        if (data.isStarted) {
          router.push('/dashboard');
        } else {
          toast.error('The game has not been started by the admin yet. Please wait.');
        }
      }
    } catch (error) {
      console.error('Error checking game status:', error);
      toast.error('Failed to check game status');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
            HTTPS Find
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            An interactive digital treasure hunt where technology meets mystery.
          </p>
        </motion.div>
        
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full md:w-1/3 bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center mb-4">
              <FaUsers className="text-blue-400 text-2xl mr-3" />
              <h2 className="text-xl font-bold">Round 1: Hidden Link Hunt</h2>
            </div>
            <p className="text-gray-300">
              Test your observation skills in a web page with multiple links. 
              Can you find the hidden genuine link among the decoys?
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full md:w-1/3 bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center mb-4">
              <FaCode className="text-purple-400 text-2xl mr-3" />
              <h2 className="text-xl font-bold">Round 2: Code Rush</h2>
            </div>
            <p className="text-gray-300">
              Put your coding skills to the test. 
              Fix broken code or solve programming challenges against the clock!
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="w-full md:w-1/3 bg-gray-800 p-6 rounded-lg shadow-lg"
          >
            <div className="flex items-center mb-4">
              <FaLock className="text-green-400 text-2xl mr-3" />
              <h2 className="text-xl font-bold">Round 3: Decryption Challenge</h2>
            </div>
            <p className="text-gray-300">
              Crack encrypted messages using various methods of cryptography.
              Your team's final challenge to claim victory!
            </p>
          </motion.div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-md mx-auto mt-12"
        >
          <button
            onClick={gameStatus.isStarted ? () => router.push('/dashboard') : () => toast.error('The game has not been started by the admin yet. Please wait.')}
            disabled={!gameStatus.isStarted || checking}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-8 rounded-lg font-bold text-xl flex items-center justify-center disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Start Game'} <FaArrowRight className="ml-2" />
          </button>
          {!gameStatus.isStarted && (
            <p className="text-amber-400 italic mt-3 text-center">
              Waiting for admin to start the game. Button will be enabled once the game begins.
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
