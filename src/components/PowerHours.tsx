/**
 * CampusThrive Power Hours Heatmap Component
 * 
 * Features:
 * - 7x24 grid showing MC values by day/hour
 * - Color intensity based on average MC values
 * - Interactive hover tooltips
 * - Responsive design for mobile
 * - Theme-aware color palettes
 * - Loading and empty states
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { MoodEntry } from '@/types';
import { 
  Clock,
  Loader2,
  Info,
  BarChart3,
  Zap,
  Moon
} from 'lucide-react';
import { getDay, getHours } from 'date-fns';

/**
 * Heatmap data point interface
 */
interface HeatmapDataPoint {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  mcValue: number; // Average MC for this time slot
  sampleSize: number; // Number of entries for this time slot
  dayName: string;
  hourLabel: string;
}

/**
 * Color scale configuration
 */
interface ColorScale {
  min: number;
  max: number;
  steps: number;
  lightColors: string[];
  darkColors: string[];
}

/**
 * Power Hours calculator
 */
class PowerHoursCalculator {
  /**
   * Calculate MC (Mood Composite) score for an entry
   */
  static calculateMC(entry: MoodEntry): number {
    const valence = entry.valence;
    const energy = entry.energy;
    const focus = entry.focus;
    const stress = entry.stress;
    
    // Enhanced MC calculation with productivity weighting
    const baseMC = (valence + energy + focus + (5 - stress)) / 4;
    
    // Add productivity boost based on deep work and tasks
    const productivityBoost = Math.min(0.5, 
      (entry.deepworkMinutes || 0) * 0.001 + 
      (entry.tasksCompleted || 0) * 0.05
    );
    
    return Math.min(5, baseMC + productivityBoost);
  }

  /**
   * Generate heatmap data from mood entries
   */
  static generateHeatmapData(entries: MoodEntry[]): HeatmapDataPoint[] {
    const data: HeatmapDataPoint[] = [];
    
    // Initialize 7x24 grid
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        data.push({
          day,
          hour,
          mcValue: 0,
          sampleSize: 0,
          dayName: PowerHoursCalculator.getDayName(day),
          hourLabel: PowerHoursCalculator.getHourLabel(hour)
        });
      }
    }

    // Group entries by day and hour
    const groupedEntries: { [key: string]: MoodEntry[] } = {};
    
    console.log('PowerHours: Processing entries', { totalEntries: entries.length });
    
    entries.forEach((entry, index) => {
      const entryDate = new Date(entry.timestamp);
      const day = getDay(entryDate);
      const hour = getHours(entryDate);
      const key = `${day}-${hour}`;
      
      if (index < 5) { // Log first 5 entries for debugging
        console.log('PowerHours: Entry', {
          index,
          timestamp: entry.timestamp,
          entryDate: entryDate.toISOString(),
          day,
          hour,
          key,
          mcValue: PowerHoursCalculator.calculateMC(entry)
        });
      }
      
      if (!groupedEntries[key]) {
        groupedEntries[key] = [];
      }
      groupedEntries[key].push(entry);
    });
    
    console.log('PowerHours: Grouped entries', {
      totalGroups: Object.keys(groupedEntries).length,
      groupKeys: Object.keys(groupedEntries).slice(0, 10)
    });

    // Calculate averages for each time slot
    Object.entries(groupedEntries).forEach(([key, entries]) => {
      const [dayStr, hourStr] = key.split('-');
      const day = parseInt(dayStr || '0');
      const hour = parseInt(hourStr || '0');
      
      const mcValues = entries.map(entry => PowerHoursCalculator.calculateMC(entry));
      const averageMC = mcValues.reduce((sum, mc) => sum + mc, 0) / mcValues.length;
      
      const dataPoint = data.find(d => d.day === day && d.hour === hour);
      if (dataPoint) {
        dataPoint.mcValue = averageMC;
        dataPoint.sampleSize = entries.length;
      }
    });

    return data;
  }

  static getDayName(day: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[day] || 'Unknown';
  }

  static getHourLabel(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  static calculateColorScale(data: HeatmapDataPoint[]): ColorScale {
    const mcValues = data
      .filter(d => d.sampleSize > 0)
      .map(d => d.mcValue);
    
    console.log('PowerHours: Calculating color scale', {
      totalDataPoints: data.length,
      dataPointsWithSamples: mcValues.length,
      mcValues: mcValues.slice(0, 10)
    });
    
    if (mcValues.length === 0) {
      return {
        min: 0,
        max: 5,
        steps: 5,
        lightColors: ['#f3f4f6', '#e5e7eb', '#d1d5db', '#9ca3af', '#6b7280'],
        darkColors: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af']
      };
    }

    const min = Math.min(...mcValues);
    const max = Math.max(...mcValues);
    const steps = 5;

    const lightColors = [
      '#f0f9ff', // Very light blue
      '#bae6fd', // Light blue
      '#7dd3fc', // Medium light blue
      '#38bdf8', // Blue
      '#0ea5e9'  // Dark blue
    ];

    const darkColors = [
      '#022c22', // Very dark green
      '#064e3b', // Dark green
      '#065f46', // Medium dark green
      '#047857', // Medium green
      '#10b981'  // Bright green
    ];

    return {
      min,
      max,
      steps,
      lightColors,
      darkColors
    };
  }


  static getColorForValue(
    value: number, 
    colorScale: ColorScale, 
    isDark: boolean
  ): string {
    if (value === 0) {
      return isDark ? '#1f2937' : '#f9fafb'; // Empty cell color
    }

    const normalizedValue = (value - colorScale.min) / (colorScale.max - colorScale.min);
    const stepIndex = Math.min(
      Math.floor(normalizedValue * colorScale.steps),
      colorScale.steps - 1
    );

    const colors = isDark ? colorScale.darkColors : colorScale.lightColors;
    return colors[stepIndex] || colors[0] || '#000000';
  }
}

/**
 * Loading component
 */
function PowerHoursLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Analyzing your power hours...</p>
    </div>
  );
}

/**
 * Empty state component
 */
function PowerHoursEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
      <Clock className="w-12 h-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">No power hours data yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Start logging daily check-ins throughout different times of day 
          to discover your optimal performance hours.
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info className="w-4 h-4" />
        <span>Need entries across different times to build the heatmap</span>
      </div>
    </div>
  );
}

/**
 * Color legend component
 */
function ColorLegend({ colorScale, isDark }: { colorScale: ColorScale; isDark: boolean }) {
  const colors = isDark ? colorScale.darkColors : colorScale.lightColors;
  const stepSize = (colorScale.max - colorScale.min) / colorScale.steps;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Low</span>
      <div className="flex gap-1">
        {colors.map((color, index) => (
          <div
            key={index}
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: color }}
            title={`${(colorScale.min + stepSize * index).toFixed(1)} - ${(colorScale.min + stepSize * (index + 1)).toFixed(1)}`}
          />
        ))}
      </div>
      <span className="text-muted-foreground">High</span>
    </div>
  );
}

/**
 * Heatmap cell component
 */
function HeatmapCell({ 
  dataPoint, 
  colorScale, 
  isDark, 
  onHover 
}: { 
  dataPoint: HeatmapDataPoint;
  colorScale: ColorScale;
  isDark: boolean;
  onHover: (dataPoint: HeatmapDataPoint | null, event?: React.MouseEvent) => void;
}) {
  const color = PowerHoursCalculator.getColorForValue(
    dataPoint.mcValue, 
    colorScale, 
    isDark
  );

  const isEmpty = dataPoint.sampleSize === 0;

  return (
    <div
      className={`
        w-8 h-8 rounded border border-border cursor-pointer transition-all duration-200
        ${isEmpty ? 'opacity-50' : 'hover:scale-110 hover:z-10'}
        ${dataPoint.mcValue > 0 ? 'hover:shadow-lg' : ''}
      `}
      style={{ backgroundColor: color }}
      onMouseEnter={(e) => onHover(dataPoint, e)}
      onMouseLeave={() => onHover(null)}
      title={isEmpty ? 'No data' : `${dataPoint.dayName} ${dataPoint.hourLabel}: ${dataPoint.mcValue.toFixed(2)} MC (${dataPoint.sampleSize} entries)`}
    />
  );
}

/**
 * Tooltip component
 */
function HeatmapTooltip({ 
  dataPoint, 
  mousePosition 
}: { 
  dataPoint: HeatmapDataPoint | null;
  mousePosition: { x: number; y: number } | null;
}) {
  if (!dataPoint || dataPoint.sampleSize === 0 || !mousePosition) {
    return null;
  }

  // Calculate tooltip position with viewport bounds checking
  const tooltipWidth = 200; // Approximate tooltip width
  const tooltipHeight = 80; // Approximate tooltip height
  const padding = 10;
  
  let left = mousePosition.x + padding;
  let top = mousePosition.y - padding;
  
  // Adjust if tooltip would go off right edge
  if (left + tooltipWidth > window.innerWidth) {
    left = mousePosition.x - tooltipWidth - padding;
  }
  
  // Adjust if tooltip would go off top edge
  if (top - tooltipHeight < 0) {
    top = mousePosition.y + padding;
  }

  return (
    <div 
      className="fixed z-50 bg-card border border-border rounded-lg p-3 shadow-lg pointer-events-none max-w-xs"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: top < mousePosition.y ? 'none' : 'translateY(-100%)'
      }}
    >
      <div className="space-y-1">
        <div className="font-medium text-foreground">
          {dataPoint.dayName} {dataPoint.hourLabel}
        </div>
        <div className="text-sm text-muted-foreground">
          MC: {dataPoint.mcValue.toFixed(2)}
        </div>
        <div className="text-sm text-muted-foreground">
          {dataPoint.sampleSize} entr{dataPoint.sampleSize === 1 ? 'y' : 'ies'}
        </div>
      </div>
    </div>
  );
}

/**
 * Main PowerHours component
 */
export function PowerHours() {
  const { value: moodEntries } = useMoodEntries();
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    const data = PowerHoursCalculator.generateHeatmapData(moodEntries);
    console.log('PowerHours: Generated heatmap data', {
      totalEntries: moodEntries.length,
      dataPointsWithData: data.filter(d => d.sampleSize > 0).length,
      sampleData: data.filter(d => d.sampleSize > 0).slice(0, 5)
    });
    return data;
  }, [moodEntries]);

  // Calculate color scale
  const colorScale = useMemo(() => {
    return PowerHoursCalculator.calculateColorScale(heatmapData);
  }, [heatmapData]);

  // Check if we have enough data
  const hasData = heatmapData.some(d => d.sampleSize > 0);
  
  console.log('PowerHours: Data check', {
    hasData,
    totalDataPoints: heatmapData.length,
    dataPointsWithSamples: heatmapData.filter(d => d.sampleSize > 0).length,
    sampleDataPoints: heatmapData.filter(d => d.sampleSize > 0).slice(0, 3)
  });

  // Handle mouse hover with position tracking
  const handleCellHover = (dataPoint: HeatmapDataPoint | null, event?: React.MouseEvent) => {
    setHoveredCell(dataPoint);
    if (event && dataPoint) {
      setMousePosition({
        x: event.clientX,
        y: event.clientY
      });
    } else {
      setMousePosition(null);
    }
  };

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Simulate loading delay
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, [moodEntries]);

  if (isLoading) {
    return <PowerHoursLoading />;
  }

  if (!hasData) {
    return <PowerHoursEmptyState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Clock className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Power Hours</h2>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover your optimal performance hours throughout the week. 
          Darker colors indicate higher mood composite scores.
        </p>
      </div>

      {/* Color Legend */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Mood Composite Scale</span>
          </div>
          <ColorLegend colorScale={colorScale} isDark={isDark} />
        </div>
      </div>

      {/* Heatmap */}
      <div className="card p-6 overflow-x-auto">
        <div className="relative">
          {/* Hour labels */}
          <div className="flex mb-2">
            <div className="w-12"></div> {/* Empty space for day labels */}
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="w-8 text-center text-xs text-muted-foreground">
                {hour % 4 === 0 ? PowerHoursCalculator.getHourLabel(hour) : ''}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, day) => (
              <div key={day} className="flex items-center gap-2">
                {/* Day label */}
                <div className="w-12 text-sm font-medium text-foreground">
                  {PowerHoursCalculator.getDayName(day)}
                </div>
                
                {/* Hour cells */}
                <div className="flex gap-1">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const dataPoint = heatmapData.find(d => d.day === day && d.hour === hour);
                    if (!dataPoint) return null;
                    
                    return (
                      <HeatmapCell
                        key={`${day}-${hour}`}
                        dataPoint={dataPoint}
                        colorScale={colorScale}
                        isDark={isDark}
                        onHover={handleCellHover}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Tooltip - positioned outside scrollable container */}
      <HeatmapTooltip dataPoint={hoveredCell} mousePosition={mousePosition} />

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-600" />
            <h3 className="text-lg font-semibold text-foreground">Peak Performance</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Look for the darkest colored cells to identify your peak performance hours. 
            These are the best times for important tasks, studying, or creative work.
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-foreground">Pattern Recognition</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Notice patterns across days and times. Do you perform better in the morning? 
            Are weekends different from weekdays? Use these insights to optimize your schedule.
          </p>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="card p-6 bg-muted/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">How to Use Power Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Scheduling Strategy</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Schedule important tasks during your darkest hours</li>
              <li>• Use lighter hours for routine or low-energy tasks</li>
              <li>• Plan breaks during consistently light periods</li>
              <li>• Experiment with different times to find new patterns</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Data Collection</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Log check-ins at different times throughout the day</li>
              <li>• Include weekends to see full weekly patterns</li>
              <li>• Track for at least 2-3 weeks for reliable data</li>
              <li>• Note any lifestyle changes that might affect patterns</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
