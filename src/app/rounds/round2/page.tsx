'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaLightbulb, FaArrowRight, FaCode, FaCheck, FaTimes } from 'react-icons/fa';
import dynamic from 'next/dynamic';

// Dynamically import AceEditor to avoid SSR issues
const AceEditor = dynamic(
  async () => {
    const { default: ace } = await import('react-ace');
    await import('ace-builds/src-noconflict/mode-javascript');
    await import('ace-builds/src-noconflict/theme-monokai');
    await import('ace-builds/src-noconflict/ext-language_tools');
    return ace;
  },
  { ssr: false }
);

interface Challenge {
  id: string;
  title: string;
  description: string;
  initialCode: string;
  hint: string;
  testCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

interface TestResult {
  passed: boolean;
  testCases: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
  }>;
}

export default function Round2() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [success, setSuccess] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  
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
            id: 'challenge-1',
            title: 'Fix the Broken Function',
            description: 'This function is supposed to find the missing number in an array containing numbers from 1 to n (with one number missing). The function has some bugs. Can you fix it?',
            initialCode: `function findMissingNumber(nums) {
  // The array should contain numbers from 1 to n with one number missing
  // Return the missing number
  let n = nums.length + 1;
  
  // Calculate expected sum of numbers 1 to n
  let expectedSum = n * (n + 1) / 2;
  
  // Calculate actual sum of the array
  let actualSum = 0;
  for (let i = 1; i <= nums.length; i++) {
    actualSum += nums[i];
  }
  
  // The missing number is the difference between the expected and actual sums
  return expectedSum - actualSum;
}`,
            hint: 'Array indices in JavaScript are zero-based. Also, check if you&apos;re calculating the sum correctly.',
            testCases: [
              {
                input: '[1, 2, 4, 5]',
                expectedOutput: '3'
              },
              {
                input: '[1, 3]',
                expectedOutput: '2'
              },
              {
                input: '[2, 3, 4, 5, 6]',
                expectedOutput: '1'
              }
            ]
          };
          
          setChallenge(mockChallenge);
          setCode(mockChallenge.initialCode);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error fetching challenge:', error);
        setError('Failed to load challenge. Please try again.');
        setLoading(false);
      }
    };
    
    fetchChallenge();
  }, [router]);
  
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError('');
      setTestResults(null);
      
      // Get auth token from cookie
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
      
      if (!tokenCookie) {
        router.push('/');
        return;
      }
      
      const token = tokenCookie.split('=')[1];
      
      // In a production app, we would submit to an API
      // For now, we'll simulate submission with a local evaluation
      setTimeout(() => {
        if (!challenge) return;
        
        setAttempts(prev => prev + 1);
        
        // Very simple evaluation - not secure for production!
        try {
          // Create a safe function evaluation environment
          const testResults: TestResult = {
            passed: true,
            testCases: []
          };
          
          // Test each test case
          for (const testCase of challenge.testCases) {
            try {
              // Create a new Function from the code string
              // Note: This is NOT safe for production use due to code injection risks
              const userFunction = new Function('return ' + code)();
              
              // Parse the input
              const input = JSON.parse(testCase.input);
              
              // Run the function
              const actualOutput = String(userFunction(input));
              const passed = actualOutput === testCase.expectedOutput;
              
              testResults.testCases.push({
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                actualOutput,
                passed
              });
              
              if (!passed) {
                testResults.passed = false;
              }
            } catch (error) {
              console.error('Error evaluating test case:', error);
              testResults.testCases.push({
                input: testCase.input,
                expectedOutput: testCase.expectedOutput,
                actualOutput: 'Error: ' + (error as Error).message,
                passed: false
              });
              testResults.passed = false;
            }
          }
          
          setTestResults(testResults);
          
          if (testResults.passed) {
            // All tests passed, mark as success
            setSuccess(true);
          } else {
            // Some tests failed
            setError('Your solution doesn&apos;t pass all test cases. Check the results below.');
            
            // Show hint after a few attempts
            if (attempts >= 2 && !showHint) {
              setShowHint(true);
            }
          }
        } catch (error) {
          console.error('Error evaluating code:', error);
          setError('Error evaluating your code: ' + (error as Error).message);
        }
        
        setSubmitting(false);
      }, 1500);
    } catch (error) {
      console.error('Error submitting code:', error);
      setError('Failed to submit your code. Please try again.');
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
          <h1 className="text-3xl font-bold mb-4">Round 2 Completed!</h1>
          <p className="text-xl mb-6">Congratulations! You&apos;ve fixed the code and completed the second challenge.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center"
          >
            Continue to Dashboard <FaArrowRight className="ml-2" />
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
          <h1 className="text-4xl font-bold mb-2">Round 2: Code Challenge</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Debug and fix the code to pass all the test cases.
          </p>
        </motion.div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 max-w-3xl mx-auto">
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
              <p className="mb-4">{challenge.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-gray-300">
                  <span>Attempts: </span>
                  <span className="font-bold text-white">{attempts}</span>
                </div>
                
                {!showHint && (
                  <button
                    onClick={() => setShowHint(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded flex items-center text-sm"
                  >
                    <FaLightbulb className="mr-2" /> Show Hint
                  </button>
                )}
              </div>
              
              {showHint && (
                <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded mb-4 text-yellow-200">
                  <p><strong>Hint:</strong> {challenge.hint}</p>
                </div>
              )}
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <FaCode className="text-purple-400 mr-2" /> Code Editor
              </h3>
              
              <div className="mb-6 border border-gray-600 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                {typeof window !== 'undefined' && (
                  <AceEditor
                    mode="javascript"
                    theme="monokai"
                    value={code}
                    onChange={setCode}
                    name="code-editor"
                    editorProps={{ $blockScrolling: true }}
                    width="100%"
                    height="100%"
                    fontSize={14}
                    showPrintMargin={false}
                    setOptions={{
                      enableBasicAutocompletion: true,
                      enableLiveAutocompletion: true,
                      enableSnippets: true,
                      showLineNumbers: true,
                      tabSize: 2,
                    }}
                  />
                )}
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Back to Dashboard
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !code.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex items-center disabled:opacity-70"
                >
                  {submitting ? 'Submitting...' : 'Submit Solution'} {!submitting && <FaArrowRight className="ml-2" />}
                </button>
              </div>
            </div>
            
            {testResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700"
              >
                <h3 className="text-xl font-semibold mb-4">Test Results</h3>
                
                <div className="space-y-4">
                  {testResults.testCases.map((testCase, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${testCase.passed ? 'bg-green-900/20 border border-green-700' : 'bg-red-900/20 border border-red-700'}`}
                    >
                      <div className="flex items-center mb-2">
                        {testCase.passed ? (
                          <FaCheck className="text-green-400 mr-2" />
                        ) : (
                          <FaTimes className="text-red-400 mr-2" />
                        )}
                        <span className="font-semibold">Test Case #{index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Input:</span>
                          <div className="font-mono bg-gray-700/50 p-2 rounded mt-1 overflow-x-auto">
                            {testCase.input}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">Expected:</span>
                          <div className="font-mono bg-gray-700/50 p-2 rounded mt-1 overflow-x-auto">
                            {testCase.expectedOutput}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-gray-400">Actual:</span>
                          <div className={`font-mono p-2 rounded mt-1 overflow-x-auto ${testCase.passed ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                            {testCase.actualOutput}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
} 