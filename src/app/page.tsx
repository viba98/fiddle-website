'use client';

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";
import Hls from 'hls.js';

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

async function addContactToLoops(email: string, firstName: string = '', lastName: string = '', source: string): Promise<void> {
    const url = "/api/addContact";
    const payload = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        source: source,
        hasAccess: false
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        await response.json();
    } catch (error) {
        console.error("Error adding contact to Loops:", error);
    }
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [cursorText, setCursorText] = useState('[play]');
  const [isBrowser, setIsBrowser] = useState(false);
  const [isCursorVisible, setIsCursorVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsBrowser(true);
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
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

  const handleSignIn = useCallback(async () => {
    try {
        setLoading(true);
        await addContactToLoops('', '', '', 'www.fiddle.is');
        
    } catch (err) {
        console.error('Error adding contact to Loops:', err);
    } finally {
        setLoading(false);
    }
}, []);

  // Global command+enter handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
          window.open('https://twitter.com/intent/tweet?text=code%20is%20the%20best%20prototyping%20tool%0A&url=https://x.com/vibamohan_/status/1901649962938818659', '_blank');
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', handleGlobalKeyDown);
      }
    };
  }, [loading, handleSignIn]);

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
          {/* Logo + Name Section */}
          <div className="flex items-center gap-2 mb-4 absolute top-4 left-4 m-4 z-10">
            {/* <Image
              src="/logo.png"
              alt="Fiddle Logo"
              width={16}
              height={16}
            /> */}
            <span className="text-xs font-semibold mix-blend-difference">FIDDLE | SOFTWARE IS ART</span>
          </div>

          {/* Waitlist Section */}
          <div className="absolute top-4 right-4 z-10 flex gap-2 justify-center items-center">
            <a 
              href="https://discord.gg/fYUTpD86vu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-2 transition-colors hover:cursor-crosshair"
              onMouseEnter={() => setCursorText('[ Join Discord ]')}
              onMouseLeave={() => setCursorText(isPlaying ? '[ pause ]' : '[ play ]')}
            >
              <Image
                src="/discord.svg"
                alt="Discord"
                width={20}
                height={20}
                className="mix-blend-difference text-white/70 hover:text-white "
              />
            </a>
            <a 
              href="https://twitter.com/fiddle_factory"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 py-2 transition-colors hover:cursor-crosshair"
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
            <div className="relative">
            <button
              onClick={() => {
                window.location.href = '/github-access';
              }}
              onMouseEnter={() => setCursorText('')}
              onMouseLeave={() => setCursorText(isPlaying ? '[ pause ]' : '[ play ]')}
              className="red-l-shape text-[#FF3001] transition-colors text-xs font-semibold uppercase mix-blend-difference hover:cursor-crosshair"
            >
              <span>JOIN PRIVATE BETA</span>
            </button>
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
          {/* White overlay */}
          <div className="absolute inset-0 bg-white/5 z-10"></div>
          
          {/* Mobile logo */}
          <div className="absolute top-4 left-4 right-0 z-20 flex mix-blend-difference">
            <span className="text-sm font-bold text-white">FIDDLE</span>
          </div>
          
          {/* Mobile private beta button */}
          <div className="fixed left-0 right-0 z-20 mix-blend-difference bottom-0 ">
            <button
              onClick={() => {
                window.location.href = '/github-access';
              }}
              className="w-[calc(100%-32px)] p-8 bg-none text-white font-medium text-left text-6xl mix-blend-difference"
            >
              JOIN PRIVATE BETA →
            </button>
          </div>
        </>
      )}

      {/* Video Section - Common for both mobile and desktop */}
      <div className="w-screen h-screen z-0 absolute inset-0">
        <video 
          ref={videoRef}
          className={`inset-0 ${isMobile ? 'object-cover relative h-svh' : 'absolute w-screen h-screen'} rounded-lg shadow-lg`}
          autoPlay 
          loop 
          muted 
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          {/* HLS source is attached via hls.js or directly for Safari */}
          Your browser does not support the video tag.
        </video>
      </div>
    </main>
  );
}
