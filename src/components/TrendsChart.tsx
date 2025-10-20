/**
 * CampusThrive Trends Visualization Component
 * 
 * Features:
 * - Line chart showing MC and DSS trends over 14 days
 * - Dual y-axis with interactive tooltips
 * - Toggle switches for metric visibility
 * - Responsive design with loading/empty states
 * - Clean animations and touch-friendly interactions
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { MoodEntry } from '@/types';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Calendar,
  Loader2,
  Info,
  Activity,
  Target
} from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

/**
 * Data point interface for chart
 */
interface ChartDataPoint {
  date: string;
  dateLabel: string;
  MC: number | null;
  DSS: number | null;
  LM: number | null;
  RI: number | null;
  CN: number | null;
  entries: number;
}

/**
 * Chart configuration interface
 */
interface ChartConfig {
  showMC: boolean;
  showDSS: boolean;
  showLM: boolean;
  showRI: boolean;
  showCN: boolean;
  daysToShow: number;
}

/**
 * Score calculation utilities
 */
class TrendCalculator {
  /**
   * Calculate z-score for a value against historical data
   */
  private static calculateZScore(value: number, data: number[]): number {
    if (data.length === 0) return 0;
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    return stdDev === 0 ? 0 : (value - mean) / stdDev;
  }

  /**
   * Calculate MC (Mood Composite) score
   */
  static calculateMC(entry: MoodEntry, historicalData: MoodEntry[]): number {
    if (historicalData.length < 3) {
      // Simple average if not enough data for z-scores
      return (entry.valence + entry.energy + entry.focus - entry.stress) / 4;
    }

    const valenceData = historicalData.map(e => e.valence);
    const energyData = historicalData.map(e => e.energy);
    const focusData = historicalData.map(e => e.focus);
    const stressData = historicalData.map(e => e.stress);

    const zV = this.calculateZScore(entry.valence, valenceData);
    const zE = this.calculateZScore(entry.energy, energyData);
    const zF = this.calculateZScore(entry.focus, focusData);
    const zS = this.calculateZScore(entry.stress, stressData);

    return 0.4 * zV + 0.3 * zE + 0.2 * zF - 0.2 * zS;
  }

  /**
   * Calculate DSS (Daily Success Score)
   */
  static calculateDSS(entry: MoodEntry, historicalData: MoodEntry[]): number {
    const MC = this.calculateMC(entry, historicalData);
    const tasksCompleted = entry.tasksCompleted || 0;
    const deepworkMinutes = entry.deepworkMinutes || 0;

    // Simple DSS calculation - can be enhanced with more sophisticated algorithms
    return (MC * 0.4) + (tasksCompleted * 0.1) + (deepworkMinutes * 0.01);
  }

  /**
   * Calculate LM (Learning Momentum)
   */
  static calculateLM(entry: MoodEntry): number {
    const focus = entry.focus;
    const deepworkMinutes = entry.deepworkMinutes || 0;
    return (focus * 0.6) + (Math.min(deepworkMinutes / 180, 1) * 0.4);
  }

  /**
   * Calculate RI (Recovery Index)
   */
  static calculateRI(entry: MoodEntry): number {
    const sleepHours = entry.sleepHours || 0;
    const recoveryAction = entry.recoveryAction ? 1 : 0;
    const stress = entry.stress;
    return (sleepHours / 8 * 0.4) + (recoveryAction * 0.3) + ((5 - stress) / 5 * 0.3);
  }

  /**
   * Calculate CN (Connection)
   */
  static calculateCN(entry: MoodEntry): number {
    const valence = entry.valence;
    const socialTouchpoints = entry.socialTouchpoints || 0;
    return (valence * 0.6) + (Math.min(socialTouchpoints / 5, 1) * 0.4);
  }
}

/**
 * Custom tooltip component
 */
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.dataKey}:</span>
            <span className="font-medium text-foreground">
              {entry.value !== null ? entry.value.toFixed(2) : 'N/A'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Loading component
 */
function ChartLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Calculating trends...</p>
    </div>
  );
}

/**
 * Empty state component
 */
function ChartEmptyState({ daysNeeded }: { daysNeeded: number }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
      <BarChart3 className="w-12 h-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Not enough data yet</h3>
        <p className="text-muted-foreground max-w-sm">
          You need at least {daysNeeded} days of data to see meaningful trends. 
          Keep logging your daily check-ins to unlock insights!
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Trends become more accurate with more data</span>
      </div>
    </div>
  );
}

/**
 * Metric toggle component
 */
function MetricToggle({ 
  label, 
  checked, 
  onChange, 
  icon: Icon 
}: { 
  label: string; 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  icon: React.ComponentType<{ className?: string }>; 
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-5 h-5 rounded border-2 transition-colors ${
          checked 
            ? 'border-current bg-current' 
            : 'border-muted-foreground group-hover:border-foreground'
        }`}>
          {checked && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-background" />
            </div>
          )}
        </div>
      </div>
      <Icon className={`w-4 h-4 ${checked ? 'text-current' : 'text-muted-foreground'}`} />
      <span className={`text-sm font-medium transition-colors ${
        checked ? 'text-current' : 'text-muted-foreground group-hover:text-foreground'
      }`}>
        {label}
      </span>
    </label>
  );
}

/**
 * Main TrendsChart component
 */
export function TrendsChart() {
  const { value: moodEntries } = useMoodEntries();
  const [config, setConfig] = useState<ChartConfig>({
    showMC: true,
    showDSS: true,
    showLM: false,
    showRI: false,
    showCN: false,
    daysToShow: 14
  });
  const [isLoading, setIsLoading] = useState(true);

  // Calculate chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    if (moodEntries.length === 0) return [];

    const endDate = new Date();
    
    // Create array of dates
    const dates = [];
    for (let i = 0; i < config.daysToShow; i++) {
      dates.push(subDays(endDate, i));
    }
    dates.reverse();

    return dates.map(date => {
      // Find entries for this date
      const dayEntries = moodEntries.filter(entry => 
        isSameDay(new Date(entry.timestamp), date)
      );

      if (dayEntries.length === 0) {
        return {
          date: format(date, 'yyyy-MM-dd'),
          dateLabel: format(date, 'MMM dd'),
          MC: null,
          DSS: null,
          LM: null,
          RI: null,
          CN: null,
          entries: 0
        };
      }

      // Use the latest entry of the day for calculations
      const latestEntry = dayEntries[dayEntries.length - 1];
      
      if (!latestEntry) {
        return {
          date: format(date, 'yyyy-MM-dd'),
          dateLabel: format(date, 'MMM dd'),
          MC: null,
          DSS: null,
          LM: null,
          RI: null,
          CN: null,
          entries: 0
        };
      }
      
      // Calculate scores using historical data up to this point
      const historicalData = moodEntries.filter(entry => 
        new Date(entry.timestamp) < date
      );

      const MC = TrendCalculator.calculateMC(latestEntry, historicalData);
      const DSS = TrendCalculator.calculateDSS(latestEntry, historicalData);
      const LM = TrendCalculator.calculateLM(latestEntry);
      const RI = TrendCalculator.calculateRI(latestEntry);
      const CN = TrendCalculator.calculateCN(latestEntry);

      return {
        date: format(date, 'yyyy-MM-dd'),
        dateLabel: format(date, 'MMM dd'),
        MC: parseFloat(MC.toFixed(2)),
        DSS: parseFloat(DSS.toFixed(2)),
        LM: parseFloat(LM.toFixed(2)),
        RI: parseFloat(RI.toFixed(2)),
        CN: parseFloat(CN.toFixed(2)),
        entries: dayEntries.length
      };
    });
  }, [moodEntries, config.daysToShow]);

  // Calculate trend statistics
  const trendStats = useMemo(() => {
    const validData = chartData.filter(d => d.MC !== null && d.DSS !== null);
    if (validData.length < 2) return null;

    const mcValues = validData.map(d => d.MC!);
    const dssValues = validData.map(d => d.DSS!);

    const mcTrend = (mcValues[mcValues.length - 1] || 0) - (mcValues[0] || 0);
    const dssTrend = (dssValues[dssValues.length - 1] || 0) - (dssValues[0] || 0);

    return {
      mcTrend: parseFloat(mcTrend.toFixed(2)),
      dssTrend: parseFloat(dssTrend.toFixed(2)),
      mcAvg: parseFloat((mcValues.reduce((a, b) => a + b, 0) / mcValues.length).toFixed(2)),
      dssAvg: parseFloat((dssValues.reduce((a, b) => a + b, 0) / dssValues.length).toFixed(2)),
      dataPoints: validData.length
    };
  }, [chartData]);

  // Simulate loading delay for better UX
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [moodEntries]);

  // Check if we have enough data
  const hasEnoughData = chartData.filter(d => d.MC !== null).length >= 3;
  const minDataDays = 3;

  if (isLoading) {
    return <ChartLoading />;
  }

  if (!hasEnoughData) {
    return <ChartEmptyState daysNeeded={minDataDays} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with trend stats */}
      {trendStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 flex flex-col justify-center min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-muted-foreground">MC Trend</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              {trendStats.mcTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className="text-lg font-bold text-foreground">
                {trendStats.mcTrend >= 0 ? '+' : ''}{trendStats.mcTrend}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Avg: {trendStats.mcAvg}</p>
          </div>

          <div className="card p-4 flex flex-col justify-center min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">DSS Trend</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              {trendStats.dssTrend >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className="text-lg font-bold text-foreground">
                {trendStats.dssTrend >= 0 ? '+' : ''}{trendStats.dssTrend}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Avg: {trendStats.dssAvg}</p>
          </div>

          <div className="card p-4 flex flex-col justify-center min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-muted-foreground">Data Points</span>
            </div>
            <div className="text-lg font-bold text-foreground mb-1">{trendStats.dataPoints}</div>
            <p className="text-xs text-muted-foreground">days tracked</p>
          </div>

          <div className="card p-4 flex flex-col justify-center min-h-[100px]">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Period</span>
            </div>
            <div className="text-lg font-bold text-foreground mb-1">{config.daysToShow}</div>
            <p className="text-xs text-muted-foreground">days shown</p>
          </div>
        </div>
      )}

      {/* Metric toggles */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold text-foreground mb-4">Show Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricToggle
            label="Mood Composite"
            checked={config.showMC}
            onChange={(checked) => setConfig(prev => ({ ...prev, showMC: checked }))}
            icon={Activity}
          />
          <MetricToggle
            label="Daily Success"
            checked={config.showDSS}
            onChange={(checked) => setConfig(prev => ({ ...prev, showDSS: checked }))}
            icon={Target}
          />
          <MetricToggle
            label="Learning Momentum"
            checked={config.showLM}
            onChange={(checked) => setConfig(prev => ({ ...prev, showLM: checked }))}
            icon={TrendingUp}
          />
          <MetricToggle
            label="Recovery Index"
            checked={config.showRI}
            onChange={(checked) => setConfig(prev => ({ ...prev, showRI: checked }))}
            icon={Activity}
          />
          <MetricToggle
            label="Connection"
            checked={config.showCN}
            onChange={(checked) => setConfig(prev => ({ ...prev, showCN: checked }))}
            icon={Target}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="card p-6">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="dateLabel" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference lines for zero */}
              <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" opacity={0.5} />
              
              {/* Lines for each metric */}
              {config.showMC && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="MC"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(221, 83%, 53%)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(221, 83%, 53%)", strokeWidth: 2 }}
                  connectNulls={false}
                />
              )}
              {config.showDSS && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="DSS"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 76%, 36%)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(142, 76%, 36%)", strokeWidth: 2 }}
                  connectNulls={false}
                />
              )}
              {config.showLM && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="LM"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(262, 83%, 58%)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(262, 83%, 58%)", strokeWidth: 2 }}
                  connectNulls={false}
                />
              )}
              {config.showRI && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="RI"
                  stroke="hsl(25, 95%, 53%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(25, 95%, 53%)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(25, 95%, 53%)", strokeWidth: 2 }}
                  connectNulls={false}
                />
              )}
              {config.showCN && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="CN"
                  stroke="hsl(330, 81%, 60%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(330, 81%, 60%)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: "hsl(330, 81%, 60%)", strokeWidth: 2 }}
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Hover over data points to see exact values. 
          Missing data points indicate days without check-ins.
        </p>
      </div>
    </div>
  );
}