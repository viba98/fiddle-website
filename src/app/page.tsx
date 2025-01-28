'use client';

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);

  // Global command+enter handler
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (email && !loading && !emailSent) {
          handleSignIn();
        } else if (emailSent) {
          window.open(waitlisted ? 'https://forms.gle/9wjkDzamRSeHVPRw5' : 'https://mail.google.com', '_blank');
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [email, loading, emailSent, waitlisted]);

  const handleSignIn = async () => {
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
        // Instead of showing error, show waitlist message
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
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 pt-16 bg-[#151517] text-white">
      {/* Logo + Name Section */}
      <div className="flex items-center gap-4 mb-16">
        <Image
          src="/logo.png"
          alt="Fiddle Logo"
          width={48}
          height={48}
          className="w-12 h-12"
        />
        <h1 className="text-4xl font-semibold">fiddle</h1>
      </div>

      {/* Title Section */}
      <div className="max-w-3xl text-center mb-16">
        <h2 className="text-5xl font-semibold leading-tight mb-4">
          Code is the best prototyping tool.
          <br />
          So we built a better code editor
        </h2>
      </div>

      {/* Get Access Section */}
      <div className="w-full max-w-md mb-16">
        <div className="relative">
          {!emailSent ? (
            <div className="flex gap-2">
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-[#1E1E20] text-white placeholder-gray-400 focus:border-[#FF6101] focus:ring-1 focus:ring-[#FF6101] outline-none transition-colors"
                disabled={loading}
              />
              <button
                onClick={handleSignIn}
                disabled={loading || !email}
                className="px-4 py-2 bg-[#FF6101] text-white rounded-lg hover:bg-[#FF3001] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? 'Sending...' : 'Get Access ⌘↵'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-4 py-3 bg-[#1E1E20] border border-gray-700 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF6101]" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M0,9.014L1.414,7.6L5.004,11.189L14.593,1.6L16.007,3.014L5.003,14.017L0,9.014Z" />
                </svg>
                <span>{waitlisted ? 'Added to waitlist' : 'Login link sent'}</span>
              </div>
              <button
                onClick={() => window.open(waitlisted ? 'https://forms.gle/9wjkDzamRSeHVPRw5' : 'https://mail.google.com', '_blank')}
                className="text-[#FF6101] hover:text-[#FF3001] transition-colors"
              >
                {waitlisted ? 'Jump Ahead ⌘↵' : 'Open Gmail ⌘↵'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video Section */}
      <div className="w-full max-w-5xl mb-16">
        <video 
          className="w-full rounded-lg shadow-lg"
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src="/teaser.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Discord Link Section */}
      <div className="mb-16">
        <a 
          href="https://discord.gg/SXtHUhpW"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 bg-[#5865F2] text-white rounded-lg hover:bg-[#4752C4] transition-colors"
        >
          <Image
            src="/discord.svg"
            alt="Discord"
            width={24}
            height={24}
            className="w-6 h-6"
          />
          <span className="font-medium">Join our Discord</span>
        </a>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-8 text-sm text-gray-400">
        © Pixelparc LLC
      </footer>
    </main>
  );
}
