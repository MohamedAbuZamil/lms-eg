import { cn } from '@/lib/utils';

interface LmsLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textSize?: string;
}

export function LmsLogo({ size = 40, className, showText = false, textSize = 'text-xl' }: LmsLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="lmsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        {/* Hexagon body */}
        <path
          d="M50 5 L88 27 L88 73 L50 95 L12 73 L12 27 Z"
          fill="url(#lmsGrad)"
        />
        {/* Book shape */}
        <path
          d="M50 75 L22 58 L22 42 L50 55 L78 42 L78 58 Z"
          fill="white"
          opacity="0.25"
        />
        <path
          d="M50 55 L22 42 L50 29 L78 42 Z"
          fill="white"
          opacity="0.4"
        />
        {/* Person/student */}
        <circle cx="50" cy="24" r="7" fill="white" opacity="0.9" />
        {/* Graduation cap */}
        <path
          d="M38 20 L50 15 L62 20 L50 22 Z"
          fill="white"
          opacity="0.9"
        />
        <path
          d="M50 14 L50 10 L56 6 L50 8 L44 6 L50 10"
          fill="white"
          opacity="0.7"
        />
        {/* Star/sparkle at top */}
        <path
          d="M50 2 L52 8 L58 8 L53 12 L55 18 L50 14 L45 18 L47 12 L42 8 L48 8 Z"
          fill="white"
          opacity="0.5"
        />
      </svg>
      {showText && (
        <span className={cn('font-bold text-foreground', textSize)}>LMS</span>
      )}
    </div>
  );
}
