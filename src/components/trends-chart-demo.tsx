/**
 * TrendsChart Demo Component
 * 
 * Demonstrates the trends visualization with sample data
 * and interactive features for testing and development.
 */

'use client';

import { useState } from 'react';
import { TrendsChart } from './TrendsChart';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { TestDataGenerator } from '@/lib/storage';
import { BarChart3, Download, RotateCcw, Calendar, TrendingUp } from 'lucide-react';

export function TrendsChartDemo() {
  const moodEntries = useMoodEntries();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTestData = async () => {
    setIsGenerating(true);
    try {
      const testData = TestDataGenerator.generateHistoricalMoodEntries(14);
      moodEntries.setValue(testData);
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error generating test data:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearData = () => {
    moodEntries.setValue([]);
  };

  const totalEntries = moodEntries.value.length;
  const uniqueDays = new Set(moodEntries.value.map(entry => 
    new Date(entry.timestamp).toDateString()
  )).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Wellness Trends</h2>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Visualize your mood and productivity patterns over time. 
          Track your progress and identify trends in your wellness journey.
        </p>
      </div>

      {/* Data controls */}
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
                <TrendingUp className="w-4 h-4" />
                <span>{totalEntries} total entries</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleGenerateTestData}
              disabled={isGenerating}
              className="btn btn-primary flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Test Data
                </>
              )}
            </button>
            
            <button
              onClick={handleClearData}
              className="btn btn-outline flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Clear Data
            </button>
          </div>
        </div>
      </div>

      {/* Chart component */}
      <TrendsChart />

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Interactive Charts</h3>
          </div>
          <p className="text-muted-foreground">
            Hover over data points to see exact values and dates. 
            Toggle metrics on/off to focus on specific trends.
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Trend Analysis</h3>
          </div>
          <p className="text-muted-foreground">
            See your progress over time with trend indicators. 
            Track improvements in mood, productivity, and wellness.
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Smart Insights</h3>
          </div>
          <p className="text-muted-foreground">
            Missing data points are handled gracefully. 
            Get helpful messages when you need more data for meaningful trends.
          </p>
        </div>
      </div>

      {/* Usage tips */}
      <div className="card p-6 bg-muted/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">How to Use Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Getting Started</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Log daily check-ins for at least 3 days</li>
              <li>• Use the toggle switches to focus on specific metrics</li>
              <li>• Hover over data points for detailed information</li>
              <li>• Look for patterns in your mood and productivity</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Understanding Trends</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• MC (Mood Composite): Overall emotional state</li>
              <li>• DSS (Daily Success Score): Productivity and achievement</li>
              <li>• LM (Learning Momentum): Focus and deep work</li>
              <li>• RI (Recovery Index): Sleep and stress management</li>
              <li>• CN (Connection): Social interactions and mood</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
