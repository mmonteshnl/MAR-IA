import { Loader2 } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-24 w-24',
  };
  return (
    <div className={`flex justify-center items-center h-full w-full ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
    </div>
  );
}
