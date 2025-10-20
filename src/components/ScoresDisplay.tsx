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

import { useState, useEffect } from 'react';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { calculateMC, calculateDSS, calculateStreak } from '@/lib/scoring';
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
 * Score calculation utilities - now using the centralized scoring system
 */
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
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground">{value.toFixed(1)}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Main Scores Dashboard Component
 */
export function ScoresDisplay() {
  const [isLoading, setIsLoading] = useState(true);
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

  const moodEntries = useMoodEntries();

  // Calculate scores when data changes
  useEffect(() => {
    const calculateScores = async () => {
      setIsLoading(true);
      
      try {
        const entries = moodEntries.value;
        
        if (entries.length < 3) {
          // Not enough data for z-score calculations
          setScores({
            mc: 0,
            dss: 0,
            lm: 0,
            ri: 0,
            cn: 0,
            streak: calculateStreak(entries).currentStreak,
            baseline: { mc: 0, lm: 0, ri: 0, cn: 0 }
          });
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
        setIsLoading(false);
      }
    };

    calculateScores();
  }, [moodEntries.value]);

  const hasInsufficientData = moodEntries.value.length < 3;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Wellness Scores</h2>
        <p className="text-muted-foreground">
          Your personalized wellness metrics and progress tracking
        </p>
      </div>

      {/* Insufficient Data Warning */}
      {hasInsufficientData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">Building Your Baseline</h3>
              <p className="text-sm text-yellow-700">
                We need at least 3 days of data to calculate personalized scores. 
                Keep logging your daily check-ins to see your progress!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Scores Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mood Composite */}
        <ScoreDisplay
          value={scores.mc}
          label="Mood Composite"
          description="Overall emotional well-being based on valence, energy, focus, and stress"
          icon={Brain}
          color="bg-gradient-to-r from-blue-500 to-purple-600"
          baseline={scores.baseline.mc}
          isLoading={isLoading}
        />

        {/* Daily Success Score */}
        <ScoreDisplay
          value={scores.dss}
          label="Daily Success Score"
          description="Combined metric of learning momentum, recovery, and connection"
          icon={Target}
          color="bg-gradient-to-r from-green-500 to-emerald-600"
          isLoading={isLoading}
        />
      </div>

      {/* DSS Breakdown */}
      <div className="card">
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
                max={3}
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
                max={3}
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
                max={3}
                label="Connection"
                color="bg-purple-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              {moodEntries.value.length}
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
