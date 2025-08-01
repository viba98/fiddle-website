'use client';

import Image from "next/image";
import Hls from 'hls.js';
import { useState, useEffect, useCallback, useRef } from "react";

const imageUrls = [
  '/img0.png',
  '/img1.png',
  '/img2.png',
  '/img3.png',
  '/img4.png',
  '/img5.png',
  '/img6.png',
  '/img7.png',
  '/img8.png',
  '/img9.png',
];

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

const timestamps = [
  '00:00 | IMPORT FROM GITHUB AS USER journey',
  '00:10 | SPOT EDIT',
  '00:15 | Animate mode',
  '00:20 | custom editor panel',
  '00:25 | submit pr'
]

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
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [scrubberPosition, setScrubberPosition] = useState(0);
  const [showInput, setShowInput] = useState(false);
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
        await addContactToLoops(email, '', '', 'www.fiddle.is');
        setEmailSent(true);
        setWaitlisted(true);
        
    } catch (err) {
        console.error('Error adding contact to Loops:', err);
        setEmailSent(true);
        setWaitlisted(true);
    } finally {
        setLoading(false);
    }
}, [email]);

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
  }, [email, loading, emailSent, waitlisted, handleSignIn]);

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

  // Update scrubber position based on video progress
  useEffect(() => {
    const updateScrubberPosition = () => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        const newPosition = (currentTime / duration) * window.innerWidth; // Assuming full width for scrubber
        setScrubberPosition(newPosition);
      }
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('timeupdate', updateScrubberPosition);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', updateScrubberPosition);
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

  const handleTimestampClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget as HTMLDivElement;
    const rect = target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left; // Get the X position relative to the timestamp section

    // Check if videoRef.current and its duration are defined
    if (videoRef.current && videoRef.current.duration) {
        const newPosition = (offsetX / rect.width) * videoRef.current.duration; // Calculate the new time based on the click position
        videoRef.current.currentTime = newPosition; // Update the video's current time
    } else {
        console.warn("Video duration is not available yet.");
    }
  };

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

  const videoSrc = "https://customer-jxttjt9eb2p8knaj.cloudflarestream.com/d85e270b0b06a926462bb93fbfdbc9f6/manifest/video.m3u8";

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
              onClick={() => window.open('https://rapid-stream.notion.site/Founding-Engineer-1cb7b9f0449880d9841fdc12ed641b4e?pvs=4', '_blank')}
              onMouseEnter={() => setCursorText('')}
              onMouseLeave={() => setCursorText(isPlaying ? '[ pause ]' : '[ play ]')}
              className="white-l-shape text-[#fff] transition-colors text-xs font-semibold uppercase mix-blend-difference hover:cursor-crosshair"
            >
              <span>HIRING</span>
            </button>
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              onMouseEnter={() => setCursorText('')}
              onMouseLeave={() => setCursorText(isPlaying ? '[ pause ]' : '[ play ]')}
              className="red-l-shape text-[#FF3001] transition-colors text-xs font-semibold uppercase mix-blend-difference hover:cursor-crosshair"
            >
              <span>JOIN WAITLIST</span>
            </button>
          ) : !emailSent ? (
            <div className="flex gap-2">
              <div className="relative w-full">
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter Email"
                  className="w-full px-2 py-2 text-xs border border-neutral-800 bg-[#111111] text-white placeholder-gray-400 focus:border-[#FF3101] focus:ring-1 focus:ring-[#FF3101] outline-none transition-colors"
                  disabled={loading}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white text-sm">
                  ↵
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2 py-2 bg-[#1E1E20] border border-gray-700 shadow-sm gap-6 ">
              <div className="flex items-center gap-2">
                <span className='text-white/60 text-xs uppercase mix-blend-difference' style={{ fontFamily: 'monospace' }}>{waitlisted ? 'Added' : 'Login link sent'}</span>
              </div>
              <button
                onClick={() => {
                    const tweetUrl = "https://twitter.com/intent/tweet?text=code%20is%20the%20best%20prototyping%20tool%0A&url=https://x.com/vibamohan_/status/1901649962938818659";
                    window.open(tweetUrl, '_blank');
                  //   window.open(waitlisted ? 'https://forms.gle/9wjkDzamRSeHVPRw5' : 'https://mail.google.com', '_blank');
                }}
                className="text-white hover:text-[#FF3001] transition-colors text-xs uppercase mix-blend-difference font-semibold"
              >
                {waitlisted ? 'Jump Ahead ↵' : 'Open Gmail ↵'}
              </button>
            </div>
          )}
        </div>
          </div>

          {/* Timestamps Section */}
          <div 
            className="absolute bottom-4 left-4 right-4 z-10 flex flex-col w-[calc(100%-32px)]"
            onMouseEnter={() => {
              setCursorText('');
            }}
            onMouseLeave={() => {
              setCursorText(isPlaying ? '[ pause ]' : '[ play ]');
            }}
            onClick={handleTimestampClick}
          >
            <div className="z-20 gap-0">
              {/* orange Scrubber Line */}
              <div 
                className="absolute bg-[#FF3001] z-20"
                style={{
                  left: `${scrubberPosition - 2}px`, 
                  height: '120%', 
                  width: '1px',
                  top: '-10%',
                  transition: 'left 0.05s ease-out'
                }}
              ></div>

              {/* Triangle at the top of the Scrubber */}
              <div 
                className="absolute z-20"
                style={{
                  left: `${scrubberPosition - 7}px`, 
                  top: '-12%',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '8px solid #FF3001',
                  transition: 'left 0.05s ease-out'
                }}
              ></div>

              {/* Rectangle Above the Triangle */}
              <div 
                className="absolute z-20"
                style={{
                  left: `${scrubberPosition - 7}px`, 
                  top: 'calc(-12% - 5px)', 
                  width: '12px', 
                  height: '5px', 
                  backgroundColor: '#FF3001',
                  transition: 'left 0.05s ease-out'
                }}
              ></div>
            </div>

      <div className="flex justify-between w-full mb-2 z-10 items-center">
        {timestamps.map((timestamp, index) => (
          <span
            key={index}
            className="flex-grow text-white transition-colors text-xs font-semibold uppercase mix-blend-difference"
          >
            {timestamp}
          </span>
        ))}
        
      </div>

            {/* Dotted Line Above Image Section */}
            <div className="custom-divider"></div>

            {/* Image Section */}
            <div className="flex gap-4 z-10 py-2 w-full">
              {imageUrls.map((src, index) => (
                <div key={index} className="flex-1">
                  <Image
                    className="opacity-60 hover:opacity-100 w-full h-auto"
                    src={`/polish-pr${src}`}
                    alt={`Image ${index + 1}`}
                    width={60}
                    height={60}
                    layout="responsive"
                  />
                </div>
              ))}
            </div>

            {/* Dotted Line Below Image Section */}
            <div className="custom-divider"></div>
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
          
          {/* Mobile waitlist button */}
          <div className={`fixed left-0 right-0 z-20 ${!showInput ? 'mix-blend-difference bottom-0 ' : ' top-0'}`}>
            {!emailSent ? 
            (!showInput ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInput(true);
                  }}
                  className="w-[calc(100%-32px)] p-8 bg-none text-white font-medium text-left text-6xl mix-blend-difference"
                >
                  JOIN WAITLIST →
                </button>
              ) : 
            (
                <div className="w-screen h-screen inset-0 bg-black rounded-md px-8 py-16">
                  <input
                    type="email"
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 mb-3 border border-zinc-700 text-white bg-zinc-800 focus:ring-[#FF3001] focus:ring-1 focus:outline-none"
                    disabled={loading}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSignIn();
                    }}
                    className="w-full py-3 text-[#ff3101] font-bold"
                    disabled={loading}
                  >
                    {loading ? "SUBMITTING..." : "SUBMIT"}
                  </button>
                </div>
              )
            ) : (
              <div className="w-full bg-black px-8 py-16 rounded-md text-center h-screen">
                <p className="text-white mb-3">
                  {waitlisted ? "You've been added to our waitlist!" : "Login link sent!"}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const tweetUrl = "https://twitter.com/intent/tweet?text=code%20is%20the%20best%20prototyping%20tool%0A&url=https://x.com/vibamohan_/status/1901649962938818659";
                    window.open(tweetUrl, '_blank');
                  }}
                  className="w-full py-3 text-[#ff3101] font-bold rounded-md"
                >
                  {waitlisted ? "JUMP AHEAD" : "OPEN GMAIL"}
                </button>
              </div>
            )}
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
