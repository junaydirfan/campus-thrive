'use client';

import { useState, useEffect, useMemo } from 'react';
import { Layout, PageContainer, Section } from "@/components/Layout";
import { TrendsChart } from "@/components/TrendsChart";
import { SuccessCompass } from "@/components/SuccessCompass";
import { useMoodEntries } from "@/hooks/useLocalStorage";
import { TestDataGenerator } from "@/lib/storage";
import { 
  BarChart3, 
  Download, 
  RotateCcw, 
  Calendar, 
  TrendingUp,
  Target,
  Activity,
  Loader2,
  Info,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { MoodEntry } from '@/types';

/**
 * Time period options
 */
type TimePeriod = '7d' | '14d' | 'all';

/**
 * Trend insights interface
 */
interface TrendInsights {
  mcTrend: 'up' | 'down' | 'stable';
  dssTrend: 'up' | 'down' | 'stable';
  mcChange: number;
  dssChange: number;
  bestDay: string;
  worstDay: string;
  consistency: 'high' | 'medium' | 'low';
  patterns: string[];
}

/**
 * Comparison metrics interface
 */
interface ComparisonMetrics {
  thisWeek: {
    mc: number;
    dss: number;
    entries: number;
  };
  lastWeek: {
    mc: number;
    dss: number;
    entries: number;
  };
  changes: {
    mc: number;
    dss: number;
    entries: number;
  };
}

/**
 * Time period selector component
 */
function TimePeriodSelector({ 
  selectedPeriod, 
  onPeriodChange 
}: { 
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}) {
  const periods = [
    { key: '7d' as TimePeriod, label: '7 Days', description: 'Last week' },
    { key: '14d' as TimePeriod, label: '14 Days', description: 'Last 2 weeks' },
    { key: 'all' as TimePeriod, label: 'All Time', description: 'Complete history' }
  ];

  return (
    <div className="card p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Time Period</h3>
          <p className="text-sm text-muted-foreground">Select the time range for your analysis</p>
        </div>
        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period.key}
              onClick={() => onPeriodChange(period.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Trend insights component
 */
function TrendInsights({ insights }: { insights: TrendInsights }) {
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />;
      case 'stable': return <Minus className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-yellow-600';
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Key Insights</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend Indicators */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Trend Direction</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mood Composite</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(insights.mcTrend)}
                <span className={`text-sm font-medium ${getTrendColor(insights.mcTrend)}`}>
                  {insights.mcChange > 0 ? '+' : ''}{insights.mcChange.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Daily Success Score</span>
              <div className="flex items-center gap-2">
                {getTrendIcon(insights.dssTrend)}
                <span className={`text-sm font-medium ${getTrendColor(insights.dssTrend)}`}>
                  {insights.dssChange > 0 ? '+' : ''}{insights.dssChange.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pattern Insights */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">Patterns</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Best day: {insights.bestDay}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Challenging day: {insights.worstDay}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Consistency: {insights.consistency}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Bullets */}
      {insights.patterns.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="font-medium text-foreground mb-3">Notable Patterns</h4>
          <ul className="space-y-2">
            {insights.patterns.map((pattern, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Comparison metrics component
 */
function ComparisonMetrics({ metrics }: { metrics: ComparisonMetrics }) {
  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    const color = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground';
    return <span className={color}>{sign}{change.toFixed(1)}</span>;
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Week-over-Week Comparison</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-1">
            {metrics.thisWeek.mc.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground mb-2">This Week MC</div>
          <div className="text-sm">
            {formatChange(metrics.changes.mc)} vs last week
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-1">
            {metrics.thisWeek.dss.toFixed(1)}
          </div>
          <div className="text-sm text-muted-foreground mb-2">This Week DSS</div>
          <div className="text-sm">
            {formatChange(metrics.changes.dss)} vs last week
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground mb-1">
            {metrics.thisWeek.entries}
          </div>
          <div className="text-sm text-muted-foreground mb-2">This Week Entries</div>
          <div className="text-sm">
            {formatChange(metrics.changes.entries)} vs last week
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function TrendsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
      <BarChart3 className="w-12 h-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">No trend data yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start logging daily check-ins to see your wellness trends and patterns over time.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Need at least 3 days of data to generate meaningful trends</span>
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
 * Calculate trend insights
 */
function calculateTrendInsights(entries: MoodEntry[], timePeriod: TimePeriod): TrendInsights {
  if (entries.length < 3) {
    return {
      mcTrend: 'stable',
      dssTrend: 'stable',
      mcChange: 0,
      dssChange: 0,
      bestDay: 'N/A',
      worstDay: 'N/A',
      consistency: 'low',
      patterns: []
    };
  }

  // Filter entries based on time period
  const now = new Date();
  let filteredEntries = entries;
  
  if (timePeriod === '7d') {
    const weekAgo = subDays(now, 7);
    filteredEntries = entries.filter(entry => new Date(entry.timestamp) >= weekAgo);
  } else if (timePeriod === '14d') {
    const twoWeeksAgo = subDays(now, 14);
    filteredEntries = entries.filter(entry => new Date(entry.timestamp) >= twoWeeksAgo);
  }

  if (filteredEntries.length < 3) {
    return {
      mcTrend: 'stable',
      dssTrend: 'stable',
      mcChange: 0,
      dssChange: 0,
      bestDay: 'N/A',
      worstDay: 'N/A',
      consistency: 'low',
      patterns: []
    };
  }

  // Calculate MC and DSS for each entry
  const scores = filteredEntries.map(entry => {
    const mc = (entry.valence + entry.energy + entry.focus + (5 - entry.stress)) / 4;
    const dss = calculateDSS(entry);
    return { mc, dss, date: new Date(entry.timestamp) };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate trends
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstHalfMC = firstHalf.reduce((sum, s) => sum + s.mc, 0) / firstHalf.length;
  const secondHalfMC = secondHalf.reduce((sum, s) => sum + s.mc, 0) / secondHalf.length;
  const mcChange = secondHalfMC - firstHalfMC;
  
  const firstHalfDSS = firstHalf.reduce((sum, s) => sum + s.dss, 0) / firstHalf.length;
  const secondHalfDSS = secondHalf.reduce((sum, s) => sum + s.dss, 0) / secondHalf.length;
  const dssChange = secondHalfDSS - firstHalfDSS;

  // Find best and worst days
  const bestDay = scores.reduce((best, current) => current.mc > best.mc ? current : best);
  const worstDay = scores.reduce((worst, current) => current.mc < worst.mc ? current : worst);

  // Calculate consistency
  const mcVariance = scores.reduce((sum, s) => sum + Math.pow(s.mc - (scores.reduce((acc, sc) => acc + sc.mc, 0) / scores.length), 2), 0) / scores.length;
  const consistency = mcVariance < 0.5 ? 'high' : mcVariance < 1.0 ? 'medium' : 'low';

  // Generate patterns
  const patterns: string[] = [];
  
  if (Math.abs(mcChange) > 0.5) {
    patterns.push(`Mood ${mcChange > 0 ? 'improved' : 'declined'} by ${Math.abs(mcChange).toFixed(1)} points over time`);
  }
  
  if (Math.abs(dssChange) > 0.1) {
    patterns.push(`Productivity ${dssChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(dssChange).toFixed(1)} points`);
  }
  
  if (consistency === 'high') {
    patterns.push('Very consistent mood patterns - great stability!');
  } else if (consistency === 'low') {
    patterns.push('High mood variability - consider tracking triggers');
  }

  return {
    mcTrend: mcChange > 0.2 ? 'up' : mcChange < -0.2 ? 'down' : 'stable',
    dssTrend: dssChange > 0.05 ? 'up' : dssChange < -0.05 ? 'down' : 'stable',
    mcChange,
    dssChange,
    bestDay: format(bestDay.date, 'MMM dd'),
    worstDay: format(worstDay.date, 'MMM dd'),
    consistency,
    patterns
  };
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
 * Calculate comparison metrics
 */
function calculateComparisonMetrics(entries: MoodEntry[]): ComparisonMetrics {
  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });

  const thisWeekEntries = entries.filter(entry => 
    isWithinInterval(new Date(entry.timestamp), { start: thisWeekStart, end: thisWeekEnd })
  );
  
  const lastWeekEntries = entries.filter(entry => 
    isWithinInterval(new Date(entry.timestamp), { start: lastWeekStart, end: lastWeekEnd })
  );

  const calculateWeekMetrics = (weekEntries: MoodEntry[]) => {
    if (weekEntries.length === 0) return { mc: 0, dss: 0, entries: 0 };
    
    const mc = weekEntries.reduce((sum, entry) => 
      sum + (entry.valence + entry.energy + entry.focus + (5 - entry.stress)) / 4, 0
    ) / weekEntries.length;
    
    const dss = weekEntries.reduce((sum, entry) => sum + calculateDSS(entry), 0) / weekEntries.length;
    
    return { mc, dss, entries: weekEntries.length };
  };

  const thisWeek = calculateWeekMetrics(thisWeekEntries);
  const lastWeek = calculateWeekMetrics(lastWeekEntries);

  return {
    thisWeek,
    lastWeek,
    changes: {
      mc: thisWeek.mc - lastWeek.mc,
      dss: thisWeek.dss - lastWeek.dss,
      entries: thisWeek.entries - lastWeek.entries
    }
  };
}

/**
 * Main TrendsPage component
 */
export default function TrendsPage() {
  const { value: moodEntries, setValue: setMoodEntries } = useMoodEntries();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('14d');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate insights and metrics
  const insights = useMemo(() => 
    calculateTrendInsights(moodEntries, selectedPeriod), 
    [moodEntries, selectedPeriod]
  );

  const comparisonMetrics = useMemo(() => 
    calculateComparisonMetrics(moodEntries), 
    [moodEntries]
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
  }, [moodEntries, selectedPeriod]);

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
          title="Wellness Trends"
          description="Visualize your mood and productivity patterns over time. Track your progress and identify trends in your wellness journey."
        >
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Wellness Trends</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover patterns in your wellness data and track your progress over time. 
              All analysis happens locally on your device.
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

        {/* Time Period Selector */}
        <TimePeriodSelector
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />

        {/* Empty State */}
        {!hasEnoughData ? (
          <TrendsEmptyState />
        ) : (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Trends Chart */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Trends Over Time</h3>
                <TrendsChart />
              </div>

              {/* Success Compass */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Wellness Balance</h3>
                <SuccessCompass />
              </div>
            </div>

            {/* Insights and Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendInsights insights={insights} />
              <ComparisonMetrics metrics={comparisonMetrics} />
            </div>
          </>
        )}

        {/* Export Section */}
        {hasEnoughData && (
          <Section title="Export Your Data" description="Download your trend analysis">
            <div className="card p-6 text-center">
              <Download className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Export Trend Data</h3>
              <p className="text-muted-foreground mb-4">
                Download your wellness data in CSV or JSON format for further analysis.
              </p>
              <a href="/export" className="btn btn-primary btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium">
                <Download className="w-5 h-5" />
                Go to Export Page
              </a>
            </div>
          </Section>
        )}
      </PageContainer>
    </Layout>
  );
}
