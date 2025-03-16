'use client';

import Image from "next/image";
import { useState, useEffect, useCallback, useRef } from "react";

const imageUrls = [
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png',
  '/img1.png'
];

// const timestamps = Array.from({ length: 11 }, (_, index) => {
//   const time = (index + 1) * 5; 
//   return `00:${time}`;
// });

function logBanner(){
  console.log(`
_____ _     _     _ _      
|  ___(_) __| | __| | | ___ 
| |_  | |/ _  |/ _  | |/ _ \

|  _| | | (_| | (_| | |  __/
|_|   |_|\__,_|\__,_|_|\___|

code is the best prototyping tool.

twitter: https://twitter.com/fiddle_factory`);
}

logBanner();

const timestamps = [
  '00:00 | INFINITE CANVAS',
  '00:05 | VIBE CODE',
  '00:10 | VISUAL EDITS',
  '00:15 | DESIGN SYSTEM',
  '00:20 | COLLABORATE'
]

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

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log('Sending request with email:', email);
      
      const response = await fetch('https://not.fiddle.is/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, source: "https://www.fiddle.is" })
      });

      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        console.log('Sign in failed:', data.error || 'Sign in failed');
        setEmailSent(true);
        setWaitlisted(true);
        return;
    }

      // Success case
      setEmailSent(true);
      setWaitlisted(false);
      
    } catch (err) {
      console.error('Sign in failed:', err);
      // On any error, show waitlist message
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
        if (email && !loading && !emailSent) {
          handleSignIn();
        } else if (emailSent) {
          window.open(waitlisted ? 'https://forms.gle/9wjkDzamRSeHVPRw5' : 'https://mail.google.com', '_blank');
        }
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

  const handleMouseMoveScrubber: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.currentTarget as HTMLDivElement;
    if (target) {
      const rect = target.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      setScrubberPosition(offsetX);
    }
  };

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

  return (
    <main className="flex min-h-screen flex-col items-center inset-0 bg-[#040404] text-white cursor-crosshair" style={{ fontFamily: 'monospace' }} onClick={toggleVideo}>
      
      {/* Logo + Name Section */}
      <div className="flex items-center gap-2 mb-4 absolute top-4 left-4 m-4 z-10">
        {/* <Image
          src="/logo.png"
          alt="Fiddle Logo"
          width={16}
          height={16}
        /> */}
        <span className="text-xs font-semibold mix-blend-difference">FIDDLE | SOFTWARE SHOULD FEEL LIKE MAGIC</span>
      </div>

      {/* Waitlist Section */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <a 
          href="https://discord.gg/fYUTpD86vu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-2 py-2 transition-colors"
          onMouseEnter={() => setCursorText('[ Join Discord ]')}
          onMouseLeave={() => setCursorText('[ play ]')}
        >
          <Image
            src="/discord.svg"
            alt="Discord"
            width={20}
            height={20}
            className="mix-blend-difference text-white/70 hover:text-white "
          />
        </a>
      </div>

      {/* Timestamps Section */}
      <div 
        className="absolute bottom-4 left-4 right-4 z-10 flex flex-col w-[calc(100%-32px)]"
        onMouseMove={handleMouseMoveScrubber} 
        onMouseEnter={() => setCursorText('')}
onMouseLeave={() => setCursorText('[ play ]')}
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
              borderTop: '8px solid #FF3001' ,
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

<button
key={index}
className="flex-1  text-white transition-colors text-xs font-semibold uppercase mix-blend-difference"

>
<span>{timestamp}</span>
</button>
          ))}
          <div className="relative">
          {!showInput ? (
            <button
              onClick={() => setShowInput(true)}
              className="button-l-shape text-[#FF3001] transition-colors text-xs font-semibold uppercase mix-blend-difference"
              
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
                  placeholder="Enter your email"
                  className="w-full px-2 py-2 text-xs border border-gray-700 bg-[#1E1E20] text-white placeholder-gray-400 focus:border-[#FF3101] focus:ring-1 focus:ring-[#FF3101] outline-none transition-colors"
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
                onClick={() => window.open(waitlisted ? 'https://forms.gle/9wjkDzamRSeHVPRw5' : 'https://mail.google.com', '_blank')}
                className="text-white hover:text-[#FF3001] transition-colors text-xs uppercase mix-blend-difference font-semibold"
              >
                {waitlisted ? 'Jump Ahead ↵' : 'Open Gmail ↵'}
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Dotted Line Above Image Section */}
        <div className="custom-divider"></div>

        {/* Image Section */}
        <div className="flex gap-2 z-10 py-4 w-full">
          {imageUrls.map((src, index) => (
            <div key={index} className="flex-1">
              <Image
                className="opacity-70 hover:opacity-100 w-full h-auto"
                src={src}
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

      {/* Video Section */}
      <div className="w-screen h-screen z-0 absolute inset-0">
        <video 
          ref={videoRef}
          className="w-screen h-screen rounded-lg shadow-lg absolute inset-0"
          autoPlay 
          loop 
          muted 
          playsInline
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src="/teaser-test.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </main>
  );
}
