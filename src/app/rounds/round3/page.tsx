'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaLightbulb, FaArrowRight, FaLock, FaUnlock, FaKey } from 'react-icons/fa';

interface Challenge {
  id: string;
  title: string;
  description: string;
  encryptedMessage: string;
  method: 'caesar' | 'base64' | 'aes';
  hint: string;
  keyHint?: string;
}

export default function Round3() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [showKeyHint, setShowKeyHint] = useState(false);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const fetchChallenge = async () => {
      try {
        // Get auth token from cookie
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
        
        if (!tokenCookie) {
          router.push('/');
          return;
        }
        
        const token = tokenCookie.split('=')[1];
        
        // In a production app, we would fetch the challenge from an API
        // For now, we'll simulate it with a mock challenge
        setTimeout(() => {
          const mockChallenge: Challenge = {
            id: 'decrypt-1',
            title: 'Decode the Secret',
            description: 'This message has been encrypted using a Caesar cipher. Each letter has been shifted a certain number of positions in the alphabet. Decrypt it to reveal the final message.',
            encryptedMessage: 'HTSLWFYZQFYNTSX, DTZ MFAJ HTRQJYJI YMJ MYYUX KNSI HMFQQJSLJ!',
            method: 'caesar',
            hint: 'The Caesar cipher shifts each letter in the alphabet. Try different shift values (1-25).',
            keyHint: 'The shift value is 5 positions backward in the alphabet.'
          };
          
          setChallenge(mockChallenge);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error fetching challenge:', error);
        setError('Failed to load challenge. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChallenge();
  }, [router]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!challenge) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      // Get auth token from cookie
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
      
      if (!tokenCookie) {
        router.push('/');
        return;
      }
      
      const token = tokenCookie.split('=')[1];
      
      // In a production app, we would submit to an API
      // For now, we'll simulate with a local check
      setTimeout(() => {
        setAttempts(prev => prev + 1);
        
        // Very simple check - in a real app, this would be done securely on the server
        if (decryptedMessage.trim().toUpperCase() === 'CONGRATULATIONS, YOU HAVE COMPLETED THE HTTPS FIND CHALLENGE!') {
          setSuccess(true);
        } else {
          setError('Incorrect decryption. Try again!');
          
          // Show hint after a few attempts
          if (attempts >= 2 && !showHint) {
            setShowHint(true);
          }
          
          // Show key hint after more attempts
          if (attempts >= 4 && !showKeyHint && challenge.keyHint) {
            setShowKeyHint(true);
          }
        }
        
        setSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Error submitting decryption:', error);
      setError('Failed to submit decryption. Please try again.');
      setSubmitting(false);
    }
  };
  
  // Success view after completing the round
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-b from-green-500/20 to-green-600/20 border border-green-500 rounded-lg p-8 max-w-md text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Round 3 Completed!</h1>
          <p className="text-xl mb-6">Congratulations! You have successfully decrypted the message and completed the HTTPS Find challenge!</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold inline-flex items-center"
          >
            Return to Dashboard <FaArrowRight className="ml-2" />
          </button>
        </motion.div>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading challenge...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Round 3: Decryption Challenge</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Decrypt the message to complete the HTTPS Find challenge and claim victory!
          </p>
        </motion.div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-8 max-w-3xl mx-auto">
            {error}
          </div>
        )}
        
        {challenge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
              <h2 className="text-2xl font-bold mb-2">{challenge.title}</h2>
              <p className="mb-6">{challenge.description}</p>
              
              <div className="flex items-center mb-2">
                <FaLock className="text-purple-400 mr-2" />
                <h3 className="text-lg font-medium">Encrypted Message:</h3>
              </div>
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 mb-6 font-mono text-sm overflow-x-auto">
                {challenge.encryptedMessage}
              </div>
              
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-gray-300">
                  <span>Encryption Method: </span>
                  <span className="font-bold text-white capitalize">{challenge.method}</span>
                </div>
                
                <div className="text-gray-300">
                  <span>Attempts: </span>
                  <span className="font-bold text-white">{attempts}</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="inline-flex items-center bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm"
                  >
                    <FaLightbulb className="mr-2" /> {showHint ? 'Hide Hint' : 'Show Hint'}
                  </button>
                  
                  {challenge.keyHint && (
                    <button
                      onClick={() => setShowKeyHint(!showKeyHint)}
                      className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      <FaKey className="mr-2" /> {showKeyHint ? 'Hide Key' : 'Show Key'}
                    </button>
                  )}
                </div>
              </div>
              
              {showHint && challenge.hint && (
                <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded mb-4 text-yellow-200">
                  <p><strong>Hint:</strong> {challenge.hint}</p>
                </div>
              )}
              
              {showKeyHint && challenge.keyHint && (
                <div className="bg-blue-900/30 border border-blue-700 p-3 rounded mb-4 text-blue-200">
                  <p><strong>Key Hint:</strong> {challenge.keyHint}</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <FaUnlock className="text-green-400 mr-2" />
                    <label htmlFor="decrypted-message" className="text-lg font-medium">
                      Your Decryption:
                    </label>
                  </div>
                  <textarea
                    id="decrypted-message"
                    value={decryptedMessage}
                    onChange={(e) => setDecryptedMessage(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white font-mono resize-y"
                    rows={5}
                    placeholder="Enter your decrypted message here..."
                  ></textarea>
                </div>
                
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => router.push('/dashboard')}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    Back to Dashboard
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting || !decryptedMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded inline-flex items-center disabled:opacity-70"
                  >
                    {submitting ? 'Submitting...' : 'Submit Decryption'} <FaArrowRight className="ml-2" />
                  </button>
                </div>
              </form>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
              <h3 className="text-xl font-semibold mb-4">Decryption Resources</h3>
              <p className="mb-4">Here are some resources that might help with the decryption challenge:</p>
              
              <ul className="list-disc pl-5 space-y-2 text-gray-300">
                <li>
                  <strong>Caesar Cipher:</strong> A substitution cipher where each letter is shifted a certain number of positions in the alphabet.
                </li>
                <li>
                  <strong>Base64:</strong> An encoding scheme that represents binary data in ASCII format, commonly used for transmitting data over the internet.
                </li>
                <li>
                  <strong>AES Encryption:</strong> A symmetric encryption algorithm that requires a key for both encryption and decryption.
                </li>
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 