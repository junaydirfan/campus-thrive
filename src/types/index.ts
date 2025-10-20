/**
 * CampusThrive TypeScript Types and Interfaces
 * 
 * This file contains all the type definitions for the CampusThrive student wellness tracking app.
 * All data is stored locally in localStorage with no external server communication.
 */

/**
 * Time buckets for mood tracking throughout the day
 */
export type TimeBucket = 'Morning' | 'Midday' | 'Evening' | 'Night';

/**
 * Core mood entry interface representing a single mood check-in
 * 
 * @interface MoodEntry
 * @description The primary data structure for tracking student wellness metrics
 * throughout different times of the day. Each entry captures emotional state,
 * productivity metrics, and contextual information.
 */
export interface MoodEntry {
  /** Unique identifier for the mood entry */
  id: string;
  
  /** Timestamp when the mood entry was created */
  timestamp: Date;
  
  /** Time period of the day when the entry was logged */
  timeBucket: TimeBucket;
  
  /** 
   * Emotional valence (positivity/negativity) on a 0-5 scale
   * 0 = Very negative, 5 = Very positive
   */
  valence: number;
  
  /** 
   * Energy level on a 0-5 scale
   * 0 = Very low energy, 5 = Very high energy
   */
  energy: number;
  
  /** 
   * Focus/concentration level on a 0-5 scale
   * 0 = Very unfocused, 5 = Very focused
   */
  focus: number;
  
  /** 
   * Stress level on a 0-5 scale
   * 0 = No stress, 5 = Very stressed
   */
  stress: number;
  
  /** 
   * Array of contextual tags describing activities, situations, or factors
   * that may influence mood and performance
   */
  tags: string[];
  
  /** 
   * Optional: Minutes spent in deep work during this time period
   * Used for productivity tracking and focus analysis
   */
  deepworkMinutes?: number;
  
  /** 
   * Optional: Number of tasks completed during this time period
   * Helps track productivity and achievement
   */
  tasksCompleted?: number;
  
  /** 
   * Optional: Hours of sleep the previous night
   * Critical for recovery and performance analysis
   */
  sleepHours?: number;
  
  /** 
   * Optional: Whether a recovery action was taken (exercise, meditation, etc.)
   * Used for recovery index calculations
   */
  recoveryAction?: boolean;
  
  /** 
   * Optional: Number of social interactions or touchpoints
   * Used for connection and social wellness tracking
   */
  socialTouchpoints?: number;
}

/**
 * Computed scores interface for aggregated wellness metrics
 * 
 * @interface ComputedScores
 * @description Contains calculated wellness scores derived from mood entries
 * over various time periods (daily, weekly, monthly)
 */
export interface ComputedScores {
  /** 
   * Mood Composite Score (MC)
   * Calculated as: (valence + energy + focus - stress) / 4
   * Range: -1.25 to 5, where higher values indicate better overall mood
   */
  MC: number;
  
  /** 
   * Daily Success Score (DSS)
   * Calculated as: (tasksCompleted * 0.4) + (deepworkMinutes * 0.01) + (MC * 0.3)
   * Range: 0 to 10+, where higher values indicate more productive days
   */
  DSS: number;
  
  /** 
   * Learning Momentum (LM)
   * Calculated as: Average focus over last 7 days + (deepworkMinutes trend * 0.1)
   * Range: 0 to 5+, indicates sustained learning and focus capacity
   */
  LM: number;
  
  /** 
   * Recovery Index (RI)
   * Calculated as: (sleepHours * 0.3) + (recoveryActions * 0.2) + (stress reduction trend * 0.5)
   * Range: 0 to 5, where higher values indicate better recovery and resilience
   */
  RI: number;
  
  /** 
   * Connection Score (CN)
   * Calculated as: (socialTouchpoints * 0.1) + (positive social interactions * 0.2)
   * Range: 0 to 5+, measures social wellness and connectedness
   */
  CN: number;
}

/**
 * Driver analysis interface for identifying performance influencers
 * 
 * @interface DriverAnalysis
 * @description Analyzes which tags/activities help or hurt performance
 * based on correlation with mood and productivity metrics
 */
export interface DriverAnalysis {
  /** Tags that consistently correlate with improved performance */
  helpfulTags: {
    tag: string;
    /** Correlation strength (-1 to 1) */
    correlation: number;
    /** Average MC improvement when this tag is present */
    mcImprovement: number;
    /** Number of occurrences analyzed */
    occurrences: number;
  }[];
  
  /** Tags that consistently correlate with decreased performance */
  harmfulTags: {
    tag: string;
    /** Correlation strength (-1 to 1) */
    correlation: number;
    /** Average MC decrease when this tag is present */
    mcDecrease: number;
    /** Number of occurrences analyzed */
    occurrences: number;
  }[];
  
  /** 
   * Overall analysis confidence score (0-1)
   * Based on sample size and statistical significance
   */
  confidence: number;
  
  /** Last updated timestamp for the analysis */
  lastUpdated: Date;
}

/**
 * PowerHour heatmap data structure for productivity visualization
 * 
 * @interface PowerHourHeatmap
 * @description Represents productivity patterns across weekdays and hours
 * in a 7x24 matrix format for heatmap visualization
 */
export interface PowerHourHeatmap {
  /** 
   * Matrix of productivity scores [weekday][hour]
   * weekday: 0=Sunday, 1=Monday, ..., 6=Saturday
   * hour: 0-23 (24-hour format)
   * value: 0-5 productivity score
   */
  matrix: number[][];
  
  /** 
   * Peak productivity hours identified by the algorithm
   * Sorted by productivity score (highest first)
   */
  peakHours: {
    weekday: number;
    hour: number;
    score: number;
  }[];
  
  /** 
   * Low productivity hours that might need attention
   * Sorted by productivity score (lowest first)
   */
  lowHours: {
    weekday: number;
    hour: number;
    score: number;
  }[];
  
  /** Last updated timestamp for the heatmap data */
  lastUpdated: Date;
}

/**
 * Represents a personalized coach tip.
 */
export interface CoachTip {
  /**
   * Unique identifier for the tip.
   */
  id: string;
  /**
   * The content of the tip.
   */
  content: string;
  /**
   * Conditions that trigger this tip (e.g., { score: 'MC', operator: '<', value: 2 }).
   */
  conditions: {
    score: keyof ComputedScores | 'sleepHours' | 'stress' | 'valence' | 'energy' | 'focus' | 'socialTouchpoints' | 'recoveryAction';
    operator: '<' | '>' | '=' | '<=' | '>=';
    value: number;
  }[];
  /**
   * Priority level of the tip (e.g., 'high', 'medium', 'low').
   */
  priority: 'high' | 'medium' | 'low';
  /**
   * Category of the tip (e.g., 'productivity', 'stress_management', 'sleep').
   */
  category: string;
  /**
   * Estimated duration to complete the tip in minutes (1-10).
   */
  duration: number;
  /**
   * Optional: Suggested action related to the tip.
   */
  suggestedAction?: string;
  /**
   * Optional: Time contexts when this tip is most relevant.
   */
  timeContext?: string[];
  /**
   * Optional: Required tags for this tip to be relevant.
   */
  requiredTags?: string[];
  /**
   * Optional: Timestamp when the tip was last acknowledged by the user.
   */
  acknowledgedAt?: Date;
}

/**
 * Export data structure for CSV format
 * 
 * @interface CSVExportData
 * @description Flattened data structure optimized for CSV export
 * with all mood entries and computed scores
 */
export interface CSVExportData {
  /** Array of mood entries flattened for CSV rows */
  moodEntries: {
    id: string;
    timestamp: string; // ISO string format
    timeBucket: TimeBucket;
    valence: number;
    energy: number;
    focus: number;
    stress: number;
    tags: string; // Comma-separated string
    deepworkMinutes?: number;
    tasksCompleted?: number;
    sleepHours?: number;
    recoveryAction?: boolean;
    socialTouchpoints?: number;
  }[];
  
  /** Computed scores for each day */
  dailyScores: {
    date: string; // YYYY-MM-DD format
    MC: number;
    DSS: number;
    LM: number;
    RI: number;
    CN: number;
  }[];
  
  /** Export metadata */
  metadata: {
    exportDate: string;
    totalEntries: number;
    dateRange: {
      start: string;
      end: string;
    };
    version: string;
  };
}

/**
 * Export data structure for JSON format
 * 
 * @interface JSONExportData
 * @description Complete data structure for JSON export
 * preserving all relationships and metadata
 */
export interface JSONExportData {
  /** All mood entries with full data */
  moodEntries: MoodEntry[];
  
  /** Computed scores over time */
  computedScores: ComputedScores[];
  
  /** Driver analysis results */
  driverAnalysis?: DriverAnalysis;
  
  /** PowerHour heatmap data */
  powerHourHeatmap?: PowerHourHeatmap;
  
  /** Coach tips and recommendations */
  coachTips: CoachTip[];
  
  /** Export metadata */
  metadata: {
    exportDate: string;
    totalEntries: number;
    dateRange: {
      start: string;
      end: string;
    };
    version: string;
    appVersion: string;
  };
}

/**
 * Import data structure for data restoration
 * 
 * @interface ImportData
 * @description Structure for importing previously exported data
 * with validation and error handling
 */
export interface ImportData {
  /** The actual data to import */
  data: JSONExportData;
  
  /** Import validation results */
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    entriesToImport: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  
  /** Import options */
  options: {
    /** Whether to merge with existing data or replace */
    mergeMode: 'merge' | 'replace';
    /** Whether to skip duplicate entries */
    skipDuplicates: boolean;
    /** Whether to preserve existing settings */
    preserveSettings: boolean;
  };
}

/**
 * Application settings interface
 * 
 * @interface AppSettings
 * @description User preferences and application configuration
 */
export interface AppSettings {
  /** Theme preference */
  theme: 'light' | 'dark' | 'system';
  
  /** Default time bucket for new entries */
  defaultTimeBucket: TimeBucket;
  
  /** Whether to show coach tips */
  showCoachTips: boolean;
  
  /** Notification preferences */
  notifications: {
    moodReminders: boolean;
    coachTips: boolean;
    weeklyReports: boolean;
  };
  
  /** Data retention settings */
  dataRetention: {
    /** Days to keep mood entries (0 = forever) */
    moodEntriesDays: number;
    /** Days to keep computed scores (0 = forever) */
    scoresDays: number;
  };
  
  /** Privacy settings */
  privacy: {
    /** Whether to collect anonymous usage statistics */
    collectAnalytics: boolean;
    /** Whether to enable crash reporting */
    crashReporting: boolean;
  };
}

/**
 * Application state interface
 * 
 * @interface AppState
 * @description Complete application state structure
 */
export interface AppState {
  /** All mood entries */
  moodEntries: MoodEntry[];
  
  /** Computed scores */
  computedScores: ComputedScores[];
  
  /** Driver analysis */
  driverAnalysis: DriverAnalysis | null;
  
  /** PowerHour heatmap */
  powerHourHeatmap: PowerHourHeatmap | null;
  
  /** Coach tips */
  coachTips: CoachTip[];
  
  /** Application settings */
  settings: AppSettings;
  
  /** Last data sync timestamp */
  lastSync: Date;
  
  /** Application version */
  version: string;
}

/**
 * Utility types for common operations
 */

/** Type for mood entry creation (without id and timestamp) */
export type CreateMoodEntry = Omit<MoodEntry, 'id' | 'timestamp'>;

/** Type for mood entry updates (partial with required id) */
export type UpdateMoodEntry = Partial<Omit<MoodEntry, 'id' | 'timestamp'>> & { id: string };

/** Type for date range filtering */
export type DateRange = {
  start: Date;
  end: Date;
};

/** Type for mood entry filters */
export type MoodEntryFilters = {
  dateRange?: DateRange;
  timeBuckets?: TimeBucket[];
  tags?: string[];
  minValence?: number;
  maxValence?: number;
  minEnergy?: number;
  maxEnergy?: number;
  minFocus?: number;
  maxFocus?: number;
  minStress?: number;
  maxStress?: number;
};

/** Type for chart data points */
export type ChartDataPoint = {
  date: string;
  value: number;
  label?: string;
};

/** Type for trend analysis results */
export type TrendAnalysis = {
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // 0-1 scale
  confidence: number; // 0-1 scale
  period: 'daily' | 'weekly' | 'monthly';
};
