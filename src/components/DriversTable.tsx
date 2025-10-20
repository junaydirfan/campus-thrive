/**
 * CampusThrive Drivers Analysis Component
 * 
 * Features:
 * - Analyzes tag impact on MC and DSS scores
 * - Shows only frequently used tags (3+ times)
 * - Sortable table with impact calculations
 * - Filtering by positive/negative impact
 * - Mobile-responsive design
 * - Loading and empty states
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { MoodEntry } from '@/types';
import { 
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Filter,
  ArrowUpDown,
  Loader2,
  Info,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { subWeeks, isAfter } from 'date-fns';

/**
 * Driver analysis result interface
 */
interface DriverAnalysis {
  tag: string;
  usageCount: number;
  mcImpact: number;
  dssImpact: number;
  overallEffect: 'positive' | 'negative' | 'neutral';
  effectMagnitude: number;
  mcWithTag: number;
  mcWithoutTag: number;
  dssWithTag: number;
  dssWithoutTag: number;
}

/**
 * Table sort configuration
 */
interface SortConfig {
  key: keyof DriverAnalysis;
  direction: 'asc' | 'desc';
}

/**
 * Filter configuration
 */
interface FilterConfig {
  impact: 'all' | 'positive' | 'negative' | 'neutral';
}

/**
 * Drivers analysis calculator
 */
class DriversAnalyzer {
  /**
   * Calculate MC (Mood Composite) score for an entry
   */
  static calculateMC(entry: MoodEntry): number {
    const valence = entry.valence;
    const energy = entry.energy;
    const focus = entry.focus;
    const stress = entry.stress;
    
    // Simple MC calculation (can be enhanced with z-scores)
    return (valence + energy + focus + (5 - stress)) / 4;
  }

  /**
   * Calculate DSS (Daily Success Score) for an entry
   */
  static calculateDSS(entry: MoodEntry): number {
    const deepworkMinutes = entry.deepworkMinutes || 0;
    const tasksCompleted = entry.tasksCompleted || 0;
    const sleepHours = entry.sleepHours || 0;
    const recoveryAction = entry.recoveryAction ? 1 : 0;
    const socialTouchpoints = entry.socialTouchpoints || 0;
    
    // Weighted DSS calculation
    const deepworkScore = Math.min(1, deepworkMinutes / 180); // Max 3 hours
    const tasksScore = Math.min(1, tasksCompleted / 10); // Max 10 tasks
    const sleepScore = Math.min(1, sleepHours / 8); // Optimal 8 hours
    const recoveryScore = recoveryAction;
    const socialScore = Math.min(1, socialTouchpoints / 5); // Max 5 touchpoints
    
    return (deepworkScore * 0.3) + (tasksScore * 0.3) + (sleepScore * 0.2) + 
           (recoveryScore * 0.1) + (socialScore * 0.1);
  }

  /**
   * Analyze drivers from mood entries
   */
  static analyzeDrivers(entries: MoodEntry[], minUsageCount: number = 3): DriverAnalysis[] {
    // Filter entries from last 2-4 weeks
    const cutoffDate = subWeeks(new Date(), 4);
    const recentEntries = entries.filter(entry => 
      isAfter(new Date(entry.timestamp), cutoffDate)
    );

    if (recentEntries.length === 0) {
      return [];
    }

    // Collect all unique tags
    const allTags = new Set<string>();
    recentEntries.forEach(entry => {
      entry.tags.forEach(tag => allTags.add(tag.toLowerCase()));
    });

    // Analyze each tag
    const analyses: DriverAnalysis[] = [];

    for (const tag of allTags) {
      const entriesWithTag = recentEntries.filter(entry => 
        entry.tags.some(t => t.toLowerCase() === tag)
      );
      const entriesWithoutTag = recentEntries.filter(entry => 
        !entry.tags.some(t => t.toLowerCase() === tag)
      );

      // Skip if not used enough
      if (entriesWithTag.length < minUsageCount) {
        continue;
      }

      // Calculate average scores
      const mcWithTag = entriesWithTag.length > 0 
        ? entriesWithTag.reduce((sum, entry) => sum + this.calculateMC(entry), 0) / entriesWithTag.length
        : 0;
      
      const mcWithoutTag = entriesWithoutTag.length > 0
        ? entriesWithoutTag.reduce((sum, entry) => sum + this.calculateMC(entry), 0) / entriesWithoutTag.length
        : 0;

      const dssWithTag = entriesWithTag.length > 0
        ? entriesWithTag.reduce((sum, entry) => sum + this.calculateDSS(entry), 0) / entriesWithTag.length
        : 0;

      const dssWithoutTag = entriesWithoutTag.length > 0
        ? entriesWithoutTag.reduce((sum, entry) => sum + this.calculateDSS(entry), 0) / entriesWithoutTag.length
        : 0;

      // Calculate impacts
      const mcImpact = mcWithTag - mcWithoutTag;
      const dssImpact = dssWithTag - dssWithoutTag;

      // Determine overall effect
      const totalImpact = Math.abs(mcImpact) + Math.abs(dssImpact);
      let overallEffect: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      if (totalImpact > 0.1) { // Threshold for meaningful impact
        if (mcImpact > 0 && dssImpact > 0) {
          overallEffect = 'positive';
        } else if (mcImpact < 0 && dssImpact < 0) {
          overallEffect = 'negative';
        } else if (Math.abs(mcImpact) > Math.abs(dssImpact)) {
          overallEffect = mcImpact > 0 ? 'positive' : 'negative';
        } else {
          overallEffect = dssImpact > 0 ? 'positive' : 'negative';
        }
      }

      analyses.push({
        tag: tag.charAt(0).toUpperCase() + tag.slice(1),
        usageCount: entriesWithTag.length,
        mcImpact,
        dssImpact,
        overallEffect,
        effectMagnitude: totalImpact,
        mcWithTag,
        mcWithoutTag,
        dssWithTag,
        dssWithoutTag
      });
    }

    return analyses;
  }
}

/**
 * Loading component
 */
function DriversLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Analyzing your activity drivers...</p>
    </div>
  );
}

/**
 * Empty state component
 */
function DriversEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
      <BarChart3 className="w-12 h-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">No driver data yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start logging daily check-ins with tags to see which activities 
          help or hurt your mood and productivity.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Need at least 3 uses of a tag to analyze its impact</span>
      </div>
    </div>
  );
}

/**
 * Impact indicator component
 */
function ImpactIndicator({ 
  impact
}: { 
  impact: number; 
}) {
  const absImpact = Math.abs(impact);
  const isPositive = impact > 0;
  const isSignificant = absImpact > 0.1;

  if (!isSignificant) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="w-3 h-3" />
        <span className="text-xs">Neutral</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span className="text-xs font-medium">
        {isPositive ? '+' : ''}{(impact * 100).toFixed(0)}%
      </span>
    </div>
  );
}

/**
 * Overall effect indicator
 */
function OverallEffectIndicator({ effect }: { effect: 'positive' | 'negative' | 'neutral' }) {
  switch (effect) {
    case 'positive':
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Positive</span>
        </div>
      );
    case 'negative':
      return (
        <div className="flex items-center gap-1 text-red-600">
          <XCircle className="w-4 h-4" />
          <span className="text-xs font-medium">Negative</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Minus className="w-4 h-4" />
          <span className="text-xs">Neutral</span>
        </div>
      );
  }
}

/**
 * Sort button component
 */
function SortButton({ 
  column, 
  sortConfig, 
  onSort, 
  children 
}: { 
  column: keyof DriverAnalysis;
  sortConfig: SortConfig | null;
  onSort: (key: keyof DriverAnalysis) => void;
  children: React.ReactNode;
}) {
  const isActive = sortConfig?.key === column;
  const direction = isActive ? sortConfig.direction : null;

  return (
    <button
      onClick={() => onSort(column)}
      className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${isActive ? 'opacity-100' : 'opacity-50'}`} />
      {isActive && (
        <span className="text-xs">
          {direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );
}

/**
 * Main DriversTable component
 */
export function DriversTable() {
  const { value: moodEntries } = useMoodEntries();
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: 'effectMagnitude',
    direction: 'desc'
  });
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    impact: 'all'
  });

  // Analyze drivers
  const driverAnalyses = useMemo(() => {
    return DriversAnalyzer.analyzeDrivers(moodEntries, 3);
  }, [moodEntries]);

  // Apply filtering
  const filteredAnalyses = useMemo(() => {
    if (filterConfig.impact === 'all') {
      return driverAnalyses;
    }
    return driverAnalyses.filter(analysis => analysis.overallEffect === filterConfig.impact);
  }, [driverAnalyses, filterConfig.impact]);

  // Apply sorting
  const sortedAnalyses = useMemo(() => {
    if (!sortConfig) return filteredAnalyses;

    return [...filteredAnalyses].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue;
      }

      return 0;
    });
  }, [filteredAnalyses, sortConfig]);

  // Handle sorting
  const handleSort = (key: keyof DriverAnalysis) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key, direction: 'asc' };
    });
  };

  // Handle filtering
  const handleFilter = (impact: FilterConfig['impact']) => {
    setFilterConfig(prev => ({ ...prev, impact }));
  };

  // Simulate loading delay
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, [moodEntries]);

  // Check if we have enough data
  const hasEnoughData = moodEntries.length >= 7; // At least a week of data

  if (isLoading) {
    return <DriversLoading />;
  }

  if (!hasEnoughData) {
    return <DriversEmptyState />;
  }

  if (driverAnalyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">No frequent tags found</h3>
          <p className="text-muted-foreground max-w-sm">
            Use tags consistently in your daily check-ins to see their impact analysis. 
            Tags need to be used at least 3 times to appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Activity Drivers</h2>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover which activities and situations most help or hurt your daily success. 
          Based on your last 2-4 weeks of data.
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filter by impact:</span>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All', count: driverAnalyses.length },
              { key: 'positive', label: 'Positive', count: driverAnalyses.filter(d => d.overallEffect === 'positive').length },
              { key: 'negative', label: 'Negative', count: driverAnalyses.filter(d => d.overallEffect === 'negative').length },
              { key: 'neutral', label: 'Neutral', count: driverAnalyses.filter(d => d.overallEffect === 'neutral').length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => handleFilter(key as FilterConfig['impact'])}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterConfig.impact === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-foreground">
                  <SortButton
                    column="tag"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  >
                    Activity/Tag
                  </SortButton>
                </th>
                <th className="text-center p-4 font-medium text-foreground">
                  <SortButton
                    column="usageCount"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  >
                    Usage
                  </SortButton>
                </th>
                <th className="text-center p-4 font-medium text-foreground">
                  <SortButton
                    column="mcImpact"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  >
                    MC Impact
                  </SortButton>
                </th>
                <th className="text-center p-4 font-medium text-foreground">
                  <SortButton
                    column="dssImpact"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  >
                    DSS Impact
                  </SortButton>
                </th>
                <th className="text-center p-4 font-medium text-foreground">
                  <SortButton
                    column="overallEffect"
                    sortConfig={sortConfig}
                    onSort={handleSort}
                  >
                    Overall Effect
                  </SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedAnalyses.map((analysis, index) => (
                <tr 
                  key={analysis.tag}
                  className={`border-b border-border ${
                    index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                  } hover:bg-muted/40 transition-colors`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{analysis.tag}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-sm text-muted-foreground">
                      {analysis.usageCount} times
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <ImpactIndicator 
                      impact={analysis.mcImpact}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <ImpactIndicator 
                      impact={analysis.dssImpact}
                    />
                  </td>
                  <td className="p-4 text-center">
                    <OverallEffectIndicator effect={analysis.overallEffect} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="card p-6 bg-muted/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">How to Use This Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Understanding the Impact</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• <strong>MC Impact:</strong> How the activity affects your mood composite</li>
              <li>• <strong>DSS Impact:</strong> How the activity affects your daily success score</li>
              <li>• <strong>Usage Count:</strong> How often you&apos;ve used this tag</li>
              <li>• <strong>Overall Effect:</strong> Combined impact across both metrics</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Taking Action</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• <strong>Positive drivers:</strong> Do more of these activities</li>
              <li>• <strong>Negative drivers:</strong> Reduce or modify these activities</li>
              <li>• <strong>Neutral drivers:</strong> These don&apos;t significantly impact your scores</li>
              <li>• <strong>Sort by magnitude:</strong> Focus on the biggest impact drivers first</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
