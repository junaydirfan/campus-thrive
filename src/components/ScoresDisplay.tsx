/**
 * CampusThrive Scores Dashboard Component
 * 
 * Displays comprehensive wellness metrics including:
 * - Mood Composite (MC) with baseline comparison
 * - Daily Success Score (DSS) breakdown
 * - Learning Momentum (LM), Recovery Index (RI), Connection (CN)
 * - Streak counters and historical data visualization
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { calculateMC, calculateDSS, calculateStreak } from '@/lib/scoring';
import { StorageManager } from '@/lib/storage';
import type { MoodEntry } from '@/types';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Users, 
  Zap,
  Calendar,
  BarChart3,
  Activity,
  Brain,
  Shield,
  AlertCircle,
  Loader2
} from 'lucide-react';

/**
 * Custom hook that directly accesses localStorage and forces updates
 */
function useDirectMoodEntries() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [version, setVersion] = useState(0);

  const refreshEntries = useCallback(() => {
    console.log('useDirectMoodEntries: Refreshing entries from localStorage');
    try {
      const result = StorageManager.getItem('campus-thrive-mood-entries', (data): data is MoodEntry[] => Array.isArray(data), []);
      if (result.success && Array.isArray(result.data)) {
        setEntries(result.data);
        setVersion(prev => {
          const newVersion = prev + 1;
          console.log('useDirectMoodEntries: Entries refreshed', {
            count: result.data.length,
            version: newVersion
          });
          return newVersion;
        });
      }
    } catch (error) {
      console.error('useDirectMoodEntries: Error refreshing entries', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('useDirectMoodEntries: Storage change detected');
      refreshEntries();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes every 500ms when data loading
    const pollInterval = setInterval(() => {
      refreshEntries();
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [refreshEntries]);

  return { entries, version, refreshEntries };
}
class ScoreCalculator {
  /**
   * Calculate baseline scores for comparison
   */
  static calculateBaseline(entries: MoodEntry[]): { mc: number; lm: number; ri: number; cn: number } {
    if (entries.length === 0) return { mc: 0, lm: 0, ri: 0, cn: 0 };

    let totalMC = 0;
    let totalLM = 0;
    let totalRI = 0;
    let totalCN = 0;

    entries.forEach(entry => {
      // Simple MC calculation for baseline
      const mc = (entry.valence + entry.energy + entry.focus + (5 - entry.stress)) / 4;
      totalMC += mc;

      // Simple LM calculation
      const lm = entry.focus + (entry.deepworkMinutes || 0) * 0.1;
      totalLM += lm;

      // Simple RI calculation
      const ri = (entry.sleepHours || 7) * 0.3 + (entry.recoveryAction ? 1 : 0) * 0.2 + (5 - entry.stress) * 0.1;
      totalRI += ri;

      // Simple CN calculation
      const cn = (entry.socialTouchpoints || 0) * 0.1 + (entry.valence > 3 ? 0.2 : 0);
      totalCN += cn;
    });

    return {
      mc: totalMC / entries.length,
      lm: totalLM / entries.length,
      ri: totalRI / entries.length,
      cn: totalCN / entries.length
    };
  }
}

/**
 * Score display component
 */
interface ScoreDisplayProps {
  value: number;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  baseline?: number;
  isLoading?: boolean;
}

function ScoreDisplay({ value, label, description, icon: Icon, color, baseline, isLoading }: ScoreDisplayProps) {
  const isAboveBaseline = baseline !== undefined ? value > baseline : true;
  const baselineDiff = baseline !== undefined ? value - baseline : 0;

  if (isLoading) {
    return (
      <div className="card animate-pulse">
        <div className="card-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color} opacity-50`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="h-4 bg-muted rounded w-24 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              <span className="text-sm text-muted-foreground">Calculating...</span>
            </div>
            <div className="h-8 bg-muted rounded w-16 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{label}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          {baseline !== undefined && (
            <div className="flex items-center gap-1">
              {isAboveBaseline ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isAboveBaseline ? 'text-green-600' : 'text-red-600'}`}>
                {baselineDiff > 0 ? '+' : ''}{baselineDiff.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        <div className="text-center">
          <div className={`text-4xl font-bold ${isAboveBaseline ? 'text-green-600' : 'text-red-600'}`}>
            {value.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {isAboveBaseline ? 'Above baseline' : 'Below baseline'}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Progress bar component
 */
interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  color: string;
}

function ProgressBar({ value, max, label, color }: ProgressBarProps) {
  // Calculate a dynamic max value that's at least 20% higher than the current value
  const dynamicMax = Math.max(max, Math.ceil(value * 1.2));
  const percentage = Math.min(100, Math.max(0, (value / dynamicMax) * 100));
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-foreground">{label}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-center">
        {value.toFixed(1)} / {dynamicMax}
      </div>
    </div>
  );
}

/**
 * Main Scores Dashboard Component
 */
interface ScoresDisplayProps {
  isDataLoading?: boolean;
}

export function ScoresDisplay({ isDataLoading = false }: ScoresDisplayProps) {
  const [isCalculating, setIsCalculating] = useState(true);
  const [scores, setScores] = useState({
    mc: 0,
    dss: 0,
    lm: 0,
    ri: 0,
    cn: 0,
    streak: 0,
    baseline: {
      mc: 0,
      lm: 0,
      ri: 0,
      cn: 0
    }
  });

  // Use direct access instead of useMoodEntries hook
  const { entries: moodEntries, version } = useDirectMoodEntries();
  const [refreshKey, setRefreshKey] = useState(0);

  // Combined loading state
  const isLoading = isCalculating || isDataLoading;

  // Force refresh when mood entries change
  useEffect(() => {
    console.log('ScoresDisplay: Length changed, triggering refresh', {
      entriesLength: moodEntries.length,
      version
    });
    setRefreshKey(prev => prev + 1);
  }, [moodEntries.length, version]);

  // Additional trigger for data changes
  useEffect(() => {
    console.log('ScoresDisplay: Data changed, triggering refresh', {
      entriesLength: moodEntries.length,
      firstEntryId: moodEntries[0]?.id,
      lastEntryId: moodEntries[moodEntries.length - 1]?.id,
      version
    });
    setRefreshKey(prev => prev + 1);
  }, [moodEntries, version]);

  // Trigger recalculation when data loading completes
  useEffect(() => {
    if (!isDataLoading && moodEntries.length > 0) {
      console.log('ScoresDisplay: Data loading completed, forcing recalculation', {
        entriesLength: moodEntries.length,
        version
      });
      
      // Use a timeout to ensure the data has been fully processed
      const timeoutId = setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [isDataLoading, moodEntries.length, version]);

  // Calculate scores when data changes
  useEffect(() => {
    console.log('ScoresDisplay: useEffect triggered', {
      entriesLength: moodEntries.length,
      moodEntriesObject: moodEntries
    });
    
    const calculateScores = async () => {
      // Always show loading when recalculating
      setIsCalculating(true);
      
      try {
        const entries = moodEntries;
        
        console.log('ScoresDisplay: Starting calculation', {
          entriesLength: entries.length,
          moodEntriesValue: moodEntries,
          moodEntriesType: typeof moodEntries
        });
        
        if (entries.length < 3) {
          // Not enough data for z-score calculations
          console.log('ScoresDisplay: Insufficient data', { entriesLength: entries.length });
          setScores({
            mc: 0,
            dss: 0,
            lm: 0,
            ri: 0,
            cn: 0,
            streak: calculateStreak(entries).currentStreak,
            baseline: { mc: 0, lm: 0, ri: 0, cn: 0 }
          });
          setIsCalculating(false);
          return;
        }

        // Get last 14 days of data for baseline
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        const recentEntries = entries.filter(entry => 
          new Date(entry.timestamp) >= fourteenDaysAgo
        );

        // Get today's entry (most recent)
        const todayEntry = entries[entries.length - 1];
        if (!todayEntry) return;

        // Calculate scores using the centralized scoring system
        const mcResult = calculateMC(todayEntry, recentEntries);
        const dssResult = calculateDSS(todayEntry, recentEntries);
        const streakResult = calculateStreak(entries);

        // Calculate baselines for comparison
        const baseline = ScoreCalculator.calculateBaseline(recentEntries);

        console.log('ScoresDisplay: Calculated scores', {
          mc: mcResult.mc,
          dss: dssResult.dss,
          cn: dssResult.components.cn.raw,
          socialTouchpoints: todayEntry.socialTouchpoints,
          entriesLength: entries.length,
          recentEntriesLength: recentEntries.length
        });

        setScores({
          mc: mcResult.mc,
          dss: dssResult.dss,
          lm: dssResult.components.lm.raw,
          ri: dssResult.components.ri.raw,
          cn: dssResult.components.cn.raw,
          streak: streakResult.currentStreak,
          baseline
        });

      } catch (error) {
        console.error('Error calculating scores:', error);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateScores();
  }, [moodEntries, refreshKey, version]);

  const hasInsufficientData = moodEntries.length < 3;

  return (
    <div key={refreshKey} className={`space-y-6 transition-all duration-500 ${isLoading ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Wellness Scores</h2>
        <p className="text-muted-foreground">
          Your personalized wellness metrics and progress tracking
        </p>
        {isLoading && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            <span className="text-sm text-muted-foreground">Updating scores...</span>
          </div>
        )}
      </div>

      {/* Insufficient Data Warning */}
      {hasInsufficientData && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Building Your Baseline</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                We need at least 3 days of data to calculate personalized scores. 
                Generate demo data to see how the scores work, or keep logging your daily check-ins to build your baseline!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Scores Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
        {/* Mood Composite */}
        <ScoreDisplay
          value={scores.mc}
          label="Mood Composite"
          description="Overall emotional well-being based on valence, energy, focus, and stress"
          icon={Brain}
          color="bg-gradient-to-r from-primary to-primary/80"
          baseline={scores.baseline.mc}
          isLoading={isLoading}
        />

        {/* Daily Success Score */}
        <ScoreDisplay
          value={scores.dss}
          label="Daily Success Score"
          description="Combined metric of learning momentum, recovery, and connection"
          icon={Target}
          color="bg-gradient-to-r from-primary to-primary/80"
          isLoading={isLoading}
        />
      </div>

      {/* DSS Breakdown */}
      <div className={`card transition-all duration-500 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
        <div className="card-header">
          <h3 className="card-title">DSS Component Breakdown</h3>
          <p className="card-description">
            Understanding what contributes to your Daily Success Score
          </p>
        </div>
        <div className="card-content space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Learning Momentum */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Learning Momentum</h4>
                  <p className="text-sm text-muted-foreground">Focus + Deep Work</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : scores.lm.toFixed(1)}
                </div>
              </div>
              <ProgressBar
                value={scores.lm}
                max={100}
                label="Learning Momentum"
                color="bg-blue-500"
              />
            </div>

            {/* Recovery Index */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Recovery Index</h4>
                  <p className="text-sm text-muted-foreground">Sleep + Recovery + Low Stress</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : scores.ri.toFixed(1)}
                </div>
              </div>
              <ProgressBar
                value={scores.ri}
                max={10}
                label="Recovery Index"
                color="bg-green-500"
              />
            </div>

            {/* Connection */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Connection</h4>
                  <p className="text-sm text-muted-foreground">Valence + Social Interaction</p>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : scores.cn.toFixed(1)}
                </div>
              </div>
              <ProgressBar
                value={scores.cn}
                max={10}
                label="Connection"
                color="bg-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500 ${isLoading ? 'opacity-60' : 'opacity-100'}`}>
        {/* Streak Counter */}
        <div className="card">
          <div className="p-6 text-center flex flex-col justify-center h-full min-h-[120px]">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-foreground">Check-in Streak</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : scores.streak}
            </div>
            <p className="text-sm text-muted-foreground">consecutive days</p>
          </div>
        </div>

        {/* Total Entries */}
        <div className="card">
          <div className="p-6 text-center flex flex-col justify-center h-full min-h-[120px]">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-foreground">Total Entries</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {moodEntries.length}
            </div>
            <p className="text-sm text-muted-foreground">mood check-ins</p>
          </div>
        </div>

        {/* Data Quality */}
        <div className="card">
          <div className="p-6 text-center flex flex-col justify-center h-full min-h-[120px]">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-foreground">Data Quality</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {hasInsufficientData ? 'Building' : 'Ready'}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasInsufficientData ? 'Need 3+ days' : 'Personalized scores'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
