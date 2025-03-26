'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaUserPlus, FaTrash } from 'react-icons/fa';

export default function NewTeam() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if admin is authenticated
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
    }
  }, [router]);

  const addMember = () => {
    setMembers([...members, '']);
  };

  const removeMember = (index: number) => {
    if (members.length <= 2) {
      setError('A team must have at least 2 members');
      return;
    }
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
  };

  const updateMember = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const validateForm = () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return false;
    }

    if (members.length < 2) {
      setError('A team must have at least 2 members');
      return false;
    }

    for (let i = 0; i < members.length; i++) {
      if (!members[i].trim()) {
        setError(`Member ${i + 1} name is required`);
        return false;
      }
    }

    // Check for duplicate members
    const uniqueMembers = new Set(members.map(m => m.trim().toLowerCase()));
    if (uniqueMembers.size !== members.length) {
      setError('Each team member must have a unique name');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: teamName,
          members: members.filter(m => m.trim()),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      const data = await response.json();
      
      if (data.success) {
        alert('Team created successfully');
        router.push('/admin/teams');
      } else {
        throw new Error(data.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/admin/teams')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center mr-4"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-3xl font-bold">Add New Team</h1>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <div className="mb-6">
              <label htmlFor="teamName" className="block text-gray-300 mb-2 font-medium">
                Team Name
              </label>
              <input
                type="text"
                id="teamName"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-4 py-2 w-full text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter team name"
                required
              />
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-300 font-medium">
                  Team Members
                </label>
                <button
                  type="button"
                  onClick={addMember}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center text-sm"
                >
                  <FaUserPlus className="mr-2" /> Add Member
                </button>
              </div>
              
              {members.map((member, index) => (
                <div key={index} className="flex mb-2">
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => updateMember(index, e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-l px-4 py-2 w-full text-white focus:outline-none focus:border-blue-500"
                    placeholder={`Member ${index + 1} name`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeMember(index)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-r flex items-center"
                    title="Remove member"
                  >
                    <FaTrash />
                  </button>
                </div>
              ))}
              <p className="text-sm text-gray-400 mt-2">
                Each team must have at least 2 members
              </p>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/admin/teams')}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded flex items-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Team'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
} 