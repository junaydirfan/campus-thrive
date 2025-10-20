/**
 * CampusThrive Loading Components
 * 
 * Provides comprehensive loading states with:
 * - Skeleton loaders for different content types
 * - Spinner variations for different contexts
 * - Loading overlays and progress indicators
 * - Smooth animations and transitions
 * - Accessibility features
 */

'use client';

import React from 'react';
import { Loader2, BarChart3, Target, Users, Zap } from 'lucide-react';

/**
 * Main loading spinner component
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  className = '', 
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      {text && (
        <p className="text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

/**
 * Full page loading component
 */
export function FullPageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" />
        <p className="text-lg text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}

/**
 * Card loading skeleton
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="card-content">
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
          <div className="h-8 bg-muted rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Chart loading skeleton
 */
export function ChartSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="card-content">
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="flex justify-between">
            <div className="h-3 bg-muted rounded w-1/4"></div>
            <div className="h-3 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Table loading skeleton
 */
export function TableSkeleton({ rows = 5, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`card animate-pulse ${className}`}>
      <div className="card-content">
        <div className="space-y-4">
          {/* Header */}
          <div className="h-6 bg-muted rounded w-1/4"></div>
          
          {/* Table rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="h-4 bg-muted rounded flex-1"></div>
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Scores loading skeleton
 */
export function ScoresSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main scores grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      
      {/* DSS breakdown */}
      <CardSkeleton />
      
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Dashboard loading skeleton
 */
export function DashboardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-muted rounded w-1/3 mx-auto animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse"></div>
      </div>
      
      {/* Quick check-in */}
      <CardSkeleton />
      
      {/* Scores */}
      <ScoresSkeleton />
      
      {/* Coach tips */}
      <CardSkeleton />
      
      {/* Recent entries */}
      <CardSkeleton />
      
      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Trends page loading skeleton
 */
export function TrendsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-muted rounded w-1/4 mx-auto animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse"></div>
      </div>
      
      {/* Charts grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
      
      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Patterns page loading skeleton
 */
export function PatternsSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-muted rounded w-1/4 mx-auto animate-pulse"></div>
        <div className="h-4 bg-muted rounded w-1/2 mx-auto animate-pulse"></div>
      </div>
      
      {/* Filters */}
      <CardSkeleton />
      
      {/* Drivers table */}
      <TableSkeleton rows={8} />
      
      {/* Power hours */}
      <ChartSkeleton />
    </div>
  );
}

/**
 * Loading overlay component
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  text = 'Loading...' 
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}

/**
 * Progress bar component
 */
interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showPercentage?: boolean;
}

export function ProgressBar({ 
  progress, 
  className = '', 
  showPercentage = true 
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-muted-foreground text-center">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
}

/**
 * Loading state hook
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  
  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);
  
  return {
    isLoading,
    startLoading,
    stopLoading,
    setIsLoading
  };
}

/**
 * Icon-based loading indicators
 */
export function IconLoading({ 
  icon: Icon, 
  className = '' 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Icon className="w-6 h-6 animate-pulse text-muted-foreground" />
    </div>
  );
}

/**
 * Specific loading components for different features
 */
export const FeatureLoaders = {
  Scores: () => <IconLoading icon={Target} />,
  Trends: () => <IconLoading icon={BarChart3} />,
  Patterns: () => <IconLoading icon={Users} />,
  Coach: () => <IconLoading icon={Zap} />
};
