/**
 * CampusThrive Daily Check-in Interface
 * 
 * Main interface for daily mood tracking with:
 * - Four mood sliders with real-time score updates
 * - Time bucket selector with auto-detection
 * - Quick tag input with student suggestions
 * - Optional day-end inputs section
 * - Auto-save draft functionality
 * - Form validation and error handling
 * - Mobile-optimized for 30-second completion
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MoodTracker, MoodDimension } from './ui/MoodSlider';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { calculateMC, calculateDSS } from '@/lib/scoring';
import type { MoodEntry } from '@/types';
import { 
  Clock, 
  CheckCircle, 
  Save, 
  AlertCircle,
  Users,
  Moon,
  Target,
  Zap,
  Heart
} from 'lucide-react';

/**
 * Time bucket type
 */
type TimeBucket = 'Morning' | 'Midday' | 'Evening' | 'Night';

/**
 * Form state interface
 */
interface CheckinFormData {
  moodValues: {
    valence: number;
    energy: number;
    focus: number;
    stress: number;
  };
  timeBucket: TimeBucket;
  tags: string[];
  deepworkMinutes?: number;
  tasksCompleted?: number;
  sleepHours?: number;
  recoveryAction: boolean;
  socialTouchpoints?: number;
}

/**
 * Common student tags for suggestions
 */
const STUDENT_TAGS = [
  'study', 'exam', 'assignment', 'project', 'lecture', 'lab',
  'gym', 'exercise', 'workout', 'running', 'yoga',
  'social', 'friends', 'party', 'dating', 'family',
  'sleep', 'nap', 'tired', 'rested',
  'caffeine', 'coffee', 'energy-drink', 'tea',
  'stress', 'anxious', 'worried', 'calm', 'relaxed',
  'productive', 'focused', 'distracted', 'motivated',
  'food', 'hungry', 'eating', 'cooking',
  'music', 'gaming', 'entertainment', 'netflix',
  'weather', 'sunny', 'rainy', 'cold', 'hot',
  'travel', 'commute', 'walking', 'driving'
];

/**
 * Time bucket configuration
 */
const TIME_BUCKETS: { value: TimeBucket; label: string; hours: [number, number]; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'Morning', label: 'Morning', hours: [5, 12], icon: Clock },
  { value: 'Midday', label: 'Midday', hours: [12, 17], icon: Target },
  { value: 'Evening', label: 'Evening', hours: [17, 22], icon: Zap },
  { value: 'Night', label: 'Night', hours: [22, 5], icon: Moon }
];

/**
 * Main Daily Check-in Component
 */
export function DailyCheckin({ onCheckinComplete }: { onCheckinComplete?: () => void }) {
  // Form state
  const [formData, setFormData] = useState<CheckinFormData>({
    moodValues: {
      valence: 2.5,
      energy: 2.5,
      focus: 2.5,
      stress: 2.5,
    },
    timeBucket: 'Morning',
    tags: [],
    recoveryAction: false,
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showDayEndInputs, setShowDayEndInputs] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Hooks
  const moodEntries = useMoodEntries();

  // Auto-detect current time bucket
  const getCurrentTimeBucket = useCallback((): TimeBucket => {
    const hour = new Date().getHours();
    for (const bucket of TIME_BUCKETS) {
      const [start, end] = bucket.hours;
      if (start <= end) {
        if (hour >= start && hour < end) return bucket.value;
      } else {
        if (hour >= start || hour < end) return bucket.value;
      }
    }
    return 'Morning';
  }, []);

  // Calculate real-time scores using the centralized scoring system
  const computedScores = useMemo(() => {
    const { valence, energy, focus, stress } = formData.moodValues;
    
    // Create a temporary entry for scoring
    const tempEntry: MoodEntry = {
      id: 'temp',
      timestamp: new Date(),
      timeBucket: formData.timeBucket,
      valence,
      energy,
      focus,
      stress,
      tags: formData.tags,
      deepworkMinutes: formData.deepworkMinutes || 0,
      tasksCompleted: formData.tasksCompleted || 0,
      sleepHours: formData.sleepHours || 0,
      recoveryAction: formData.recoveryAction || false,
      socialTouchpoints: formData.socialTouchpoints || 0
    };

    // Use historical data for z-score calculation
    const historicalEntries = moodEntries.value;
    
    if (historicalEntries.length < 3) {
      // Fallback to simple calculation when insufficient data
      const MC = (valence + energy + focus + (5 - stress)) / 4;
      const DSS = (formData.tasksCompleted || 0) * 0.4 + 
                  (formData.deepworkMinutes || 0) * 0.01 + 
                  MC * 0.3;
      return { MC, DSS };
    }

    // Use centralized scoring system
    const mcResult = calculateMC(tempEntry, historicalEntries, formData.timeBucket);
    const dssResult = calculateDSS(tempEntry, historicalEntries);
    
    return { 
      MC: mcResult.mc, 
      DSS: dssResult.dss 
    };
  }, [formData, moodEntries.value]);

  // Auto-save draft functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem('campus-thrive-draft', JSON.stringify(formData));
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [formData, hasUnsavedChanges]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('campus-thrive-draft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData(parsedDraft);
        setHasUnsavedChanges(true);
      } catch (error) {
        console.warn('Failed to load draft:', error);
      }
    }
    
    // Set current time bucket
    setFormData(prev => ({ ...prev, timeBucket: getCurrentTimeBucket() }));
  }, [getCurrentTimeBucket]);

  // Handle mood changes
  const handleMoodChange = useCallback((dimension: MoodDimension, value: number) => {
    setFormData(prev => ({
      ...prev,
      moodValues: { ...prev.moodValues, [dimension]: value }
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle time bucket change
  const handleTimeBucketChange = useCallback((bucket: TimeBucket) => {
    setFormData(prev => ({ ...prev, timeBucket: bucket }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle tag input
  const handleTagInputChange = useCallback((value: string) => {
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
  }, []);

  // Add tag
  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !formData.tags.includes(normalizedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, normalizedTag]
      }));
      setHasUnsavedChanges(true);
    }
    setTagInput('');
    setShowTagSuggestions(false);
  }, [formData.tags]);

  // Remove tag
  const removeTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Handle day-end input changes
  const handleDayEndChange = useCallback((field: keyof Pick<CheckinFormData, 'deepworkMinutes' | 'tasksCompleted' | 'sleepHours' | 'recoveryAction' | 'socialTouchpoints'>, value: number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  // Filter tag suggestions
  const filteredSuggestions = useMemo(() => {
    if (!tagInput) return STUDENT_TAGS.slice(0, 8);
    
    return STUDENT_TAGS
      .filter(tag => tag.toLowerCase().includes(tagInput.toLowerCase()))
      .filter(tag => !formData.tags.includes(tag))
      .slice(0, 8);
  }, [tagInput, formData.tags]);

  // Save form
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const newEntry = {
        id: `checkin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        timeBucket: formData.timeBucket,
        ...formData.moodValues,
        tags: formData.tags,
        ...(formData.deepworkMinutes !== undefined && { deepworkMinutes: formData.deepworkMinutes }),
        ...(formData.tasksCompleted !== undefined && { tasksCompleted: formData.tasksCompleted }),
        ...(formData.sleepHours !== undefined && { sleepHours: formData.sleepHours }),
        recoveryAction: formData.recoveryAction,
        ...(formData.socialTouchpoints !== undefined && { socialTouchpoints: formData.socialTouchpoints }),
      };

      const updatedEntries = [...moodEntries.value, newEntry];
      moodEntries.setValue(updatedEntries);
      
      // Clear draft
      localStorage.removeItem('campus-thrive-draft');
      setHasUnsavedChanges(false);
      
      // Show success message
      setSaveMessage({ type: 'success', text: 'Check-in saved successfully! 🎉' });
      
      // Notify parent component of successful check-in
      onCheckinComplete?.();
      
      // Reset form after a delay
      setTimeout(() => {
        setFormData({
          moodValues: { valence: 2.5, energy: 2.5, focus: 2.5, stress: 2.5 },
          timeBucket: getCurrentTimeBucket(),
          tags: [],
          recoveryAction: false,
        });
        setShowDayEndInputs(false);
        setSaveMessage(null);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to save check-in:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save check-in. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }, [formData, moodEntries, getCurrentTimeBucket]);

  // Form validation
  const isFormValid = useMemo(() => {
    return formData.moodValues.valence >= 0 && 
           formData.moodValues.valence <= 5 &&
           formData.moodValues.energy >= 0 && 
           formData.moodValues.energy <= 5 &&
           formData.moodValues.focus >= 0 && 
           formData.moodValues.focus <= 5 &&
           formData.moodValues.stress >= 0 && 
           formData.moodValues.stress <= 5;
  }, [formData.moodValues]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Daily Check-in</h1>
        <p className="text-muted-foreground">
          Take 30 seconds to track your mood and activities
        </p>
        {hasUnsavedChanges && (
          <div className="flex items-center justify-center gap-2 text-sm text-orange-600">
            <AlertCircle className="w-4 h-4" />
            <span>You have unsaved changes</span>
          </div>
        )}
      </div>

      {/* Real-time Scores */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Current Scores</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {computedScores.MC.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Mood Composite</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {computedScores.DSS.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Daily Success Score</div>
          </div>
        </div>
      </div>

      {/* Time Bucket Selector */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">When is this check-in for?</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {TIME_BUCKETS.map((bucket) => {
            const Icon = bucket.icon;
            return (
              <button
                key={bucket.value}
                onClick={() => handleTimeBucketChange(bucket.value)}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200 relative
                  ${formData.timeBucket === bucket.value
                    ? 'border-primary bg-primary text-white shadow-md scale-105'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{bucket.label}</span>
                {formData.timeBucket === bucket.value && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Selected: <span className="font-medium text-primary">{formData.timeBucket}</span>
        </div>
        <button
          onClick={() => handleTimeBucketChange(getCurrentTimeBucket())}
          className="btn btn-outline btn-lg flex items-center gap-2 px-4 py-2 hover:bg-primary/10 hover:border-primary transition-all duration-200"
        >
          <Clock className="w-4 h-4" />
          Use Current Time
        </button>
      </div>

      {/* Mood Sliders */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">How are you feeling?</h3>
        <MoodTracker
          values={formData.moodValues}
          onChange={handleMoodChange}
          size="md"
          showLabels={true}
          showRangeIndicators={true}
          showSummary={false}
        />
      </div>

      {/* Quick Tags */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">What&apos;s happening today?</h3>
        <div className="relative">
          <div className="flex gap-2 flex-wrap mb-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-primary/70"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => handleTagInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (tagInput.trim()) addTag(tagInput.trim());
                }
              }}
              placeholder="Add tags (study, gym, social...)"
              className="input w-full"
            />
            
            {showTagSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-sm border border-border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                {filteredSuggestions.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => addTag(tag)}
                    className="w-full px-3 py-2 text-left hover:bg-secondary text-sm"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Day-end Inputs Toggle */}
      <div className="space-y-3">
        <button
          onClick={() => setShowDayEndInputs(!showDayEndInputs)}
          className="btn btn-outline btn-lg w-full px-6 py-3 text-base font-medium"
        >
          {showDayEndInputs ? 'Hide' : 'Show'} Day-end Details
        </button>
        
        {showDayEndInputs && (
          <div className="space-y-4 p-4 bg-secondary/50 rounded-lg">
            <h4 className="font-semibold text-foreground">Day-end Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deep Work Minutes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Deep Work Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="480"
                  value={formData.deepworkMinutes || ''}
                  onChange={(e) => handleDayEndChange('deepworkMinutes', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="input"
                />
              </div>

              {/* Tasks Completed */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Tasks Completed
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.tasksCompleted || ''}
                  onChange={(e) => handleDayEndChange('tasksCompleted', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="input"
                />
              </div>

              {/* Sleep Hours */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  Sleep Hours (Last Night)
                </label>
                <input
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  value={formData.sleepHours || ''}
                  onChange={(e) => handleDayEndChange('sleepHours', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="input"
                />
              </div>

              {/* Social Touchpoints */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Social Interactions
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.socialTouchpoints || ''}
                  onChange={(e) => handleDayEndChange('socialTouchpoints', parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="input"
                />
              </div>
            </div>

            {/* Recovery Action */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="recoveryAction"
                checked={formData.recoveryAction}
                onChange={(e) => handleDayEndChange('recoveryAction', e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="recoveryAction" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Took a recovery action (meditation, break, etc.)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="space-y-3">
        <button
          onClick={handleSave}
          disabled={!isFormValid || isSaving}
          className="btn btn-primary btn-lg w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Check-in'}
        </button>
        
        {saveMessage && (
          <div className={`
            p-3 rounded-md text-center
            ${saveMessage.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
            }
          `}>
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {moodEntries.value.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          You&apos;ve completed {moodEntries.value.length} check-ins
        </div>
      )}
    </div>
  );
}
