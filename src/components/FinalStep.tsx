'use client';

interface FinalStepProps {
  onNext: () => Promise<void>;
  onClose: () => void;
}

export default function FinalStep({ onNext, onClose }: FinalStepProps) {
  return (
    <div 
      className="text-start space-y-4"
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onNext();
        }
      }}
      tabIndex={0}
      autoFocus
    >
      <p className="text-sm text-gray-500">
        We&apos;ll email you soon with access!
      </p>
    </div>
  );
} 