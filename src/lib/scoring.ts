/**
 * CampusThrive Scoring System
 * 
 * Implements the exact algorithms from the specification for calculating
 * Mood Composite (MC), Daily Success Score (DSS), and other wellness metrics.
 * 
 * All calculations use z-score normalization with historical data as baseline.
 */

import { MoodEntry, TimeBucket } from '@/types';

/**
 * Scoring configuration constants
 */
const SCORING_CONFIG = {
  /** Minimum sigma value to prevent division by zero */
  SIGMA_FLOOR: 0.5,
  
  /** Minimum number of historical entries for reliable z-score calculation */
  MIN_HISTORICAL_ENTRIES: 3,
  
  /** MC calculation weights */
  MC_WEIGHTS: {
    VALENCE: 0.4,
    ENERGY: 0.3,
    FOCUS: 0.2,
    STRESS: -0.2 // Negative because higher stress = lower MC
  },
  
  /** DSS calculation weights */
  DSS_WEIGHTS: {
    LM: 0.5, // Learning Momentum
    RI: 0.3, // Recovery Index
    CN: 0.2  // Connection
  },
  
  /** DSS component multipliers */
  DSS_MULTIPLIERS: {
    TASKS_TO_LM: 10, // Each task completed adds 10 to LM
    RECOVERY_TO_RI: 1 // Recovery action adds 1 to RI
  }
} as const;

/**
 * Z-score calculation result
 */
interface ZScoreResult {
  zScore: number;
  mean: number;
  sigma: number;
  isValid: boolean;
}

/**
 * MC calculation result
 */
interface MCCalculationResult {
  mc: number;
  components: {
    valence: { raw: number; zScore: number };
    energy: { raw: number; zScore: number };
    focus: { raw: number; zScore: number };
    stress: { raw: number; zScore: number };
  };
  isValid: boolean;
  error: string | undefined;
}

/**
 * DSS calculation result
 */
interface DSSCalculationResult {
  dss: number;
  components: {
    lm: { raw: number; zScore: number };
    ri: { raw: number; zScore: number };
    cn: { raw: number; zScore: number };
  };
  isValid: boolean;
  error: string | undefined;
}

/**
 * Driver analysis result
 */
interface DriverAnalysisResult {
  tag: string;
  occurrences: number;
  mcImpact: number;
  dssImpact: number;
  avgMCWith: number;
  avgMCWithout: number;
  avgDSSWith: number;
  avgDSSWithout: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Power hours analysis result
 */
interface PowerHoursResult {
  matrix: number[][]; // 7x24 matrix (weekday x hour)
  peakHours: Array<{
    weekday: number;
    hour: number;
    score: number;
  }>;
  lowHours: Array<{
    weekday: number;
    hour: number;
    score: number;
  }>;
  lastUpdated: Date;
}

/**
 * Streak calculation result
 */
interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  streakStartDate: string | null;
  lastEntryDate: string | null;
  isActive: boolean;
}

/**
 * Calculate z-score for a value against historical data
 */
function calculateZScore(value: number, historicalValues: number[]): ZScoreResult {
  console.log('Z-Score Calculation Debug:', {
    value,
    historicalValues: historicalValues.slice(0, 10), // First 10 for debugging
    allHistoricalValues: historicalValues,
    length: historicalValues.length,
    minRequired: SCORING_CONFIG.MIN_HISTORICAL_ENTRIES
  });

  if (historicalValues.length < SCORING_CONFIG.MIN_HISTORICAL_ENTRIES) {
    console.log('Z-Score: Not enough historical entries');
    return {
      zScore: 0,
      mean: value,
      sigma: SCORING_CONFIG.SIGMA_FLOOR,
      isValid: false
    };
  }

  const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
  const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
  const sigma = Math.max(Math.sqrt(variance), SCORING_CONFIG.SIGMA_FLOOR);
  
  const zScore = sigma === 0 ? 0 : (value - mean) / sigma;
  
  console.log('Z-Score Calculation Result:', {
    mean,
    variance,
    sigma,
    zScore,
    isValid: true
  });
  
  return {
    zScore,
    mean,
    sigma,
    isValid: true
  };
}

/**
 * Calculate Mood Composite (MC) score
 * 
 * Formula: MC = 0.4*zV + 0.3*zE + 0.2*zF - 0.2*zS
 * Where zV, zE, zF, zS are z-scores of valence, energy, focus, stress
 */
export function calculateMC(
  currentEntry: MoodEntry,
  historicalEntries: MoodEntry[],
  timeBucket?: TimeBucket
): MCCalculationResult {
  try {
    // Filter historical entries by time bucket if specified
    const relevantHistorical = timeBucket 
      ? historicalEntries.filter(entry => entry.timeBucket === timeBucket)
      : historicalEntries;

    // Extract current values
    const currentValence = currentEntry.valence;
    const currentEnergy = currentEntry.energy;
    const currentFocus = currentEntry.focus;
    const currentStress = currentEntry.stress;

    // Extract historical values
    const historicalValence = relevantHistorical.map(e => e.valence);
    const historicalEnergy = relevantHistorical.map(e => e.energy);
    const historicalFocus = relevantHistorical.map(e => e.focus);
    const historicalStress = relevantHistorical.map(e => e.stress);

    // Calculate z-scores
    const valenceZ = calculateZScore(currentValence, historicalValence);
    const energyZ = calculateZScore(currentEnergy, historicalEnergy);
    const focusZ = calculateZScore(currentFocus, historicalFocus);
    const stressZ = calculateZScore(currentStress, historicalStress);

    // Calculate MC using the exact formula
    const mc = 
      SCORING_CONFIG.MC_WEIGHTS.VALENCE * valenceZ.zScore +
      SCORING_CONFIG.MC_WEIGHTS.ENERGY * energyZ.zScore +
      SCORING_CONFIG.MC_WEIGHTS.FOCUS * focusZ.zScore +
      SCORING_CONFIG.MC_WEIGHTS.STRESS * stressZ.zScore;

    // Check if calculation is valid
    const isValid = valenceZ.isValid && energyZ.isValid && focusZ.isValid && stressZ.isValid;

    return {
      mc: parseFloat(mc.toFixed(3)),
      components: {
        valence: { raw: currentValence, zScore: valenceZ.zScore },
        energy: { raw: currentEnergy, zScore: energyZ.zScore },
        focus: { raw: currentFocus, zScore: focusZ.zScore },
        stress: { raw: currentStress, zScore: stressZ.zScore }
      },
      isValid,
      error: isValid ? undefined : 'Insufficient historical data for reliable calculation'
    };
  } catch (error) {
    return {
      mc: 0,
      components: {
        valence: { raw: currentEntry.valence, zScore: 0 },
        energy: { raw: currentEntry.energy, zScore: 0 },
        focus: { raw: currentEntry.focus, zScore: 0 },
        stress: { raw: currentEntry.stress, zScore: 0 }
      },
      isValid: false,
      error: `MC calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Calculate Daily Success Score (DSS)
 * 
 * Components:
 * - LM (Learning Momentum) = deepwork_minutes + 10*tasks_completed
 * - RI (Recovery Index) = sleep_hours + (recovery_action ? 1 : 0)
 * - CN (Connection) = positive_social_touchpoints
 * 
 * Formula: DSS = 0.5*zLM + 0.3*zRI + 0.2*zCN
 */
export function calculateDSS(
  entry: MoodEntry,
  historicalEntries: MoodEntry[]
): DSSCalculationResult {
  try {
    // Calculate raw component values
    const lmRaw = (entry.deepworkMinutes || 0) + 
                  SCORING_CONFIG.DSS_MULTIPLIERS.TASKS_TO_LM * (entry.tasksCompleted || 0);
    
    const riRaw = (entry.sleepHours || 0) + 
                  (entry.recoveryAction ? SCORING_CONFIG.DSS_MULTIPLIERS.RECOVERY_TO_RI : 0);
    
    // For Connection score, use the average of recent socialTouchpoints instead of just current entry
    const allEntries = [...historicalEntries, entry];
    const recentSocialTouchpoints = allEntries.slice(-7).map(e => e.socialTouchpoints || 0); // Last 7 entries
    const cnRaw = recentSocialTouchpoints.reduce((sum, val) => sum + val, 0) / recentSocialTouchpoints.length;

    // Extract historical component values
    const historicalLM = historicalEntries.map(e => 
      (e.deepworkMinutes || 0) + SCORING_CONFIG.DSS_MULTIPLIERS.TASKS_TO_LM * (e.tasksCompleted || 0)
    );
    
    const historicalRI = historicalEntries.map(e => 
      (e.sleepHours || 0) + (e.recoveryAction ? SCORING_CONFIG.DSS_MULTIPLIERS.RECOVERY_TO_RI : 0)
    );
    
    const historicalCN = historicalEntries.map(e => e.socialTouchpoints || 0);

    console.log('DSS Calculation Debug:', {
      cnRaw,
      recentSocialTouchpoints,
      historicalCN: historicalCN.slice(0, 10), // First 10 for debugging
      allHistoricalCN: historicalCN,
      historicalEntriesLength: historicalEntries.length
    });

    // Calculate z-scores
    const lmZ = calculateZScore(lmRaw, historicalLM);
    const riZ = calculateZScore(riRaw, historicalRI);
    const cnZ = calculateZScore(cnRaw, historicalCN);

    console.log('DSS Z-Scores Debug:', {
      cnZ: {
        zScore: cnZ.zScore,
        mean: cnZ.mean,
        sigma: cnZ.sigma,
        isValid: cnZ.isValid
      }
    });

    // Calculate DSS using the exact formula
    const dss = 
      SCORING_CONFIG.DSS_WEIGHTS.LM * lmZ.zScore +
      SCORING_CONFIG.DSS_WEIGHTS.RI * riZ.zScore +
      SCORING_CONFIG.DSS_WEIGHTS.CN * cnZ.zScore;

    // Check if calculation is valid
    const isValid = lmZ.isValid && riZ.isValid && cnZ.isValid;

    return {
      dss: parseFloat(dss.toFixed(3)),
      components: {
        lm: { raw: lmRaw, zScore: lmZ.zScore },
        ri: { raw: riRaw, zScore: riZ.zScore },
        cn: { raw: cnRaw, zScore: cnZ.zScore }
      },
      isValid,
      error: isValid ? undefined : 'Insufficient historical data for reliable calculation'
    };
  } catch (error) {
    return {
      dss: 0,
      components: {
        lm: { raw: 0, zScore: 0 },
        ri: { raw: 0, zScore: 0 },
        cn: { raw: 0, zScore: 0 }
      },
      isValid: false,
      error: `DSS calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Calculate streak information
 */
export function calculateStreak(entries: MoodEntry[]): StreakResult {
  try {
    if (entries.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakStartDate: null,
        lastEntryDate: null,
        isActive: false
      };
    }

    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const lastEntryDate = sortedEntries[0]?.timestamp || '';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Group entries by date
    const entriesByDate = new Map<string, MoodEntry[]>();
    sortedEntries.forEach(entry => {
      const dateKey = new Date(entry.timestamp).toDateString();
      if (!entriesByDate.has(dateKey)) {
        entriesByDate.set(dateKey, []);
      }
      entriesByDate.get(dateKey)!.push(entry);
    });

    const sortedDates = Array.from(entriesByDate.keys()).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    // Calculate current streak
    let currentStreak = 0;
    let streakStartDate: string | null = null;
    let isActive = false;

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i] || '');
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      // Check if this date matches the expected streak date
      if (currentDate.toDateString() === expectedDate.toDateString()) {
        currentStreak++;
        streakStartDate = sortedDates[i] || null;
        if (i === 0) {
          isActive = true; // Most recent entry is today
        }
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of sortedDates.reverse()) {
      const currentDate = new Date(dateStr);
      
      if (lastDate === null) {
        tempStreak = 1;
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      
      lastDate = currentDate;
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      currentStreak,
      longestStreak,
      streakStartDate,
      lastEntryDate: typeof lastEntryDate === 'string' ? lastEntryDate : lastEntryDate.toISOString(),
      isActive
    };
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakStartDate: null,
      lastEntryDate: null,
      isActive: false
    };
  }
}

/**
 * Analyze activity drivers (tags) and their impact on MC and DSS
 */
export function analyzeDrivers(
  entries: MoodEntry[],
  minOccurrences: number = 3
): DriverAnalysisResult[] {
  try {
    if (entries.length === 0) {
      return [];
    }

    // Collect all unique tags
    const allTags = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => allTags.add(tag));
    });

    const driverResults: DriverAnalysisResult[] = [];

    for (const tag of allTags) {
      // Find entries with and without this tag
      const entriesWithTag = entries.filter(entry => entry.tags?.includes(tag));
      const entriesWithoutTag = entries.filter(entry => !entry.tags?.includes(tag));

      // Skip if not enough occurrences
      if (entriesWithTag.length < minOccurrences) {
        continue;
      }

      // Calculate MC and DSS for entries with tag
      const mcWithTag = entriesWithTag.map(entry => {
        const mcResult = calculateMC(entry, entries);
        return mcResult.mc;
      });
      const dssWithTag = entriesWithTag.map(entry => {
        const dssResult = calculateDSS(entry, entries);
        return dssResult.dss;
      });

      // Calculate MC and DSS for entries without tag
      const mcWithoutTag = entriesWithoutTag.map(entry => {
        const mcResult = calculateMC(entry, entries);
        return mcResult.mc;
      });
      const dssWithoutTag = entriesWithoutTag.map(entry => {
        const dssResult = calculateDSS(entry, entries);
        return dssResult.dss;
      });

      // Calculate averages
      const avgMCWith = mcWithTag.length > 0 ? mcWithTag.reduce((sum, mc) => sum + mc, 0) / mcWithTag.length : 0;
      const avgMCWithout = mcWithoutTag.length > 0 ? mcWithoutTag.reduce((sum, mc) => sum + mc, 0) / mcWithoutTag.length : 0;
      const avgDSSWith = dssWithTag.length > 0 ? dssWithTag.reduce((sum, dss) => sum + dss, 0) / dssWithTag.length : 0;
      const avgDSSWithout = dssWithoutTag.length > 0 ? dssWithoutTag.reduce((sum, dss) => sum + dss, 0) / dssWithoutTag.length : 0;

      // Calculate impacts
      const mcImpact = avgMCWith - avgMCWithout;
      const dssImpact = avgDSSWith - avgDSSWithout;

      // Determine confidence based on sample size
      let confidence: 'high' | 'medium' | 'low';
      if (entriesWithTag.length >= 10 && entriesWithoutTag.length >= 10) {
        confidence = 'high';
      } else if (entriesWithTag.length >= 5 && entriesWithoutTag.length >= 5) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      driverResults.push({
        tag,
        occurrences: entriesWithTag.length,
        mcImpact: parseFloat(mcImpact.toFixed(3)),
        dssImpact: parseFloat(dssImpact.toFixed(3)),
        avgMCWith: parseFloat(avgMCWith.toFixed(3)),
        avgMCWithout: parseFloat(avgMCWithout.toFixed(3)),
        avgDSSWith: parseFloat(avgDSSWith.toFixed(3)),
        avgDSSWithout: parseFloat(avgDSSWithout.toFixed(3)),
        confidence
      });
    }

    // Sort by absolute MC impact (strongest effects first)
    return driverResults.sort((a, b) => Math.abs(b.mcImpact) - Math.abs(a.mcImpact));
  } catch (error) {
    console.error('Driver analysis failed:', error);
    return [];
  }
}

/**
 * Generate power hours analysis (7x24 matrix of productivity scores)
 */
export function generatePowerHours(entries: MoodEntry[]): PowerHoursResult {
  try {
    // Initialize 7x24 matrix (weekday x hour)
    const matrix: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));
    const counts: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

    // Process each entry
    entries.forEach(entry => {
      const entryDate = new Date(entry.timestamp);
      const weekday = entryDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hour = entryDate.getHours();

      // Calculate productivity score (simplified MC)
      const mcResult = calculateMC(entry, entries);
      const productivityScore = Math.max(0, Math.min(5, mcResult.mc + 3)); // Normalize to 0-5 scale

      matrix[weekday]![hour]! += productivityScore;
      counts[weekday]![hour]!++;
    });

    // Calculate averages
    for (let weekday = 0; weekday < 7; weekday++) {
      for (let hour = 0; hour < 24; hour++) {
        if (counts[weekday]![hour]! > 0) {
          matrix[weekday]![hour]! = matrix[weekday]![hour]! / counts[weekday]![hour]!;
        }
      }
    }

    // Find peak and low hours
    const allHours: Array<{ weekday: number; hour: number; score: number }> = [];
    
    for (let weekday = 0; weekday < 7; weekday++) {
      for (let hour = 0; hour < 24; hour++) {
        if (counts[weekday]![hour]! > 0) {
          allHours.push({
            weekday,
            hour,
            score: matrix[weekday]![hour]!
          });
        }
      }
    }

    // Sort by score
    allHours.sort((a, b) => b.score - a.score);

    // Get top 10% as peak hours and bottom 10% as low hours
    const peakCount = Math.max(1, Math.floor(allHours.length * 0.1));
    const lowCount = Math.max(1, Math.floor(allHours.length * 0.1));

    const peakHours = allHours.slice(0, peakCount);
    const lowHours = allHours.slice(-lowCount).reverse();

    return {
      matrix,
      peakHours,
      lowHours,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('Power hours generation failed:', error);
    return {
      matrix: Array(7).fill(null).map(() => Array(24).fill(0)),
      peakHours: [],
      lowHours: [],
      lastUpdated: new Date()
    };
  }
}

/**
 * Calculate all scores for an entry
 */
export function calculateAllScores(
  entry: MoodEntry,
  historicalEntries: MoodEntry[]
): {
  mc: MCCalculationResult;
  dss: DSSCalculationResult;
  streak: StreakResult;
} {
  const allEntries = [...historicalEntries, entry];
  
  return {
    mc: calculateMC(entry, historicalEntries, entry.timeBucket),
    dss: calculateDSS(entry, historicalEntries),
    streak: calculateStreak(allEntries)
  };
}

/**
 * Validate scoring configuration
 */
export function validateScoringConfig(): boolean {
  try {
    // Check that weights sum to 1.0 for MC
    const mcWeightSum = Object.values(SCORING_CONFIG.MC_WEIGHTS).reduce((sum, weight) => sum + Math.abs(weight), 0);
    if (Math.abs(mcWeightSum - 1.0) > 0.001) {
      console.error('MC weights do not sum to 1.0:', mcWeightSum);
      return false;
    }

    // Check that weights sum to 1.0 for DSS
    const dssWeightSum = Object.values(SCORING_CONFIG.DSS_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(dssWeightSum - 1.0) > 0.001) {
      console.error('DSS weights do not sum to 1.0:', dssWeightSum);
      return false;
    }

    // Check sigma floor is positive
    if (SCORING_CONFIG.SIGMA_FLOOR <= 0) {
      console.error('Sigma floor must be positive:', SCORING_CONFIG.SIGMA_FLOOR);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Scoring configuration validation failed:', error);
    return false;
  }
}

// Export configuration for testing
export { SCORING_CONFIG };