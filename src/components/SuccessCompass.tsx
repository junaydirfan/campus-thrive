/**
 * CampusThrive Success Compass Component
 * 
 * Features:
 * - Radar/polar chart showing LM/RI/CN dimensions
 * - Current week vs baseline comparison
 * - Interactive tooltips with explanations
 * - Smooth animations and mobile optimization
 * - Loading and empty states
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { MoodEntry } from '@/types';
import { 
  Target,
  Brain,
  Heart,
  Loader2,
  Info,
  TrendingUp,
  Calendar,
  Activity,
  Shield,
  Users
} from 'lucide-react';
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval } from 'date-fns';

/**
 * Radar chart data point interface
 */
interface RadarDataPoint {
  dimension: string;
  current: number;
  baseline: number;
  fullMark: number;
}

/**
 * Success Compass calculation utilities
 */
class SuccessCompassCalculator {
  /**
   * Calculate LM (Learning Momentum) score
   */
  static calculateLM(entry: MoodEntry): number {
    const focus = entry.focus;
    const deepworkMinutes = entry.deepworkMinutes || 0;
    const tasksCompleted = entry.tasksCompleted || 0;
    
    // Focus component (0-5 scale, normalized to 0-1)
    const focusComponent = focus / 5;
    
    // Deep work component (max 180 minutes = 1)
    const deepworkComponent = Math.min(1, deepworkMinutes / 180);
    
    // Tasks component (max 10 tasks = 1)
    const tasksComponent = Math.min(1, tasksCompleted / 10);
    
    // Weighted combination
    return (focusComponent * 0.5) + (deepworkComponent * 0.3) + (tasksComponent * 0.2);
  }

  /**
   * Calculate RI (Recovery Index) score
   */
  static calculateRI(entry: MoodEntry): number {
    const sleepHours = entry.sleepHours || 0;
    const recoveryAction = entry.recoveryAction ? 1 : 0;
    const stress = entry.stress;
    
    // Sleep component (optimal 8 hours = 1)
    const sleepComponent = Math.min(1, sleepHours / 8);
    
    // Recovery action component (binary)
    const recoveryComponent = recoveryAction;
    
    // Stress component (inverted, 0 stress = 1)
    const stressComponent = (5 - stress) / 5;
    
    // Weighted combination
    return (sleepComponent * 0.4) + (recoveryComponent * 0.3) + (stressComponent * 0.3);
  }

  /**
   * Calculate CN (Connection) score
   */
  static calculateCN(entry: MoodEntry): number {
    const valence = entry.valence;
    const socialTouchpoints = entry.socialTouchpoints || 0;
    const socialTags = entry.tags.filter(tag => 
      ['social', 'friends', 'family', 'party', 'dating'].includes(tag.toLowerCase())
    ).length;
    
    // Valence component (0-5 scale, normalized to 0-1)
    const valenceComponent = valence / 5;
    
    // Social touchpoints component (max 5 touchpoints = 1)
    const touchpointsComponent = Math.min(1, socialTouchpoints / 5);
    
    // Social tags component (max 3 social tags = 1)
    const tagsComponent = Math.min(1, socialTags / 3);
    
    // Weighted combination
    return (valenceComponent * 0.4) + (touchpointsComponent * 0.4) + (tagsComponent * 0.2);
  }

  /**
   * Calculate average scores for a time period
   */
  static calculatePeriodAverages(entries: MoodEntry[]): { LM: number; RI: number; CN: number } {
    if (entries.length === 0) {
      return { LM: 0, RI: 0, CN: 0 };
    }

    const totals = entries.reduce(
      (acc, entry) => ({
        LM: acc.LM + this.calculateLM(entry),
        RI: acc.RI + this.calculateRI(entry),
        CN: acc.CN + this.calculateCN(entry)
      }),
      { LM: 0, RI: 0, CN: 0 }
    );

    return {
      LM: totals.LM / entries.length,
      RI: totals.RI / entries.length,
      CN: totals.CN / entries.length
    };
  }
}

/**
 * Custom tooltip component for radar chart
 */
function CustomRadarTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const current = payload[0].value;
    const baseline = payload[1]?.value || 0;
    
    const getDimensionInfo = (dimension: string) => {
      switch (dimension) {
        case 'Learning Momentum':
          return {
            description: 'Focus, deep work, and task completion',
            icon: <Brain className="w-4 h-4 text-blue-600" />,
            tips: current > baseline ? 'Great focus and productivity!' : 'Try scheduling deep work sessions'
          };
        case 'Recovery Index':
          return {
            description: 'Sleep quality, stress management, and recovery',
            icon: <Heart className="w-4 h-4 text-green-600" />,
            tips: current > baseline ? 'Excellent recovery habits!' : 'Consider improving sleep or stress management'
          };
        case 'Connection':
          return {
            description: 'Social interactions and positive mood',
            icon: <Users className="w-4 h-4 text-purple-600" />,
            tips: current > baseline ? 'Strong social connections!' : 'Try reaching out to friends or family'
          };
        default:
          return {
            description: 'Wellness dimension',
            icon: <Activity className="w-4 h-4 text-gray-600" />,
            tips: 'Keep tracking your wellness!'
          };
      }
    };

    const info = getDimensionInfo(label);

    return (
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          {info.icon}
          <span className="font-medium text-foreground">{label}</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current:</span>
            <span className="font-medium text-foreground">{(current * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Baseline:</span>
            <span className="font-medium text-foreground">{(baseline * 100).toFixed(0)}%</span>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">{info.description}</p>
            <p className="text-xs text-blue-600">{info.tips}</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Loading component
 */
function CompassLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Calculating your success compass...</p>
    </div>
  );
}

/**
 * Empty state component
 */
function CompassEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
      <Target className="w-12 h-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">No data yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start logging your daily check-ins to see your success compass. 
          Track your learning momentum, recovery, and connections!
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Need at least 3 days of data to generate insights</span>
      </div>
    </div>
  );
}

/**
 * Legend component
 */
function CompassLegend({ currentWeek, baseline }: { currentWeek: number; baseline: number }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-blue-600"></div>
        <span className="text-muted-foreground">Current Week</span>
        <span className="font-medium text-foreground">({currentWeek} days)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-400 border-2 border-dashed"></div>
        <span className="text-muted-foreground">Baseline Average</span>
        <span className="font-medium text-foreground">({baseline} days)</span>
      </div>
    </div>
  );
}

/**
 * Dimension info cards
 */
function DimensionInfoCards() {
  const dimensions = [
    {
      name: 'Learning Momentum',
      icon: <Brain className="w-5 h-5 text-blue-600" />,
      description: 'Focus, deep work sessions, and task completion',
      factors: ['Focus level', 'Deep work minutes', 'Tasks completed']
    },
    {
      name: 'Recovery Index',
      icon: <Heart className="w-5 h-5 text-green-600" />,
      description: 'Sleep quality, stress management, and recovery actions',
      factors: ['Sleep hours', 'Recovery actions', 'Stress level']
    },
    {
      name: 'Connection',
      icon: <Users className="w-5 h-5 text-purple-600" />,
      description: 'Social interactions, mood, and relationships',
      factors: ['Mood valence', 'Social touchpoints', 'Social activities']
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {dimensions.map((dimension) => (
        <div key={dimension.name} className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            {dimension.icon}
            <h4 className="font-medium text-foreground">{dimension.name}</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{dimension.description}</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {dimension.factors.map((factor) => (
              <li key={factor}>• {factor}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Main SuccessCompass component
 */
export function SuccessCompass() {
  const { value: moodEntries } = useMoodEntries();
  const [isLoading, setIsLoading] = useState(true);

  // Calculate current week and baseline data
  const compassData = useMemo(() => {
    if (moodEntries.length === 0) return null;

    const now = new Date();
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
    const baselineWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    const baselineWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    // Filter entries for current week
    const currentWeekEntries = moodEntries.filter(entry => 
      isWithinInterval(new Date(entry.timestamp), {
        start: currentWeekStart,
        end: currentWeekEnd
      })
    );

    // Filter entries for baseline week (previous week)
    const baselineEntries = moodEntries.filter(entry => 
      isWithinInterval(new Date(entry.timestamp), {
        start: baselineWeekStart,
        end: baselineWeekEnd
      })
    );

    // Calculate averages
    const currentWeekAverages = SuccessCompassCalculator.calculatePeriodAverages(currentWeekEntries);
    const baselineAverages = SuccessCompassCalculator.calculatePeriodAverages(baselineEntries);

    // Create radar chart data
    const radarData: RadarDataPoint[] = [
      {
        dimension: 'Learning Momentum',
        current: currentWeekAverages.LM,
        baseline: baselineAverages.LM,
        fullMark: 1
      },
      {
        dimension: 'Recovery Index',
        current: currentWeekAverages.RI,
        baseline: baselineAverages.RI,
        fullMark: 1
      },
      {
        dimension: 'Connection',
        current: currentWeekAverages.CN,
        baseline: baselineAverages.CN,
        fullMark: 1
      }
    ];

    return {
      radarData,
      currentWeekDays: currentWeekEntries.length,
      baselineDays: baselineEntries.length,
      currentWeekAverages,
      baselineAverages
    };
  }, [moodEntries]);

  // Simulate loading delay for better UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [moodEntries]);

  // Check if we have enough data
  const hasEnoughData = moodEntries.length >= 3;

  if (isLoading) {
    return <CompassLoading />;
  }

  if (!hasEnoughData) {
    return <CompassEmptyState />;
  }

  if (!compassData) {
    return <CompassEmptyState />;
  }

  const { radarData, currentWeekDays, baselineDays } = compassData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Target className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Success Compass</h2>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Visualize your wellness balance across Learning Momentum, Recovery Index, and Connection.
        </p>
      </div>

      {/* Radar Chart */}
      <div className="card p-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis 
                dataKey="dimension" 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <PolarRadiusAxis 
                angle={0} 
                domain={[0, 1]} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                tickCount={6}
              />
              <Radar
                name="Current Week"
                dataKey="current"
                stroke="hsl(221, 83%, 53%)"
                fill="hsl(221, 83%, 53%)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Radar
                name="Baseline"
                dataKey="baseline"
                stroke="hsl(var(--muted-foreground))"
                fill="transparent"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Tooltip content={<CustomRadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="mt-4">
          <CompassLegend currentWeek={currentWeekDays} baseline={baselineDays} />
        </div>
      </div>

      {/* Dimension Info Cards */}
      <DimensionInfoCards />

      {/* Insights */}
      <div className="card p-6 bg-muted/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">Insights</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-muted-foreground">
              <strong>Balanced Success:</strong> Aim for similar scores across all three dimensions for optimal wellness.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-muted-foreground">
              <strong>Weekly Tracking:</strong> Compare your current week to your baseline to see improvements.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" />
            <span className="text-muted-foreground">
              <strong>Privacy First:</strong> All calculations happen locally - your data never leaves your device.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
