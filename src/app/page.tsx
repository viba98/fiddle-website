'use client';

import { useState, useEffect } from "react";



export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
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

  return (
    <main 
      className={`flex min-h-screen flex-col items-center justify-center inset-0 bg-[#040404] text-white cursor-crosshair ${isMobile ? 'overflow-hidden' : ''}`} 
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
    >
      <div className="text-2xl font-semibold mix-blend-difference">
        Nothing to see here
      </div>
    </main>
  );
}
