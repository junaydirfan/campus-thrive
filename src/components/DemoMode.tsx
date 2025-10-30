/**
 * CampusThrive Demo Mode Component
 * 
 * Provides demo functionality for hackathon presentation with:
 * - One-click demo data generation
 * - Clear demo mode indicators
 * - Reset to demo state functionality
 * - Demo-specific messaging and branding
 */

'use client';

import { useState } from 'react';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { TestDataGenerator } from '@/lib/storage';
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Info, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface DemoModeProps {
  onDemoDataLoaded?: () => void;
  onDataLoadingStart?: () => void;
  onDataLoadingComplete?: () => void;
  onForceRefresh?: () => void;
}

export function DemoMode({ onDemoDataLoaded, onDataLoadingStart, onDataLoadingComplete, onForceRefresh }: DemoModeProps) {
  const { value: moodEntries, setValue: setMoodEntries } = useMoodEntries();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDemoInfo, setShowDemoInfo] = useState(false);

  const hasData = moodEntries.length > 0;
  const isDemoData = moodEntries.some(entry => entry.id.startsWith('demo-'));

  const handleGenerateDemoData = async () => {
    setIsGenerating(true);
    onDataLoadingStart?.();
    try {
      const demoData = TestDataGenerator.generateDemoData();
      setMoodEntries(demoData);
      
      // Show success message
      setTimeout(() => {
        onDemoDataLoaded?.();
      }, 1000);
      
      // Give ScoresDisplay time to process the data
      setTimeout(() => {
        onDataLoadingComplete?.();
      }, 1500);
      
      // Force an additional refresh after more time
      setTimeout(() => {
        console.log('DemoMode: Forcing additional refresh');
        onDataLoadingComplete?.();
        onForceRefresh?.();
      }, 2000);
    } catch (error) {
      console.error('Error generating demo data:', error);
      onDataLoadingComplete?.();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetToDemo = async () => {
    setIsResetting(true);
    onDataLoadingStart?.();
    try {
      const demoData = TestDataGenerator.generateDemoData();
      setMoodEntries(demoData);
    } catch (error) {
      console.error('Error resetting to demo data:', error);
    } finally {
      setIsResetting(false);
      onDataLoadingComplete?.();
    }
  };

  const handleClearData = () => {
    onDataLoadingStart?.();
    setMoodEntries([]);
    setTimeout(() => {
      onDataLoadingComplete?.();
    }, 500);
  };

  return (
    <div className={`space-y-6 transition-all duration-500 ${(isGenerating || isResetting) ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}`}>
      {/* Demo Status Card */}
      <div className="card p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-lg bg-purple-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Demo Status</h3>
          </div>
        </div>

        {/* Demo Status */}
        <div className="flex items-center gap-2 mb-2">
          {isDemoData ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Demo data loaded</span>
            </>
          ) : hasData ? (
            <>
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Real data present</span>
            </>
          ) : (
            <>
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">No data yet</span>
            </>
          )}
        </div>

        {/* Demo Info Toggle */}
        <button
          onClick={() => setShowDemoInfo(!showDemoInfo)}
          className="text-sm text-purple-600 hover:text-purple-700 underline"
        >
          {showDemoInfo ? 'Hide' : 'Show'} demo information
        </button>

        {showDemoInfo && (
          <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
            <h3 className="font-semibold text-foreground mb-2">Demo Data Features:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 14 days of realistic mood entries with clear patterns</li>
              <li>• Varied mood states showing improvement over time</li>
              <li>• Realistic tags, activities, and optional fields</li>
              <li>• Perfect for demonstrating scoring algorithms and visualizations</li>
              <li>• Shows exam stress recovery and productivity patterns</li>
            </ul>
          </div>
        )}
      </div>

      {/* Demo Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Generate Demo Data */}
        <button
          onClick={handleGenerateDemoData}
          disabled={isGenerating}
          className="card p-4 text-center hover:bg-background-alt transition-colors disabled:opacity-50"
        >
          <div className="flex flex-col items-center gap-3">
            {isGenerating ? (
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            ) : (
              <Play className="w-8 h-8 text-purple-500" />
            )}
            <div>
              <h3 className="font-semibold text-foreground">
                {isGenerating ? 'Generating...' : 'Load Demo Data'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isGenerating ? 'Creating demo entries...' : 'Generate 14 days of sample data'}
              </p>
            </div>
          </div>
        </button>

        {/* Reset to Demo */}
        {hasData && (
          <button
            onClick={handleResetToDemo}
            disabled={isResetting}
            className="card p-4 text-center hover:bg-background-alt transition-colors disabled:opacity-50"
          >
            <div className="flex flex-col items-center gap-3">
              {isResetting ? (
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              ) : (
                <RotateCcw className="w-8 h-8 text-blue-500" />
              )}
              <div>
                <h3 className="font-semibold text-foreground">
                  {isResetting ? 'Resetting...' : 'Reset to Demo'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isResetting ? 'Loading fresh demo data...' : 'Replace current data with demo data'}
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Clear All Data */}
        {hasData && (
          <button
            onClick={handleClearData}
            className="card p-4 text-center hover:bg-background-alt transition-colors"
          >
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-foreground">Clear All Data</h3>
                <p className="text-sm text-muted-foreground">
                  Remove all entries and start fresh
                </p>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Demo Statistics */}
      {hasData && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Current Data Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center flex flex-col justify-center min-h-[60px]">
              <div className="text-2xl font-bold text-blue-600 mb-1">{moodEntries.length}</div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
            </div>
            <div className="text-center flex flex-col justify-center min-h-[60px]">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {new Set(moodEntries.map(e => new Date(e.timestamp).toDateString())).size}
              </div>
              <div className="text-sm text-muted-foreground">Days Tracked</div>
            </div>
            <div className="text-center flex flex-col justify-center min-h-[60px]">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {isDemoData ? 'Demo' : 'Real'}
              </div>
              <div className="text-sm text-muted-foreground">Data Type</div>
            </div>
            <div className="text-center flex flex-col justify-center min-h-[60px]">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {moodEntries.filter(e => e.tags && e.tags.length > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Tagged Entries</div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Tips */}
      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-foreground mb-2">Demo Tips for Hackathon</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Load demo data to show all features with realistic patterns</li>
          <li>• Navigate through different pages to showcase the full app</li>
          <li>• Highlight the privacy-first approach (data stays local)</li>
          <li>• Show the scoring algorithms and visualizations</li>
          <li>• Demonstrate the mobile-responsive design</li>
          <li>• Explain the z-score normalization and baseline comparison</li>
        </ul>
      </div>
    </div>
  );
}
