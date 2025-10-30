/**
 * CampusThrive Mood Slider Component
 * 
 * Beautiful, responsive sliders for mood tracking with:
 * - 4 mood dimensions (Valence, Energy, Focus, Stress)
 * - Distinct colors and icons for each dimension
 * - Real-time value display and smooth animations
 * - Mobile-friendly touch interactions
 * - Accessibility features
 * - Visual range indicators
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Smile, 
  Frown, 
  Battery, 
  Zap, 
  Target, 
  Eye, 
  Heart, 
  AlertTriangle
} from 'lucide-react';

/**
 * Mood dimension types
 */
export type MoodDimension = 'valence' | 'energy' | 'focus' | 'stress';

/**
 * Mood slider configuration
 */
export interface MoodSliderConfig {
  dimension: MoodDimension;
  label: string;
  description: string;
  minIcon: React.ComponentType<{ className?: string }>;
  maxIcon: React.ComponentType<{ className?: string }>;
  gradient: string;
  lowRange: { min: number; max: number; color: string; label: string };
  mediumRange: { min: number; max: number; color: string; label: string };
  highRange: { min: number; max: number; color: string; label: string };
}

/**
 * Mood slider props
 */
export interface MoodSliderProps {
  dimension: MoodDimension;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
  showLabels?: boolean;
  showRangeIndicators?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Individual mood slider component
 */
export function MoodSlider({
  dimension,
  value,
  onChange,
  disabled = false,
  className = '',
  showLabels = true,
  showRangeIndicators = true,
  size = 'md'
}: MoodSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Get configuration for this dimension
  const config = getMoodSliderConfig(dimension);

  // Calculate position and styles
  const percentage = (value / 5) * 100;
  const rangeIndicator = getRangeIndicator(value, config);

  // Handle mouse/touch events
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDragging(true);
    
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newValue = calculateValueFromPosition(e.clientX, rect);
    onChange(Math.max(0, Math.min(5, newValue)));
  }, [disabled, onChange]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || disabled) return;
    
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newValue = calculateValueFromPosition(e.clientX, rect);
    onChange(Math.max(0, Math.min(5, newValue)));
  }, [isDragging, disabled, onChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    let newValue = value;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newValue = Math.max(0, value - 0.1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newValue = Math.min(5, value + 0.1);
        break;
      case 'Home':
        newValue = 0;
        break;
      case 'End':
        newValue = 5;
        break;
      default:
        return;
    }
    
    e.preventDefault();
    onChange(newValue);
  }, [disabled, value, onChange]);

  // Add event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };
    }
    return undefined;
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Size classes
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  const thumbSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Value Display */}
      {showLabels && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded-md ${config.gradient}`}>
              <config.minIcon className={`${iconSizeClasses[size]} text-white`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{config.label}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-foreground">
              {value.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/ 5</span>
          </div>
        </div>
      )}

      {/* Range Indicators */}
      {showRangeIndicators && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className={value <= config.lowRange.max ? 'font-semibold text-foreground' : ''}>
            {config.lowRange.label}
          </span>
          <span className={value >= config.mediumRange.min && value <= config.mediumRange.max ? 'font-semibold text-foreground' : ''}>
            {config.mediumRange.label}
          </span>
          <span className={value >= config.highRange.min ? 'font-semibold text-foreground' : ''}>
            {config.highRange.label}
          </span>
        </div>
      )}

      {/* Slider Container */}
      <div className="relative">
        {/* Track */}
        <div
          ref={sliderRef}
          className={`
            relative ${sizeClasses[size]} rounded-full cursor-pointer
            bg-gradient-to-r from-muted to-muted-foreground/20
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}
            transition-all duration-200
          `}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-label={`${config.label} slider`}
          aria-valuemin={0}
          aria-valuemax={5}
          aria-valuenow={value}
          aria-valuetext={`${value.toFixed(1)} out of 5`}
          aria-disabled={disabled}
        >
          {/* Active Track */}
          <div
            className={`
              absolute top-0 left-0 h-full rounded-full
              ${getDynamicSliderColor(value, dimension)}
              transition-all duration-200 ease-out
              ${isDragging ? 'scale-y-110' : ''}
            `}
            style={{ width: `${percentage}%` }}
          />

          {/* Range Indicators on Track */}
          <div className="absolute inset-0 flex justify-between items-center px-1">
            <div className="w-1 h-1/2 bg-background/30 rounded-full" />
            <div className="w-1 h-1/2 bg-background/30 rounded-full" />
            <div className="w-1 h-1/2 bg-background/30 rounded-full" />
          </div>

          {/* Thumb */}
          <div
            ref={thumbRef}
            className={`
              absolute top-1/2 -translate-y-1/2 -translate-x-1/2
              ${thumbSizeClasses[size]} rounded-full
              bg-background border-2 border-primary shadow-lg
              flex items-center justify-center
              transition-all duration-200 ease-out
              ${isDragging ? 'scale-110 shadow-xl' : ''}
              ${isFocused ? 'ring-2 ring-primary ring-offset-2' : ''}
              ${disabled ? 'opacity-50' : 'hover:scale-105'}
              cursor-pointer
            `}
            style={{ left: `${percentage}%` }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            {/* Thumb Icon */}
            {value < 2.5 ? (
              <config.minIcon className={`${iconSizeClasses[size]} text-muted-foreground`} />
            ) : (
              <config.maxIcon className={`${iconSizeClasses[size]} text-primary`} />
            )}
          </div>
        </div>

        {/* Min/Max Labels */}
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>0</span>
          <span>5</span>
        </div>
      </div>

      {/* Current Range Indicator */}
      <div className="flex items-center justify-center gap-2">
        <div 
          className={`w-3 h-3 rounded-full ${rangeIndicator.color}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-foreground">
          {rangeIndicator.label}
        </span>
      </div>
    </div>
  );
}

/**
 * Complete mood tracking component with all 4 sliders
 */
export interface MoodTrackerProps {
  values: {
    valence: number;
    energy: number;
    focus: number;
    stress: number;
  };
  onChange: (dimension: MoodDimension, value: number) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showRangeIndicators?: boolean;
  showSummary?: boolean;
}

export function MoodTracker({
  values,
  onChange,
  disabled = false,
  className = '',
  size = 'md',
  showLabels = true,
  showRangeIndicators = true,
  showSummary = true
}: MoodTrackerProps) {
  const dimensions: MoodDimension[] = ['valence', 'energy', 'focus', 'stress'];

  // Calculate overall mood score
  const overallScore = (values.valence + values.energy + values.focus + (5 - values.stress)) / 4;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">How are you feeling?</h2>
        <p className="text-muted-foreground">
          Rate each dimension to track your current mood
        </p>
      </div>

      {/* Mood Sliders */}
      <div className="space-y-6">
        {dimensions.map((dimension) => (
          <MoodSlider
            key={dimension}
            dimension={dimension}
            value={values[dimension]}
            onChange={(value) => onChange(dimension, value)}
            disabled={disabled}
            size={size}
            showLabels={showLabels}
            showRangeIndicators={showRangeIndicators}
          />
        ))}
      </div>

      {/* Summary */}
      {showSummary && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Mood Summary</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Overall Score</span>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    overallScore < 1.5 ? 'bg-red-500/60' :
                    overallScore > 3.5 ? 'bg-green-500/60' :
                    'bg-muted-foreground/30'
                  }`}
                  style={{ width: `${(overallScore / 5) * 100}%` }}
                />
              </div>
              <span className="text-lg font-bold text-foreground">
                {overallScore.toFixed(1)}
              </span>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                dimensions.forEach(dim => onChange(dim, 2.5));
              }}
              className="flex-1 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
              disabled={disabled}
            >
              Reset to Neutral
            </button>
            <button
              onClick={() => {
                onChange('valence', 4);
                onChange('energy', 4);
                onChange('focus', 4);
                onChange('stress', 1);
              }}
              className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              disabled={disabled}
            >
              Great Day
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Helper function to calculate value from pointer position
 */
function calculateValueFromPosition(clientX: number, rect: DOMRect): number {
  const x = clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  return percentage * 5;
}

/**
 * Helper function to get range indicator for current value
 */
function getRangeIndicator(value: number, config: MoodSliderConfig) {
  if (value <= config.lowRange.max) {
    return config.lowRange;
  } else if (value >= config.mediumRange.min && value <= config.mediumRange.max) {
    return config.mediumRange;
  } else {
    return config.highRange;
  }
}

/**
 * Configuration for each mood dimension
 */
function getMoodSliderConfig(dimension: MoodDimension): MoodSliderConfig {
  const configs: Record<MoodDimension, MoodSliderConfig> = {
    valence: {
      dimension: 'valence',
      label: 'Valence',
      description: 'Overall positive emotional state',
      minIcon: Frown,
      maxIcon: Smile,
      gradient: 'bg-gradient-to-r from-red-500/60 via-muted-foreground/30 to-green-500/60',
      lowRange: { min: 0, max: 1.5, color: 'bg-red-500/60', label: 'Negative' },
      mediumRange: { min: 1.5, max: 3.5, color: 'bg-muted-foreground/40', label: 'Neutral' },
      highRange: { min: 3.5, max: 5, color: 'bg-green-500/60', label: 'Positive' }
    },
    energy: {
      dimension: 'energy',
      label: 'Energy',
      description: 'Physical and mental energy level',
      minIcon: Battery,
      maxIcon: Zap,
      gradient: 'bg-gradient-to-r from-red-500/60 via-muted-foreground/30 to-green-500/60',
      lowRange: { min: 0, max: 1.5, color: 'bg-red-500/60', label: 'Low' },
      mediumRange: { min: 1.5, max: 3.5, color: 'bg-muted-foreground/40', label: 'Moderate' },
      highRange: { min: 3.5, max: 5, color: 'bg-green-500/60', label: 'High' }
    },
    focus: {
      dimension: 'focus',
      label: 'Focus',
      description: 'Ability to concentrate and avoid distractions',
      minIcon: Eye,
      maxIcon: Target,
      gradient: 'bg-gradient-to-r from-red-500/60 via-muted-foreground/30 to-green-500/60',
      lowRange: { min: 0, max: 1.5, color: 'bg-red-500/60', label: 'Distracted' },
      mediumRange: { min: 1.5, max: 3.5, color: 'bg-muted-foreground/40', label: 'Focused' },
      highRange: { min: 3.5, max: 5, color: 'bg-green-500/60', label: 'Laser Focus' }
    },
    stress: {
      dimension: 'stress',
      label: 'Stress',
      description: 'Perceived level of stress and pressure',
      minIcon: Heart,
      maxIcon: AlertTriangle,
      gradient: 'bg-gradient-to-r from-green-500/60 via-muted-foreground/30 to-red-500/60',
      lowRange: { min: 0, max: 1.5, color: 'bg-green-500/60', label: 'Calm' },
      mediumRange: { min: 1.5, max: 3.5, color: 'bg-muted-foreground/40', label: 'Moderate' },
      highRange: { min: 3.5, max: 5, color: 'bg-red-500/60', label: 'High Stress' }
    }
  };

  return configs[dimension];
}

/**
 * Get dynamic color based on slider value
 */
function getDynamicSliderColor(value: number, dimension: MoodDimension): string {
  const config = getMoodSliderConfig(dimension);
  
  // For neutral range (1.5-3.5), return colorless
  if (value >= 1.5 && value <= 3.5) {
    return 'bg-muted-foreground/30';
  }
  
  // For stress dimension, invert the logic
  if (dimension === 'stress') {
    if (value < 1.5) {
      return 'bg-green-500/60'; // Low stress = green
    } else if (value > 3.5) {
      return 'bg-red-500/60'; // High stress = red
    }
  } else {
    // For other dimensions
    if (value < 1.5) {
      return 'bg-red-500/60'; // Low values = red
    } else if (value > 3.5) {
      return 'bg-green-500/60'; // High values = green
    }
  }
  
  // Fallback to neutral
  return 'bg-muted-foreground/30';
}
