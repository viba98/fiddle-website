'use client';

import type { OnboardingData } from '@/types/database';

interface ContactFormProps {
  data: OnboardingData;
  error: string | null;
  isSubmitting: boolean;
  onDataChange: (updates: Partial<OnboardingData>) => void;
  onSubmit: () => Promise<void>;
  onClose: () => void;
}

export default function ContactForm({ 
  data, 
  error, 
  isSubmitting, 
  onDataChange, 
  onSubmit, 
  onClose 
}: ContactFormProps) {
  const handleSubmit = async () => {
    if (!data.name || data.name.trim().length === 0 || !data.email || !data.email.includes('@')) {
      return;
    }
    await onSubmit();
  };

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-[#040404] border border-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Contact Information</h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <p className="text-lg mb-6 text-white">What&apos;s your name and email?</p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              value={data.name}
              onChange={(e) => onDataChange({ name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && data.name && data.email && data.email.includes('@')) {
                  handleSubmit();
                }
              }}
              placeholder="Enter your full name"
              className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
            />
            <input
              type="email"
              value={data.email}
              onChange={(e) => onDataChange({ email: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && data.name && data.email && data.email.includes('@')) {
                  handleSubmit();
                }
              }}
              placeholder="Enter your email address"
              className="w-full p-3 border border-gray-700 bg-[#111111] text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-[#FF3001] focus:border-[#FF3001] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="p-6 border-t border-gray-800">
          <button
            onClick={handleSubmit}
            disabled={!data.name || !data.email || !data.email.includes('@') || isSubmitting}
            className="w-full px-6 py-3 bg-[#FF3001] text-white rounded-lg hover:bg-[#FF3001]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>Submit <span className='pl-2 opacity-50'> ↵</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 