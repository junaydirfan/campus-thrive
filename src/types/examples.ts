/**
 * Example usage of CampusThrive types
 * This file demonstrates how to use the defined interfaces
 */

import type {
  MoodEntry,
  ComputedScores,
  PowerHourHeatmap,
  CoachTip,
  CreateMoodEntry,
  MoodEntryFilters
} from '@/types';

// Example: Creating a new mood entry
const createNewMoodEntry = (): CreateMoodEntry => {
  return {
    timeBucket: 'Morning',
    valence: 4,
    energy: 3,
    focus: 4,
    stress: 2,
    tags: ['studying', 'coffee', 'good-sleep'],
    deepworkMinutes: 45,
    tasksCompleted: 3,
    sleepHours: 7.5,
    recoveryAction: true,
    socialTouchpoints: 2
  };
};

// Example: Computing scores from mood entries
const computeScores = (entries: MoodEntry[]): ComputedScores => {
  if (entries.length === 0) {
    return {
      MC: 0,
      DSS: 0,
      LM: 0,
      RI: 0,
      CN: 0
    };
  }
  
  const latestEntry = entries[entries.length - 1]!;
  
  // Mood Composite Score calculation
  const MC = (latestEntry.valence + latestEntry.energy + latestEntry.focus - latestEntry.stress) / 4;
  
  // Daily Success Score calculation
  const DSS = (latestEntry.tasksCompleted || 0) * 0.4 + 
              (latestEntry.deepworkMinutes || 0) * 0.01 + 
              MC * 0.3;
  
  // Learning Momentum calculation (simplified)
  const LM = latestEntry.focus + ((latestEntry.deepworkMinutes || 0) * 0.1);
  
  // Recovery Index calculation
  const RI = (latestEntry.sleepHours || 0) * 0.3 + 
             (latestEntry.recoveryAction ? 0.2 : 0) + 
             (5 - latestEntry.stress) * 0.1;
  
  // Connection Score calculation
  const CN = (latestEntry.socialTouchpoints || 0) * 0.1 + 
             (latestEntry.valence > 3 ? 0.2 : 0);
  
  return {
    MC: Math.max(-1.25, Math.min(5, MC)),
    DSS: Math.max(0, DSS),
    LM: Math.max(0, LM),
    RI: Math.max(0, Math.min(5, RI)),
    CN: Math.max(0, CN)
  };
};

// Example: Filtering mood entries
const filterMoodEntries = (entries: MoodEntry[], filters: MoodEntryFilters): MoodEntry[] => {
  return entries.filter(entry => {
    // Date range filter
    if (filters.dateRange) {
      const entryDate = new Date(entry.timestamp);
      if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
        return false;
      }
    }
    
    // Time bucket filter
    if (filters.timeBuckets && !filters.timeBuckets.includes(entry.timeBucket)) {
      return false;
    }
    
    // Tags filter
    if (filters.tags && !filters.tags.some(tag => entry.tags.includes(tag))) {
      return false;
    }
    
    // Mood range filters
    if (filters.minValence && entry.valence < filters.minValence) return false;
    if (filters.maxValence && entry.valence > filters.maxValence) return false;
    if (filters.minEnergy && entry.energy < filters.minEnergy) return false;
    if (filters.maxEnergy && entry.energy > filters.maxEnergy) return false;
    if (filters.minFocus && entry.focus < filters.minFocus) return false;
    if (filters.maxFocus && entry.focus > filters.maxFocus) return false;
    if (filters.minStress && entry.stress < filters.minStress) return false;
    if (filters.maxStress && entry.stress > filters.maxStress) return false;
    
    return true;
  });
};

// Example: Creating a PowerHour heatmap
const createPowerHourHeatmap = (entries: MoodEntry[]): PowerHourHeatmap => {
  const matrix: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
  const hourCounts: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
  
  // Process entries to build productivity matrix
  entries.forEach(entry => {
    const date = new Date(entry.timestamp);
    const weekday = date.getDay();
    const hour = date.getHours();
    
    // Calculate productivity score based on focus and energy
    const productivityScore = (entry.focus + entry.energy) / 2;
    
    const matrixRow = matrix[weekday];
    const countRow = hourCounts[weekday];
    
    if (matrixRow && countRow) {
      matrixRow[hour]! += productivityScore;
      countRow[hour]! += 1;
    }
  });
  
  // Average the scores
  for (let day = 0; day < 7; day++) {
    const matrixRow = matrix[day];
    const countRow = hourCounts[day];
    
    if (matrixRow && countRow) {
      for (let hour = 0; hour < 24; hour++) {
        if (countRow[hour]! > 0) {
          matrixRow[hour] = matrixRow[hour]! / countRow[hour]!;
        }
      }
    }
  }
  
  // Find peak and low hours
  const allHours: { weekday: number; hour: number; score: number }[] = [];
  for (let day = 0; day < 7; day++) {
    const matrixRow = matrix[day];
    const countRow = hourCounts[day];
    
    if (matrixRow && countRow) {
      for (let hour = 0; hour < 24; hour++) {
        if (countRow[hour]! > 0) {
          allHours.push({ weekday: day, hour, score: matrixRow[hour]! });
        }
      }
    }
  }
  
  const peakHours = allHours
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  
  const lowHours = allHours
    .sort((a, b) => a.score - b.score)
    .slice(0, 10);
  
  return {
    matrix,
    peakHours,
    lowHours,
    lastUpdated: new Date()
  };
};

// Example: Creating a coach tip
const createCoachTip = (
  content: string,
  category: string,
  priority: 'high' | 'medium' | 'low' = 'medium'
): CoachTip => {
  return {
    id: `tip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    conditions: [
      { score: 'stress', operator: '>=', value: 3 }
    ],
    priority,
    category,
    suggestedAction: 'Take a 5-minute break and practice deep breathing',
    duration: 5
  };
};

export {
  createNewMoodEntry,
  computeScores,
  filterMoodEntries,
  createPowerHourHeatmap,
  createCoachTip
};
