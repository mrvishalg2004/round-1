'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaEdit, FaTrophy, FaTrash, FaSearch, FaFilter, FaUserPlus } from 'react-icons/fa';

interface Team {
  id: string;
  name: string;
  members: Array<{ name: string; email: string; } | string>;
  completedRounds: {
    round1: boolean;
    round2: boolean;
    round3: boolean;
  };
  score: number;
  createdAt: string;
}

export default function TeamsAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    // Check if admin is authenticated
    const adminAuth = localStorage.getItem('admin_auth');
    if (adminAuth !== 'true') {
      router.push('/admin');
      return;
    }

    // Fetch teams data
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/teams');
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.teams && Array.isArray(data.teams)) {
          setTeams(data.teams);
        } else {
          console.log('No teams data in response or invalid format');
          setTeams([]);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeams();
  }, [router]);

  // Filter teams based on search term and filter status
  const filteredTeams = teams.filter(team => {
    const matchesSearch = 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      team.members.some(member => {
        if (typeof member === 'string') {
          return member.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return member.name.toLowerCase().includes(searchTerm.toLowerCase());
      });
    
    if (filterStatus === 'all') {
      return matchesSearch;
    } else if (filterStatus === 'completed') {
      return matchesSearch && team.completedRounds.round3;
    } else if (filterStatus === 'in-progress') {
      return matchesSearch && (team.completedRounds.round1 || team.completedRounds.round2) && !team.completedRounds.round3;
    } else if (filterStatus === 'not-started') {
      return matchesSearch && !team.completedRounds.round1;
    }
    
    return matchesSearch;
  });

  const handleDeleteTeam = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        const response = await fetch(`/api/teams?id=${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          // Remove the team from local state
          setTeams(teams.filter(team => team.id !== id));
          alert('Team deleted successfully');
        } else {
          const errorData = await response.json();
          console.error('Error deleting team:', errorData);
          alert(`Failed to delete team: ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        alert('An error occurred while deleting the team');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded flex items-center mr-4"
          >
            <FaArrowLeft className="mr-2" /> Back
          </button>
          <h1 className="text-3xl font-bold">Manage Teams</h1>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded pl-10 pr-4 py-2 w-full text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <FaFilter className="text-gray-400 mr-2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Teams</option>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="not-started">Not Started</option>
                </select>
              </div>
              
              <button
                onClick={() => router.push('/admin/teams/new')}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
              >
                <FaUserPlus className="mr-2" /> Add Team
              </button>
            </div>
          </div>
          
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No teams found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-left">
                    <th className="px-4 py-3 rounded-tl-lg">Team Name</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeams.map((team, index) => (
                    <motion.tr
                      key={team.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`border-t border-gray-700 ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}
                    >
                      <td className="px-4 py-3">{team.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          {team.members.map((member, i) => (
                            <span key={i} className="text-sm">
                              {typeof member === 'string' ? member : member.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-full bg-gray-600 rounded-full h-2.5">
                            <div 
                              className="bg-blue-500 h-2.5 rounded-full" 
                              style={{ 
                                width: `${(Object.values(team.completedRounds).filter(Boolean).length / 3) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <span className="ml-2 text-xs">
                            {Object.values(team.completedRounds).filter(Boolean).length}/3
                          </span>
                        </div>
                        <div className="flex space-x-1 mt-2">
                          <div className={`h-2 w-2 rounded-full ${team.completedRounds.round1 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <div className={`h-2 w-2 rounded-full ${team.completedRounds.round2 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                          <div className={`h-2 w-2 rounded-full ${team.completedRounds.round3 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">{team.score} pts</td>
                      <td className="px-4 py-3 text-sm text-gray-400">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => router.push(`/admin/teams/${team.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded"
                            title="Edit Team"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(team.id)}
                            className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded"
                            title="Delete Team"
                          >
                            <FaTrash />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/teams/${team.id}/activity`)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white p-1.5 rounded"
                            title="View Activity"
                          >
                            <FaTrophy />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
        >
          <h2 className="text-xl font-bold mb-4">Team Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-xl font-bold text-blue-400">{teams.length}</div>
              <div className="text-sm text-gray-400">Total Teams</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-xl font-bold text-green-400">{teams.filter(team => team.completedRounds.round3).length}</div>
              <div className="text-sm text-gray-400">Completed All Rounds</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-xl font-bold text-yellow-400">{teams.filter(team => team.completedRounds.round1 || team.completedRounds.round2).length}</div>
              <div className="text-sm text-gray-400">In Progress</div>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <div className="text-xl font-bold text-purple-400">{Math.max(...teams.map(team => team.score))}</div>
              <div className="text-sm text-gray-400">Highest Score</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 