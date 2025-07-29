interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showStepText?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export default function ProgressBar({ 
  currentStep, 
  totalSteps, 
  showStepText = true, 
  showPercentage = true,
  className = ""
}: ProgressBarProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className={`mb-4 ${className}`}>
      {(showStepText || showPercentage) && (
        <div className="flex justify-between text-sm text-gray-400">
          {showStepText && (
            <span>Step {currentStep + 1} of {totalSteps}</span>
          )}
          {showPercentage && (
            <span>{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-[#FF3001] h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}