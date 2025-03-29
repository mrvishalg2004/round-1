'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import styles from './Round1.module.css';
import GameTimer from '@/components/GameTimer';

// Create a safe confetti function in case the import fails
const safeConfetti = (options: any) => {
  try {
    confetti(options);
  } catch (error) {
    console.error('Confetti error:', error);
  }
};

export default function Round1() {
  const router = useRouter();
  const roundRef = useRef<HTMLDivElement>(null);
  
  // State variables
  const [links, setLinks] = useState<{ id: string; content: string; isReal: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hint, setHint] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(1);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [linkClicked, setLinkClicked] = useState<string | null>(null);
  const [confirmNeeded, setConfirmNeeded] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [score, setScore] = useState(100);
  
  // Mouse tracking for evasion
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isEvading, setIsEvading] = useState(false);
  const [linkPositions, setLinkPositions] = useState<Record<string, { x: number; y: number; lastMove: number }>>({});
  const [currentHoverLink, setCurrentHoverLink] = useState<string | null>(null);

  const [gameStatus, setGameStatus] = useState({
    isStarted: true,
    timerStartedAt: null,
    timerPausedAt: null,
    isTimerRunning: false,
    timerDuration: 10 * 60 * 1000
  });

  // Initialize game on component mount
  useEffect(() => {
    fetchGameStatus();
  }, []);

  // Add mouse movement tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!roundRef.current) return;
    
    const rect = roundRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };
  
  // Effect for real link evasion
  useEffect(() => {
    // Only attempt evasion for real links when they're being hovered and not already evading
    if (!currentHoverLink || !currentHoverLink.includes('real') || isEvading) return;
    
    // 40% chance to evade when mouse gets close
    if (Math.random() < 0.4) {
      setIsEvading(true);
      
      // Find a new random position for the link
      const linksContainer = document.querySelector(`.${styles.links}`);
      if (!linksContainer) {
        setIsEvading(false);
        return;
      }
      
      const containerRect = linksContainer.getBoundingClientRect();
      
      // Calculate new position that's away from current mouse position
      const getRandom = (min: number, max: number) => Math.floor(Math.random() * (max - min) + min);
      
      // Get a position that's at least 100px away from mouse
      let newX, newY, attempts = 0;
      do {
        newX = getRandom(0, containerRect.width - 150);
        newY = getRandom(0, containerRect.height - 60);
        attempts++;
      } while (
        Math.sqrt(Math.pow(newX - mousePosition.x, 2) + Math.pow(newY - mousePosition.y, 2)) < 150 && 
        attempts < 10
      );
      
      setLinkPositions(prev => ({
        ...prev,
        real: { x: newX, y: newY, lastMove: Date.now() }
      }));
      
      // Reset evading state after a short delay
      setTimeout(() => {
        setIsEvading(false);
      }, 300);
    }
  }, [mousePosition, currentHoverLink, isEvading]);

  // Add timer for periodic link swapping
  useEffect(() => {
    // Occasionally swap the real link with a fake one to make it harder
    const swapInterval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 3 seconds
        // Swap links without directly moving them
        setLinks(prevLinks => {
          // Find the real link
          const realLinkIndex = prevLinks.findIndex(link => link.isReal);
          if (realLinkIndex === -1) return prevLinks;
          
          // Find a random fake link
          const fakeLinks = prevLinks.filter(link => !link.isReal);
          if (fakeLinks.length === 0) return prevLinks;
          
          const randomFakeLink = fakeLinks[Math.floor(Math.random() * fakeLinks.length)];
          const fakeLinkIndex = prevLinks.findIndex(link => link.id === randomFakeLink.id);
          
          // Create a copy of the array
          const newLinks = [...prevLinks];
          
          // Swap the content but keep the isReal property
          const realLinkContent = prevLinks[realLinkIndex].content;
          newLinks[realLinkIndex] = {
            ...newLinks[realLinkIndex],
            content: randomFakeLink.content
          };
          
          newLinks[fakeLinkIndex] = {
            ...newLinks[fakeLinkIndex],
            content: realLinkContent
          };
          
          return newLinks;
        });
      }
    }, 3000);
    
    return () => clearInterval(swapInterval);
  }, []);

  // Update the getTeamInfo function to always return some valid data
  const getTeamInfo = () => {
    try {
      const cookies = document.cookie.split(';');
      const teamCookie = cookies.find(cookie => cookie.trim().startsWith('team='));
      
      if (teamCookie) {
        const teamData = JSON.parse(decodeURIComponent(teamCookie.split('=')[1]));
        return teamData;
      }
      
      // Fallback team data if no cookie exists
      return { 
        id: 'guest-' + Math.random().toString(36).substring(2, 9),
        name: 'Guest Team',
        token: 'guest-token'
      };
    } catch (error) {
      console.error('Error getting team info:', error);
      // Return fallback team data
      return { 
        id: 'guest-' + Math.random().toString(36).substring(2, 9),
        name: 'Guest Player',
        token: 'guest-token'
      };
    }
  };

  // Fetch game status function
  const fetchGameStatus = async () => {
    setLoading(true);
    
    try {
      // Simulated loading time (remove in production)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if the user has completed this round already
      const cookies = document.cookie.split(';');
      const completionCookie = cookies.find(cookie => cookie.trim().startsWith('round1_completed='));
      
      if (completionCookie && completionCookie.split('=')[1] === 'true') {
        // If already completed, redirect to dashboard
        router.push('/dashboard');
        return;
      }

      // Fetch game status data for timer
      try {
        const response = await fetch('/api/admin/game-status');
        if (response.ok) {
          const data = await response.json();
          setGameStatus(data);
        }
      } catch (error) {
        console.error('Error fetching game status for timer:', error);
      }
      
      // Set up the real link and fake links with more deceptive content
      const realLinkContent = 'Next Round';
      const fakeContents = [
        'Click Here',
        'Try This',
        'Secret Link',
        'Hidden Path',
        'Next Round', // Decoy with same text as real link
        'Mystery Door',
        'Enter Here',
        'Next Step',
        'Continue',
        'Proceed',
        'This Way',
        'Next Round →', // Similar decoy
        'Move Forward',
        'Go to Next',
        'Continue to Next Round', // Longer decoy that seems legitimate
        'Pathway',
        'Gateway',
        'Finish Round 1',
        'Submit Answer',
        'Open Door',
        'Enter Now',
        'Checkpoint',
        'Next Round', // Another decoy
        'Right Path',
        'Correct Way',
      ];
      
      // Create links: 1 real link and 19 fake links
      const numberOfFakeLinks = 19; // Increased number of fake links
      const randomFakes = [...fakeContents]
        .sort(() => Math.random() - 0.5)
        .slice(0, numberOfFakeLinks);
      
      const allLinks = [
        { id: 'real', content: realLinkContent, isReal: true },
        ...randomFakes.map((content, index) => ({
          id: `fake-${index}`,
          content,
          isReal: false
        }))
      ];
      
      // Shuffle the array to position the real link randomly
      const shuffledLinks = [...allLinks].sort(() => Math.random() - 0.5);
      
      setLinks(shuffledLinks);
      setHint('The real link is tricky - it may move away when you get close, change appearance, or hide among similar-looking links. Look for subtle differences.');
      setStartTime(new Date());
      
    } catch (error) {
      console.error('Error fetching game status:', error);
      setErrorMessage('There was an error loading the game. Please refresh the page to try again.');
    } finally {
      setLoading(false);
      setInitialLoadComplete(true);
    }
  };
  
  // Update the getLinkOpacity function to make it harder to see subtle differences
  const getLinkOpacity = (linkId: string): number => {
    if (!currentHoverLink || !mousePosition.x || !mousePosition.y) return 0.9;
    
    const linkEl = document.getElementById(linkId);
    if (!linkEl) return 0.9;
    
    const rect = linkEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from mouse to link center
    const distance = Math.sqrt(
      Math.pow(mousePosition.x - centerX, 2) + 
      Math.pow(mousePosition.y - centerY, 2)
    );
    
    // Fade out more as mouse gets closer - more aggressive fading
    const opacity = Math.min(0.9, distance / 300);
    return Math.max(0.3, opacity); // Never completely invisible
  };

  // Update the submitRound function to use safeConfetti
  const submitRound = async () => {
    if (!startTime) return;
    
    setLoading(true);
    setErrorMessage('');
    
    try {
      // Calculate time spent in seconds
      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      
      // Get team info
      const team = getTeamInfo();
      
      if (!team || !team.token) {
        router.push('/');
        return;
      }
      
      // Calculate score based on attempts and time
      let finalScore = 100;
      finalScore -= Math.min(50, (attempts - 1) * 5); // -5 points per attempt after the first
      finalScore -= Math.min(30, Math.floor(timeSpent / 10)); // -1 point per 10 seconds
      
      finalScore = Math.max(10, finalScore); // Minimum score is 10
      
      // Store the calculated score in state
      setScore(finalScore);
      
      // Set completion cookie
      document.cookie = "round1_completed=true; path=/; max-age=31536000";
      
      // Submit completion to API
      try {
        await fetch('/api/rounds/round1/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${team.token}`
          },
          body: JSON.stringify({
            score: finalScore,
            attempts,
            timeSpent,
          })
        });
      } catch (submitError) {
        console.error('Error submitting round:', submitError);
        // Continue with success flow even if API call fails
      }
      
      // Create a spectacular confetti celebration
      // First burst - center
      safeConfetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.3, x: 0.5 },
        colors: ['#FFD700', '#FFA500', '#FF4500', '#00FF00', '#1E90FF']
      });
      
      // Left side burst
      setTimeout(() => {
        safeConfetti({
          particleCount: 100,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.5 }
        });
      }, 500);
      
      // Right side burst
      setTimeout(() => {
        safeConfetti({
          particleCount: 100,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.5 }
        });
      }, 750);
      
      // Final celebratory shower
      setTimeout(() => {
        safeConfetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0, x: 0.5 },
          gravity: 0.5,
          scalar: 1.2
        });
      }, 1200);
      
      // Show success message 
      setShowSuccessMessage(true);
      setLoading(false);
      
      // Redirect to dashboard after showing success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 6000); // Give more time to enjoy the celebration
    } catch (error) {
      console.error('Error submitting round:', error);
      // Even if there's an error, show victory screen
      setShowSuccessMessage(true);
      setLoading(false);
      
      // Redirect to dashboard after showing success message
      setTimeout(() => {
        router.push('/dashboard');
      }, 6000);
    }
  };

  // Update the handleConfirmClick function to use safeConfetti
  const handleConfirmClick = async (id: string) => {
    if (id === 'real') {
      setConfirmNeeded(false);
      
      // Initial confetti burst
      safeConfetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 }
      });
      
      // Success case - submit the round completion
      await submitRound();
    } else {
      setConfirmNeeded(false);
      setErrorMessage('That was not the real link. Try again!');
      setAttempts(prev => prev + 1);
    }
  };

  // Update the link click handler
  const handleLinkClick = (id: string) => {
    if (id === 'real') {
      if (!confirmNeeded) {
        setConfirmNeeded(true);
        setLinkClicked(id);
        setErrorMessage('Click again to confirm and complete Round 1!');
      } else {
        handleConfirmClick(id);
      }
    } else {
      setAttempts(prev => prev + 1);
      setErrorMessage('That was not the real link. Keep looking!');
      setShowHint(true);
    }
  };

  // Update the Success Message component to show a simpler victory message
  const SuccessMessage = () => {
    return (
      <div className={styles.successMessage}>
        <div className={styles.celebrationContainer}>
          <div className={styles.trophy}>🏆</div>
          <div className={styles.confettiLeft}>🎊</div>
          <div className={styles.confettiRight}>🎉</div>
          <div className={styles.partyPopper1}>🎉</div>
          <div className={styles.partyPopper2}>🎊</div>
          
          <h1 className={styles.victoryTitle}>Round 1 Complete!</h1>
          <p className={styles.teamName}>
            Congratulations! <span>🎉</span>
          </p>
          <p className={styles.victoryText}>
            You found the real link and completed the first round!
          </p>
          
          <div className={styles.eligibleMessage}>
            <p className={styles.eligibleText}>Great job! You qualified for round 2!</p>
          </div>
          
          <p className={styles.redirectText}>
            Redirecting to dashboard in a few seconds...
          </p>
        </div>
      </div>
    );
  };
  
  if (loading && !initialLoadComplete) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading round...</p>
        </div>
      </div>
    );
  }

  if (showSuccessMessage) {
    return <SuccessMessage />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white relative" ref={roundRef} onMouseMove={handleMouseMove}>
      {/* Game Timer */}
      <GameTimer 
        isActive={gameStatus.isTimerRunning} 
        timerStartedAt={gameStatus.timerStartedAt}
        timerPausedAt={gameStatus.timerPausedAt}
        timerDuration={gameStatus.timerDuration}
      />
      
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Round 1: Hidden Link Hunt</h1>
          <p>Find the real link to proceed to the next round!</p>
          <p>Attempts: {attempts}</p>
        </div>
        
        <div className={styles.instructionsWrapper}>
          <div className={styles.instructions}>
            <p>Welcome to Round 1! Your task is to find the real link that will take you to the next round.</p>
            <p>This is a challenge of observation and quick reflexes. The real link will try to avoid being caught!</p>
            <p>Some links may look identical, but only one is real. It might change position, visibility, or appearance.</p>
            <p>Good luck!</p>
          </div>
        </div>
        
        {!showHint && hint && (
          <button
            className={styles.hintButton}
            onClick={() => setShowHint(true)}
          >
            Need a hint?
          </button>
        )}
        
        {showHint && hint && (
          <div className={styles.hint}>
            <strong>Hint:</strong> {hint}
            {attempts > 3 && (
              <p className="mt-2 text-sm">
                Additional hint: When you find a suspicious link, try to click it quickly before it escapes!
              </p>
            )}
          </div>
        )}
        
        {errorMessage && (
          <div className={styles.error}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorContent}>
              <div className={styles.errorTitle}>Error</div>
              <div className={styles.errorMessage}>{errorMessage}</div>
              {attempts > 2 && (
                <div className={styles.errorHint}>
                  The real link might look slightly different when you hover over it.
                </div>
              )}
            </div>
          </div>
        )}
        
        {confirmNeeded && (
          <div className={styles.confirmMessage}>
            Click again to confirm and complete Round 1!
          </div>
        )}
        
        {/* Links Container */}
        <div className={styles.links}>
          {links.map((link) => {
            const style: React.CSSProperties = {};
            
            // Apply special styling for real link
            if (link.isReal) {
              const pos = linkPositions[link.id];
              
              if (pos) {
                style.position = 'absolute';
                style.left = `${pos.x}px`;
                style.top = `${pos.y}px`;
                style.zIndex = 10;
              }
              
              style.opacity = getLinkOpacity(link.id);
              
              // Subtle color difference that's hard to notice
              style.backgroundColor = '#1d2736'; // Slightly different from normal #1f2937
            }
            
            return (
              <div
                key={link.id}
                id={link.id}
                className={`
                  ${styles.link} 
                  ${link.isReal ? styles.realLink : ''} 
                  ${linkClicked === link.id ? styles.clicked : ''}
                `}
                style={style}
                onClick={() => handleLinkClick(link.id)}
                onMouseEnter={() => setCurrentHoverLink(link.id)}
                onMouseLeave={() => setCurrentHoverLink(null)}
              >
                {link.isReal ? (
                  <span className={styles.realLinkText}>{link.content}</span>
                ) : (
                  link.content
                )}
              </div>
            );
          })}
        </div>
        
        {loading && initialLoadComplete && (
          <div className={styles.loadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Processing your request...</p>
          </div>
        )}
      </div>
    </div>
  );
} 