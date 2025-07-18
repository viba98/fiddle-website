'use client';

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import Hls from 'hls.js';
import OnboardingModal from '@/components/OnboardingModal';

function logBanner(){
  console.log(`
_____ _     _     _ _      
|  ___(_) __| | __| | | ___ 
| |_  | |/ _  |/ _  | |/ _ \

|  _| | | (_| | (_| | |  __/
|_|   |_|\__,_|\__,_|_|\___|

software is art.

twitter: https://twitter.com/fiddle_factory`);
}

logBanner();



export default function Home() {
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorText, setCursorText] = useState('[play]');
  const [isBrowser, setIsBrowser] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsBrowser(true);
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Check URL parameters for onboarding trigger
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('onboarding') === 'true') {
      setShowOnboardingModal(true);
    }
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Add this to handle iOS Safari 100vh issue
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Set CSS variable for viewport height
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };
      
      // Initial set
      setVH();
      
      // Update on resize
      window.addEventListener('resize', setVH);
      return () => window.removeEventListener('resize', setVH);
    }
  }, []);





  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
      setIsCursorVisible(true);
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        setIsCursorVisible(false);
      }, 4000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleMouseMove);
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const toggleVideo = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  useEffect(() => {
    setCursorText(isPlaying ? '[ pause ]' : '[ play ]');
  }, [isPlaying]);

  // Add this effect to prevent scrolling on mobile
  useEffect(() => {
    if (isMobile) {
      // Prevent scrolling on the body when on mobile
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      // Reset styles when not on mobile
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    
    return () => {
      // Cleanup function to reset styles when component unmounts
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isMobile]);

  const videoSrc = "https://vz-b083d267-5c4.b-cdn.net/6fbd8bed-c06a-41b3-a3e0-9472f8c3a9fe/playlist.m3u8";

  useEffect(() => {
    if (videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
          hls.currentLevel = hls.levels.length - 1; // Set to highest quality
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = videoSrc;
      }
    }
  }, []);

  return (
    <main 
      className={`flex min-h-screen flex-col items-center inset-0 bg-[#040404] text-white cursor-crosshair ${isMobile ? 'overflow-hidden' : ''}`} 
      style={{ 
        fontFamily: 'monospace',
        ...(isMobile && { 
          height: 'calc(var(--vh, 1vh) * 100)', // Use CSS variable for more accurate height
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          overscrollBehavior: 'none' // Additional protection against scroll bounce
        })
      }} 
      onClick={toggleVideo}
    >
      
      {/* Desktop UI */}
      {!isMobile && (
        <>

          {/* Main Content Layout */}
          <div className="flex w-full h-screen px-6 justify-center items-center">
            <div className="flex w-full max-w-6xl">
              {/* Video Section - 2/3 width */}
              <div className="w-2/3 pr-12">
                <div className="relative w-full h-full">
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    src={videoSrc}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>

              {/* Text Section - 1/3 width */}
              <div className="w-1/3 flex flex-col justify-center gap-2">
                <p className="text-xs font-semibold mix-blend-difference mb-2">FIDDLE | SOFTWARE IS ART</p>
                  <h1 className="text-4xl font-bold mb-4">Submit design QA as PRs, not Jira tickets</h1>
                  <p className="text-md text-gray-300 leading-relaxed">
                  Fix visual bugs faster without wasting hours of engineering time on back-and-forth.
                  </p>
                  
                  {/* Join Private Beta Button - Below text */}
                  <div className="mt-8 flex gap-4">
                  <a 
                    href="https://twitter.com/fiddle_factory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-2 py-2 transition-colors hover:cursor-crosshair opacity-70 hover:opacity-100"
                    onMouseEnter={() => setCursorText('[ Join Twitter ]')}
                    onMouseLeave={() => setCursorText(isPlaying ? '[ pause ]' : '[ play ]')}
                  >
                    <Image
                      src="/twitter.svg"
                      alt="Twitter"
                      width={20}
                      height={20}
                      className="mix-blend-difference text-white/70 hover:text-white"
                    />
                  </a>
                    <button
                      onClick={() => {
                        setShowOnboardingModal(true);
                      }}
                      onMouseEnter={() => setCursorText('')}
                      onMouseLeave={() => setCursorText(isPlaying ? '[ pause ]' : '[ play ]')}
                      className="red-l-shape text-[#FF3001] transition-colors text-xs font-semibold uppercase mix-blend-difference hover:cursor-crosshair"
                    >
                      <span>JOIN PRIVATE BETA</span>
                    </button>
                    
                  </div>
                </div>
              </div>
          </div>

          {/* [Play] Div */}
          <div 
            className="absolute z-30 text-white px-1 py-1 rounded uppercase font-semibold text-xs mix-blend-difference"
            style={{
              left: cursorPosition.x + (isBrowser && cursorPosition.x > (typeof window !== 'undefined' ? window.innerWidth : 0) - 150 ? -150 : 10) + 'px',
              top: cursorPosition.y + (isBrowser && cursorPosition.y > (typeof window !== 'undefined' ? window.innerHeight : 0) - 100 ? -100 : 10) + 'px',
              pointerEvents: 'none',
              opacity: isCursorVisible ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          >
            {cursorText}
          </div>
        </>
      )}

      {/* Mobile UI */}
      {isMobile && (
        <>
          {/* Mobile Content Layout */}
          <div className="flex flex-col w-full h-full px-4 pt-16 pb-20">
            {/* Text Section - Top */}
            <div className="flex-1 flex flex-col justify-center mb-6">
              <p className="text-xs font-semibold mix-blend-difference mb-2">FIDDLE | SOFTWARE IS ART</p>
              <h1 className="text-2xl font-bold mb-4">Submit design QA as PRs, not Jira tickets</h1>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">
                Fix visual bugs faster without wasting hours of engineering time on back-and-forth.
              </p>
              
              {/* Join Private Beta Button */}
              <div className="flex flex-start gap-4">
                <a 
                      href="https://twitter.com/fiddle_factory"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-2 py-2 transition-colors hover:cursor-crosshair opacity-70 hover:opacity-100"
                      onMouseEnter={() => setCursorText('[ Join Twitter ]')}
                      onMouseLeave={() => setCursorText(isPlaying ? '[ pause ]' : '[ play ]')}
                    >
                      <Image
                        src="/twitter.svg"
                        alt="Twitter"
                        width={20}
                        height={20}
                        className="mix-blend-difference text-white/70 hover:text-white"
                      />
                    </a>
                <button
                  onClick={() => {
                    setShowOnboardingModal(true);
                  }}
                  className="text-[#FF3001] transition-colors text-xs font-semibold uppercase mix-blend-difference hover:cursor-crosshair"
                >
                  <span>JOIN PRIVATE BETA</span>
                </button>
              </div>
            </div>

            {/* Video Section - Bottom */}
            <div className="flex-1 relative flex items-center justify-center">
              <video 
                ref={videoRef}
                className="w-full max-h-full object-contain rounded-lg shadow-lg"
                autoPlay 
                loop 
                muted 
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                src={videoSrc}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showOnboardingModal && (
        <OnboardingModal 
          isOpen={showOnboardingModal} 
          onClose={() => setShowOnboardingModal(false)} 
          initialStep={(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const step = urlParams.get('step');
            if (step === 'final') {
              return 3; // Final step index
            }
            return 0;
          })()}
          skipContactForm={(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const step = urlParams.get('step');
            // Skip contact form if we're coming from GitHub auth (step=final)
            return step === 'final';
          })()}
        />
      )}

    </main>
  );
}
