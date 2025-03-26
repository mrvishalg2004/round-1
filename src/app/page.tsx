'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowRight, FaUsers, FaLock, FaCode } from 'react-icons/fa';
import { safelyParseJSON } from '@/lib/apiHelpers';

export default function Home() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!teamName.trim() || !member1.trim() || !member2.trim()) {
      setError('Please fill all the fields');
      return;
    }
    
    try {
      setIsRegistering(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          members: [member1, member2],
        }),
      });
      
      const data = await safelyParseJSON(response);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register');
      }
      
      // Set auth token in cookie
      document.cookie = `auth_token=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}`; // 1 week
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsRegistering(false);
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
            Register your team and test your skills across three challenging rounds.
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
          className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">Register Your Team</h2>
          
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="teamName" className="block mb-2 font-medium">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white"
                placeholder="Enter your team name"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="member1" className="block mb-2 font-medium">
                Team Member 1
              </label>
              <input
                type="text"
                id="member1"
                value={member1}
                onChange={(e) => setMember1(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white"
                placeholder="Enter name of first member"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="member2" className="block mb-2 font-medium">
                Team Member 2
              </label>
              <input
                type="text"
                id="member2"
                value={member2}
                onChange={(e) => setMember2(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white"
                placeholder="Enter name of second member"
              />
            </div>
            
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex items-center justify-center disabled:opacity-70"
            >
              {isRegistering ? 'Registering...' : 'Start the Hunt!'} {!isRegistering && <FaArrowRight className="ml-2" />}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
