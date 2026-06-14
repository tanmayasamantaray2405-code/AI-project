import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export default function GlassCard({ children, className = '', hoverEffect = false, ...props }: GlassCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl
        bg-white/40 dark:bg-slate-950/40 
        border border-white/30 dark:border-white/5 
        backdrop-blur-xl shadow-glass
        transition-all duration-300
        ${hoverEffect ? 'hover:shadow-glass-hover hover:-translate-y-0.5 hover:border-white/50 dark:hover:border-white/15' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 dark:to-white/5 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
