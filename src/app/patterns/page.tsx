'use client';

import { useState, useEffect, useMemo } from 'react';
import { Layout, PageContainer, Section } from "@/components/Layout";
import { DriversTable } from "@/components/DriversTable";
import { PowerHours } from "@/components/PowerHours";
import { useMoodEntries } from "@/hooks/useLocalStorage";
import { TestDataGenerator } from "@/lib/storage";
import { 
  Grid3X3, 
  Brain, 
  Zap, 
  Heart, 
  Users,
  Filter,
  Calendar,
  Target,
  Activity,
  Loader2,
  Share2,
  Download,
  RotateCcw,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";
import { format, subDays } from 'date-fns';
import { MoodEntry } from '@/types';

/**
 * Date range filter options
 */
type DateRange = '7d' | '14d' | '30d' | 'all';

/**
 * Tag category options
 */
type TagCategory = 'all' | 'academic' | 'social' | 'health' | 'lifestyle' | 'work';

/**
 * Pattern insight interface
 */
interface PatternInsight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
  impact: number;
  confidence: 'high' | 'medium' | 'low';
  recommendation?: string;
}

/**
 * Day comparison interface
 */
interface DayComparison {
  bestDay: {
    date: string;
    mc: number;
    dss: number;
    tags: string[];
    activities: string[];
  };
  worstDay: {
    date: string;
    mc: number;
    dss: number;
    tags: string[];
    activities: string[];
  };
  difference: {
    mc: number;
    dss: number;
  };
}

/**
 * Tag usage analysis interface
 */
interface TagUsageAnalysis {
  tag: string;
  count: number;
  avgMC: number;
  avgDSS: number;
  category: TagCategory;
  trend: 'up' | 'down' | 'stable';
  impact: number;
}

/**
 * Filter controls component
 */
function FilterControls({ 
  dateRange, 
  onDateRangeChange,
  tagCategory,
  onTagCategoryChange,
  showDrivers,
  onShowDriversChange,
  showPowerHours,
  onShowPowerHoursChange
}: {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  tagCategory: TagCategory;
  onTagCategoryChange: (category: TagCategory) => void;
  showDrivers: boolean;
  onShowDriversChange: (show: boolean) => void;
  showPowerHours: boolean;
  onShowPowerHoursChange: (show: boolean) => void;
}) {
  const dateRanges = [
    { key: '7d' as DateRange, label: '7 Days', description: 'Last week' },
    { key: '14d' as DateRange, label: '14 Days', description: 'Last 2 weeks' },
    { key: '30d' as DateRange, label: '30 Days', description: 'Last month' },
    { key: 'all' as DateRange, label: 'All Time', description: 'Complete history' }
  ];

  const tagCategories = [
    { key: 'all' as TagCategory, label: 'All Tags', icon: Grid3X3 },
    { key: 'academic' as TagCategory, label: 'Academic', icon: Brain },
    { key: 'social' as TagCategory, label: 'Social', icon: Users },
    { key: 'health' as TagCategory, label: 'Health', icon: Heart },
    { key: 'lifestyle' as TagCategory, label: 'Lifestyle', icon: Activity },
    { key: 'work' as TagCategory, label: 'Work', icon: Target }
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Filter & View Options</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Date Range Filter */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Date Range</h4>
          <div className="flex flex-wrap gap-2">
            {dateRanges.map((range) => (
              <button
                key={range.key}
                onClick={() => onDateRangeChange(range.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === range.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Category Filter */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Tag Category</h4>
          <div className="flex flex-wrap gap-2">
            {tagCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.key}
                  onClick={() => onTagCategoryChange(category.key)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    tagCategory === category.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Toggles */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Show Sections</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDrivers}
                onChange={(e) => onShowDriversChange(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">Activity Drivers</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPowerHours}
                onChange={(e) => onShowPowerHoursChange(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-muted-foreground">Power Hours</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Tag usage frequency analysis component
 */
function TagUsageAnalysis({ 
  tagUsage, 
  isLoading 
}: { 
  tagUsage: TagUsageAnalysis[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (tagUsage.length === 0) {
    return (
      <div className="card p-6 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No tag data yet</h3>
        <p className="text-muted-foreground">
          Start adding tags to your entries to see usage analysis.
        </p>
      </div>
    );
  }

  const topTags = tagUsage.slice(0, 10);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Tag Usage Analysis</h3>
      </div>
      
      <div className="space-y-4">
        {topTags.map((tag, index) => {
          return (
            <div key={tag.tag} className="flex items-center p-3 bg-background-alt rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-foreground">{tag.tag}</div>
                  <div className="text-sm text-muted-foreground">
                    Used {tag.count} times • {tag.category}
                  </div>
                </div>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Best vs worst day comparison component
 */
function DayComparison({ 
  comparison, 
  isLoading 
}: { 
  comparison: DayComparison | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className="card p-6 text-center">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No comparison data</h3>
        <p className="text-muted-foreground">
          Need more entries to compare best and worst days.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Best vs Worst Day Comparison</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Day */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-foreground">Best Day</h4>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-lg font-bold text-green-600 mb-2">
              {format(new Date(comparison.bestDay.date), 'MMM dd, yyyy')}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm text-muted-foreground">Mood Composite</div>
                <div className="text-xl font-bold text-foreground">{comparison.bestDay.mc.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Daily Success Score</div>
                <div className="text-xl font-bold text-foreground">{comparison.bestDay.dss.toFixed(1)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Key Activities:</div>
              <div className="flex flex-wrap gap-1">
                {comparison.bestDay.tags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Worst Day */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-medium text-foreground">Challenging Day</h4>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-lg font-bold text-red-600 mb-2">
              {format(new Date(comparison.worstDay.date), 'MMM dd, yyyy')}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm text-muted-foreground">Mood Composite</div>
                <div className="text-xl font-bold text-foreground">{comparison.worstDay.mc.toFixed(1)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Daily Success Score</div>
                <div className="text-xl font-bold text-foreground">{comparison.worstDay.dss.toFixed(1)}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-foreground">Key Activities:</div>
              <div className="flex flex-wrap gap-1">
                {comparison.worstDay.tags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Difference Analysis */}
      <div className="mt-6 pt-4 border-t border-border">
        <h4 className="font-medium text-foreground mb-3">Key Differences</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">MC Difference</div>
            <div className="text-lg font-bold text-foreground">
              +{comparison.difference.mc.toFixed(1)}
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground">DSS Difference</div>
            <div className="text-lg font-bold text-foreground">
              +{comparison.difference.dss.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pattern insights and recommendations component
 */
function PatternInsights({ 
  insights, 
  isLoading 
}: { 
  insights: PatternInsight[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No insights yet</h3>
        <p className="text-muted-foreground">
          Keep logging entries to generate personalized insights.
        </p>
      </div>
    );
  }

  const getInsightIcon = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'negative': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'neutral': return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Pattern Insights & Recommendations</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="p-4 bg-background-alt rounded-lg">
            <div className="flex items-start gap-3">
              {getInsightIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                  <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                    {insight.confidence} confidence
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                {insight.recommendation && (
                  <div className="p-2 bg-primary/10 rounded text-sm text-primary">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Share insights functionality component
 */
function ShareInsights({ 
  insights
}: { 
  insights: PatternInsight[];
}) {
  const handleShare = async () => {
    const shareData = {
      title: 'My CampusThrive Pattern Insights',
      text: `I've discovered some interesting patterns in my wellness data!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const text = `My CampusThrive Pattern Insights:\n\n${insights.map(i => `• ${i.title}: ${i.description}`).join('\n')}`;
      await navigator.clipboard.writeText(text);
      alert('Insights copied to clipboard!');
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Share Your Insights</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share your pattern insights with friends or save them for reference.
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={handleShare}
            className="btn btn-primary btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium"
          >
            <Share2 className="w-5 h-5" />
            Share Insights
          </button>
          
          <button
            onClick={() => window.print()}
            className="btn btn-outline btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium"
          >
            <Download className="w-5 h-5" />
            Print Summary
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Data management component
 */
function DataManagement({ 
  totalEntries, 
  uniqueDays, 
  onGenerateData, 
  onClearData, 
  isGenerating 
}: {
  totalEntries: number;
  uniqueDays: number;
  onGenerateData: () => void;
  onClearData: () => void;
  isGenerating: boolean;
}) {
  return (
    <div className="card p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Data Management</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{uniqueDays} days tracked</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span>{totalEntries} total entries</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onGenerateData}
            disabled={isGenerating}
            className="btn btn-primary btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate Test Data
              </>
            )}
          </button>
          
          <button
            onClick={onClearData}
            className="btn btn-outline btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium"
          >
            <RotateCcw className="w-5 h-5" />
            Clear Data
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate tag usage analysis
 */
function calculateTagUsageAnalysis(entries: MoodEntry[], dateRange: DateRange, tagCategory: TagCategory): TagUsageAnalysis[] {
  const now = new Date();
  let filteredEntries = entries;
  
  if (dateRange !== 'all') {
    const days = dateRange === '7d' ? 7 : dateRange === '14d' ? 14 : 30;
    const cutoffDate = subDays(now, days);
    filteredEntries = entries.filter(entry => new Date(entry.timestamp) >= cutoffDate);
  }

  const tagMap = new Map<string, { count: number; mcSum: number; dssSum: number; entries: MoodEntry[] }>();
  
  filteredEntries.forEach(entry => {
    const mc = (entry.valence + entry.energy + entry.focus + (5 - entry.stress)) / 4;
    const dss = calculateDSS(entry);
    
    entry.tags?.forEach(tag => {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, { count: 0, mcSum: 0, dssSum: 0, entries: [] });
      }
      const tagData = tagMap.get(tag)!;
      tagData.count++;
      tagData.mcSum += mc;
      tagData.dssSum += dss;
      tagData.entries.push(entry);
    });
  });

  const tagUsage: TagUsageAnalysis[] = Array.from(tagMap.entries())
    .map(([tag, data]) => {
      const avgMC = data.mcSum / data.count;
      const avgDSS = data.dssSum / data.count;
      
      // Calculate trend (simplified)
      const recentEntries = data.entries.slice(-3);
      const olderEntries = data.entries.slice(0, -3);
      const recentAvg = recentEntries.reduce((sum, e) => sum + ((e.valence + e.energy + e.focus + (5 - e.stress)) / 4), 0) / recentEntries.length;
      const olderAvg = olderEntries.reduce((sum, e) => sum + ((e.valence + e.energy + e.focus + (5 - e.stress)) / 4), 0) / olderEntries.length;
      const trend: 'up' | 'down' | 'stable' = recentAvg > olderAvg + 0.2 ? 'up' : recentAvg < olderAvg - 0.2 ? 'down' : 'stable';
      
      // Calculate impact (simplified)
      const impact = avgMC - 3.0; // Baseline of 3.0
      
      return {
        tag,
        count: data.count,
        avgMC,
        avgDSS,
        category: categorizeTag(tag),
        trend,
        impact
      };
    })
    .filter(tag => tagCategory === 'all' || tag.category === tagCategory)
    .sort((a, b) => b.count - a.count);

  return tagUsage;
}

/**
 * Categorize tags
 */
function categorizeTag(tag: string): TagCategory {
  const academicTags = ['study', 'exam', 'homework', 'class', 'lecture', 'assignment', 'project'];
  const socialTags = ['social', 'friends', 'party', 'date', 'family', 'meeting'];
  const healthTags = ['gym', 'exercise', 'workout', 'run', 'yoga', 'sleep', 'meditation'];
  const lifestyleTags = ['coffee', 'caffeine', 'alcohol', 'shopping', 'travel', 'hobby'];
  const workTags = ['work', 'job', 'interview', 'meeting', 'deadline', 'presentation'];
  
  const lowerTag = tag.toLowerCase();
  
  if (academicTags.some(t => lowerTag.includes(t))) return 'academic';
  if (socialTags.some(t => lowerTag.includes(t))) return 'social';
  if (healthTags.some(t => lowerTag.includes(t))) return 'health';
  if (lifestyleTags.some(t => lowerTag.includes(t))) return 'lifestyle';
  if (workTags.some(t => lowerTag.includes(t))) return 'work';
  
  return 'lifestyle';
}

/**
 * Calculate DSS score
 */
function calculateDSS(entry: MoodEntry): number {
  const deepworkMinutes = entry.deepworkMinutes || 0;
  const tasksCompleted = entry.tasksCompleted || 0;
  const sleepHours = entry.sleepHours || 0;
  const recoveryAction = entry.recoveryAction ? 1 : 0;
  const socialTouchpoints = entry.socialTouchpoints || 0;
  
  const deepworkScore = Math.min(1, deepworkMinutes / 180);
  const tasksScore = Math.min(1, tasksCompleted / 10);
  const sleepScore = Math.min(1, sleepHours / 8);
  const recoveryScore = recoveryAction;
  const socialScore = Math.min(1, socialTouchpoints / 5);
  
  return (deepworkScore * 0.3) + (tasksScore * 0.3) + (sleepScore * 0.2) + 
         (recoveryScore * 0.1) + (socialScore * 0.1);
}

/**
 * Calculate day comparison
 */
function calculateDayComparison(entries: MoodEntry[]): DayComparison | null {
  if (entries.length < 2) return null;

  const entriesWithScores = entries.map(entry => {
    const mc = (entry.valence + entry.energy + entry.focus + (5 - entry.stress)) / 4;
    const dss = calculateDSS(entry);
    return { ...entry, mc, dss };
  });

  const bestDay = entriesWithScores.reduce((best, current) => 
    current.mc > best.mc ? current : best
  );
  
  const worstDay = entriesWithScores.reduce((worst, current) => 
    current.mc < worst.mc ? current : worst
  );

  return {
    bestDay: {
      date: String(bestDay.timestamp),
      mc: bestDay.mc,
      dss: bestDay.dss,
      tags: bestDay.tags || [],
      activities: bestDay.tags || []
    },
    worstDay: {
      date: String(worstDay.timestamp),
      mc: worstDay.mc,
      dss: worstDay.dss,
      tags: worstDay.tags || [],
      activities: worstDay.tags || []
    },
    difference: {
      mc: bestDay.mc - worstDay.mc,
      dss: bestDay.dss - worstDay.dss
    }
  };
}

/**
 * Generate pattern insights
 */
function generatePatternInsights(entries: MoodEntry[], tagUsage: TagUsageAnalysis[]): PatternInsight[] {
  const insights: PatternInsight[] = [];
  
  if (entries.length < 5) return insights;

  // Find top positive and negative tags
  const positiveTags = tagUsage.filter(tag => tag.impact > 0.5).slice(0, 3);
  const negativeTags = tagUsage.filter(tag => tag.impact < -0.5).slice(0, 3);
  
  // Generate insights based on tag analysis
  if (positiveTags.length > 0) {
    insights.push({
      type: 'positive',
      title: 'High-Impact Activities',
      description: `Activities like ${positiveTags.map(t => t.tag).join(', ')} consistently boost your mood and productivity.`,
      impact: positiveTags.reduce((sum, tag) => sum + tag.impact, 0) / positiveTags.length,
      confidence: 'high',
      recommendation: `Try to incorporate more ${positiveTags[0]?.tag || 'these'} activities into your routine.`
    });
  }
  
  if (negativeTags.length > 0) {
    insights.push({
      type: 'negative',
      title: 'Challenging Patterns',
      description: `Activities like ${negativeTags.map(t => t.tag).join(', ')} tend to lower your mood scores.`,
      impact: negativeTags.reduce((sum, tag) => sum + tag.impact, 0) / negativeTags.length,
      confidence: 'medium',
      recommendation: `Consider reducing or managing ${negativeTags[0]?.tag || 'these'} activities better.`
    });
  }
  
  // Consistency insight
  const mcValues = entries.map(e => (e.valence + e.energy + e.focus + (5 - e.stress)) / 4);
  const mcVariance = mcValues.reduce((sum, mc) => sum + Math.pow(mc - (mcValues.reduce((a, b) => a + b, 0) / mcValues.length), 2), 0) / mcValues.length;
  
  if (mcVariance < 0.5) {
    insights.push({
      type: 'positive',
      title: 'Consistent Mood Patterns',
      description: 'Your mood shows high consistency, indicating good emotional stability.',
      impact: 0.5,
      confidence: 'high',
      recommendation: 'Maintain your current routine as it seems to work well for you.'
    });
  } else if (mcVariance > 1.5) {
    insights.push({
      type: 'neutral',
      title: 'Variable Mood Patterns',
      description: 'Your mood shows high variability. This could indicate sensitivity to external factors.',
      impact: 0,
      confidence: 'medium',
      recommendation: 'Consider tracking triggers more closely to identify patterns.'
    });
  }
  
  return insights;
}

/**
 * Main PatternsPage component
 */
export default function PatternsPage() {
  const { value: moodEntries, setValue: setMoodEntries } = useMoodEntries();
  const [dateRange, setDateRange] = useState<DateRange>('14d');
  const [tagCategory, setTagCategory] = useState<TagCategory>('all');
  const [showDrivers, setShowDrivers] = useState(true);
  const [showPowerHours, setShowPowerHours] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate analyses
  const tagUsage = useMemo(() => 
    calculateTagUsageAnalysis(moodEntries, dateRange, tagCategory),
    [moodEntries, dateRange, tagCategory]
  );

  const dayComparison = useMemo(() => 
    calculateDayComparison(moodEntries),
    [moodEntries]
  );

  const patternInsights = useMemo(() => 
    generatePatternInsights(moodEntries, tagUsage),
    [moodEntries, tagUsage]
  );

  // Handle data generation
  const handleGenerateTestData = async () => {
    setIsGenerating(true);
    try {
      const testData = TestDataGenerator.generateHistoricalMoodEntries(14);
      setMoodEntries(testData);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error generating test data:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearData = () => {
    setMoodEntries([]);
  };

  // Simulate loading delay
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [moodEntries, dateRange, tagCategory]);

  const totalEntries = moodEntries.length;
  const uniqueDays = new Set(moodEntries.map(entry => 
    new Date(entry.timestamp).toDateString()
  )).size;

  const hasEnoughData = totalEntries >= 3;

  if (isLoading) {
    return (
      <Layout>
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        {/* Header */}
        <Section 
          title="Pattern Recognition"
          description="Discover insights and correlations in your wellness data. See how different activities, times of day, and habits affect your mood and productivity."
        >
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Grid3X3 className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Pattern Recognition</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uncover hidden patterns in your wellness data. Discover which activities boost your energy,
              identify your peak performance hours, and get personalized insights.
            </p>
          </div>
        </Section>

        {/* Data Management */}
        <DataManagement
          totalEntries={totalEntries}
          uniqueDays={uniqueDays}
          onGenerateData={handleGenerateTestData}
          onClearData={handleClearData}
          isGenerating={isGenerating}
        />

        {/* Filter Controls */}
        <FilterControls
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          tagCategory={tagCategory}
          onTagCategoryChange={setTagCategory}
          showDrivers={showDrivers}
          onShowDriversChange={setShowDrivers}
          showPowerHours={showPowerHours}
          onShowPowerHoursChange={setShowPowerHours}
        />

        {/* Empty State */}
        {!hasEnoughData ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
            <Grid3X3 className="w-12 h-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">No pattern data yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Start logging daily check-ins with tags to discover patterns in your wellness data.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="w-4 h-4" />
              <span>Need at least 3 days of data to generate meaningful patterns</span>
            </div>
          </div>
        ) : (
          <>
            {/* Main Analysis Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Tag Usage Analysis */}
              <TagUsageAnalysis tagUsage={tagUsage} isLoading={isLoading} />
              
              {/* Day Comparison */}
              <DayComparison comparison={dayComparison} isLoading={isLoading} />
            </div>

            {/* Drivers Analysis */}
            {showDrivers && (
              <Section title="Activity Drivers" description="Discover which activities help or hurt your daily success">
                <DriversTable />
              </Section>
            )}

            {/* Power Hours */}
            {showPowerHours && (
              <Section title="Power Hours" description="Discover your optimal performance hours throughout the week">
                <PowerHours />
              </Section>
            )}

            {/* Pattern Insights */}
            <PatternInsights insights={patternInsights} isLoading={isLoading} />

            {/* Share Insights */}
            <ShareInsights 
              insights={patternInsights}
            />
          </>
        )}

        {/* Feature highlights */}
        <Section title="Understanding Patterns" description="Learn how to interpret your pattern analysis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Activity Correlations</h3>
              </div>
              <p className="text-muted-foreground">
                See which activities boost or drain your energy. Track how different tags
                correlate with your mood and productivity scores.
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Energy Patterns</h3>
              </div>
              <p className="text-muted-foreground">
                Identify when you have the most energy and focus throughout the day.
                Schedule your most important tasks during these peak hours.
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Stress Triggers</h3>
              </div>
              <p className="text-muted-foreground">
                Identify patterns that lead to increased stress levels. Learn to recognize
                early warning signs and implement preventive strategies.
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Social Impact</h3>
              </div>
              <p className="text-muted-foreground">
                Track how social activities and interactions influence your emotional state
                and overall wellness scores.
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Best Practices</h3>
              </div>
              <p className="text-muted-foreground">
                Discover which activities and conditions lead to your best days.
                Replicate successful patterns for consistent improvement.
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Lifestyle Optimization</h3>
              </div>
              <p className="text-muted-foreground">
                Optimize your daily routine based on data-driven insights.
                Make informed decisions about your lifestyle choices.
              </p>
            </div>
          </div>
        </Section>
      </PageContainer>
    </Layout>
  );
}
