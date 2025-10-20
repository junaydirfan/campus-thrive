/**
 * CampusThrive Storage Management System
 * 
 * This module provides comprehensive localStorage management with:
 * - TypeScript generics for type safety
 * - Automatic JSON serialization/deserialization
 * - Error handling and data validation
 * - Migration system for data structure changes
 * - Export/import functionality
 * - Data expiration and cleanup
 * - Test data generation
 */

import type { 
  MoodEntry, 
  ComputedScores, 
  DriverAnalysis, 
  PowerHourHeatmap, 
  CoachTip, 
  AppSettings,
  JSONExportData,
  CSVExportData,
  TimeBucket
} from '@/types';

/**
 * Storage configuration and constants
 */
export const STORAGE_CONFIG = {
  // Data retention settings
  MOOD_ENTRIES_RETENTION_DAYS: 14,
  COMPUTED_SCORES_RETENTION_DAYS: 30,
  
  // Storage keys
  KEYS: {
    MOOD_ENTRIES: 'campus-thrive-mood-entries',
    COMPUTED_SCORES: 'campus-thrive-computed-scores',
    DRIVER_ANALYSIS: 'campus-thrive-driver-analysis',
    POWER_HOUR_HEATMAP: 'campus-thrive-power-hour-heatmap',
    COACH_TIPS: 'campus-thrive-coach-tips',
    SETTINGS: 'campus-thrive-settings',
    APP_STATE: 'campus-thrive-app-state',
    MIGRATION_VERSION: 'campus-thrive-migration-version',
  },
  
  // Current data version for migrations
  CURRENT_VERSION: '1.0.0',
  
  // Storage quota limits (in bytes)
  MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
  CLEANUP_THRESHOLD: 4 * 1024 * 1024, // 4MB
} as const;

/**
 * Storage error types
 */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: 'QUOTA_EXCEEDED' | 'INVALID_DATA' | 'MIGRATION_FAILED' | 'IMPORT_FAILED' | 'EXPORT_FAILED',
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Storage result type for operations that might fail
 */
export type StorageResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: StorageError;
};

/**
 * Data validation schemas
 */
export const validateMoodEntry = (data: unknown): data is MoodEntry => {
  if (!data || typeof data !== 'object') return false;
  const entry = data as Record<string, unknown>;
  
  return (
    typeof entry.id === 'string' &&
    entry.timestamp instanceof Date &&
    typeof entry.timeBucket === 'string' && ['Morning', 'Midday', 'Evening', 'Night'].includes(entry.timeBucket) &&
    typeof entry.valence === 'number' && entry.valence >= 0 && entry.valence <= 5 &&
    typeof entry.energy === 'number' && entry.energy >= 0 && entry.energy <= 5 &&
    typeof entry.focus === 'number' && entry.focus >= 0 && entry.focus <= 5 &&
    typeof entry.stress === 'number' && entry.stress >= 0 && entry.stress <= 5 &&
    Array.isArray(entry.tags) && entry.tags.every((tag: unknown) => typeof tag === 'string')
  );
};

export const validateComputedScores = (data: unknown): data is ComputedScores => {
  if (!data || typeof data !== 'object') return false;
  const scores = data as Record<string, unknown>;
  
  return (
    typeof scores.MC === 'number' &&
    typeof scores.DSS === 'number' &&
    typeof scores.LM === 'number' &&
    typeof scores.RI === 'number' &&
    typeof scores.CN === 'number'
  );
};

export const validateAppSettings = (data: unknown): data is AppSettings => {
  if (!data || typeof data !== 'object') return false;
  const settings = data as Record<string, unknown>;
  
  return (
    typeof settings.theme === 'string' && ['light', 'dark', 'system'].includes(settings.theme) &&
    typeof settings.defaultTimeBucket === 'string' && ['Morning', 'Midday', 'Evening', 'Night'].includes(settings.defaultTimeBucket) &&
    typeof settings.showCoachTips === 'boolean' &&
    typeof settings.notifications === 'object' &&
    typeof settings.dataRetention === 'object' &&
    typeof settings.privacy === 'object'
  );
};

/**
 * Core storage utilities
 */
export class StorageManager {
  /**
   * Check if localStorage is available
   */
  static isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static getStorageInfo(): { used: number; available: number; percentage: number } {
    if (!this.isAvailable()) {
      return { used: 0, available: 0, percentage: 0 };
    }

    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }

    const available = STORAGE_CONFIG.MAX_STORAGE_SIZE - used;
    const percentage = (used / STORAGE_CONFIG.MAX_STORAGE_SIZE) * 100;

    return { used, available, percentage };
  }

  /**
   * Generic storage getter with validation
   */
  static getItem<T>(
    key: string, 
    validator: (data: unknown) => data is T,
    defaultValue: T
  ): StorageResult<T> {
    try {
      if (!this.isAvailable()) {
        return { success: true, data: defaultValue };
      }

      const item = localStorage.getItem(key);
      if (!item) {
        return { success: true, data: defaultValue };
      }

      const parsed = JSON.parse(item);
      
      // Handle date deserialization
      if (parsed && typeof parsed === 'object') {
        this.deserializeDates(parsed);
      }

      if (validator(parsed)) {
        return { success: true, data: parsed };
      } else {
        console.warn(`Invalid data format for key ${key}, using default value`);
        return { success: true, data: defaultValue };
      }
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error);
      return { 
        success: false, 
        error: new StorageError(
          `Failed to read data for key ${key}`,
          'INVALID_DATA',
          error as Error
        )
      };
    }
  }

  /**
   * Generic storage setter with error handling
   */
  static setItem<T>(key: string, value: T): StorageResult<void> {
    try {
      if (!this.isAvailable()) {
        throw new Error('localStorage is not available');
      }

      // Check storage quota before writing
      const currentSize = this.getStorageInfo().used;
      const serialized = JSON.stringify(value);
      const newSize = currentSize + serialized.length;

      if (newSize > STORAGE_CONFIG.MAX_STORAGE_SIZE) {
        throw new StorageError(
          'Storage quota exceeded. Please clean up old data.',
          'QUOTA_EXCEEDED'
        );
      }

      localStorage.setItem(key, serialized);
      return { success: true, data: undefined };
    } catch (error) {
      if (error instanceof StorageError) {
        return { success: false, error };
      }
      
      return { 
        success: false, 
        error: new StorageError(
          `Failed to save data for key ${key}`,
          'QUOTA_EXCEEDED',
          error as Error
        )
      };
    }
  }

  /**
   * Remove item from storage
   */
  static removeItem(key: string): void {
    if (this.isAvailable()) {
      localStorage.removeItem(key);
    }
  }

  /**
   * Clear all CampusThrive data
   */
  static clearAll(): void {
    if (!this.isAvailable()) return;

    Object.values(STORAGE_CONFIG.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Deserialize dates in objects
   */
  private static deserializeDates(obj: Record<string, unknown>): void {
    if (!obj || typeof obj !== 'object') return;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'string' && this.isISODateString(value)) {
          obj[key] = new Date(value);
        } else if (Array.isArray(value)) {
          value.forEach(item => this.deserializeDates(item as Record<string, unknown>));
        } else if (value && typeof value === 'object') {
          this.deserializeDates(value as Record<string, unknown>);
        }
      }
    }
  }

  /**
   * Check if string is ISO date format
   */
  private static isISODateString(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(str);
  }

  /**
   * Clean up expired data
   */
  static cleanupExpiredData(): { removed: number; freed: number } {
    let removed = 0;
    let freed = 0;

    try {
      // Clean up mood entries older than retention period
      const moodEntriesResult = this.getItem(
        STORAGE_CONFIG.KEYS.MOOD_ENTRIES,
        (data): data is MoodEntry[] => Array.isArray(data) && data.every(validateMoodEntry),
        []
      );

      if (moodEntriesResult.success) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - STORAGE_CONFIG.MOOD_ENTRIES_RETENTION_DAYS);

        const originalLength = moodEntriesResult.data.length;
        const filteredEntries = moodEntriesResult.data.filter(entry => 
          new Date(entry.timestamp) >= cutoffDate
        );

        if (filteredEntries.length < originalLength) {
          removed += originalLength - filteredEntries.length;
          this.setItem(STORAGE_CONFIG.KEYS.MOOD_ENTRIES, filteredEntries);
          
          // Calculate freed space (rough estimate)
          freed += (originalLength - filteredEntries.length) * 200; // ~200 bytes per entry
        }
      }

      // Clean up computed scores older than retention period
      const scoresResult = this.getItem(
        STORAGE_CONFIG.KEYS.COMPUTED_SCORES,
        (data): data is ComputedScores[] => Array.isArray(data) && data.every(validateComputedScores),
        []
      );

      if (scoresResult.success) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - STORAGE_CONFIG.COMPUTED_SCORES_RETENTION_DAYS);

        const originalLength = scoresResult.data.length;
        const filteredScores = scoresResult.data.filter((_score, index) => {
          // For computed scores, we'll keep them if they're recent enough
          // This is a simplified approach - in practice, you'd want to track dates
          return index >= originalLength - 30; // Keep last 30 entries
        });

        if (filteredScores.length < originalLength) {
          removed += originalLength - filteredScores.length;
          this.setItem(STORAGE_CONFIG.KEYS.COMPUTED_SCORES, filteredScores);
          freed += (originalLength - filteredScores.length) * 100; // ~100 bytes per score
        }
      }

    } catch (error) {
      console.error('Error during cleanup:', error);
    }

    return { removed, freed };
  }

  /**
   * Force cleanup when storage is near capacity
   */
  static forceCleanup(): { removed: number; freed: number } {
    const info = this.getStorageInfo();
    
    if (info.percentage < 80) {
      return { removed: 0, freed: 0 };
    }

    // More aggressive cleanup
    let removed = 0;
    let freed = 0;

    try {
      // Remove oldest 25% of mood entries
      const moodEntriesResult = this.getItem(
        STORAGE_CONFIG.KEYS.MOOD_ENTRIES,
        (data): data is MoodEntry[] => Array.isArray(data) && data.every(validateMoodEntry),
        []
      );

      if (moodEntriesResult.success && moodEntriesResult.data.length > 10) {
        const keepCount = Math.floor(moodEntriesResult.data.length * 0.75);
        const filteredEntries = moodEntriesResult.data.slice(-keepCount);
        
        removed += moodEntriesResult.data.length - filteredEntries.length;
        this.setItem(STORAGE_CONFIG.KEYS.MOOD_ENTRIES, filteredEntries);
        freed += (moodEntriesResult.data.length - filteredEntries.length) * 200;
      }

    } catch (error) {
      console.error('Error during force cleanup:', error);
    }

    return { removed, freed };
  }
}

/**
 * Migration system for data structure changes
 */
export class MigrationManager {
  private static migrations: Record<string, (data: Record<string, unknown>) => Record<string, unknown>> = {
    '1.0.0': (data: Record<string, unknown>) => {
      // Initial migration - ensure all required fields exist
      if (data.moodEntries && Array.isArray(data.moodEntries)) {
        data.moodEntries = data.moodEntries.map((entry: Record<string, unknown>) => ({
          ...entry,
          timestamp: entry.timestamp ? new Date(entry.timestamp as string) : new Date(),
          id: entry.id || `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        }));
      }
      return data;
    },
  };

  static migrate(data: Record<string, unknown>, fromVersion: string, toVersion: string): Record<string, unknown> {
    if (fromVersion === toVersion) {
      return data;
    }

    let migratedData = { ...data };
    
    // Apply migrations in order
    const versions = Object.keys(this.migrations).sort();
    const fromIndex = versions.indexOf(fromVersion);
    const toIndex = versions.indexOf(toVersion);

    if (fromIndex === -1 || toIndex === -1) {
      throw new StorageError(
        `Invalid migration version: ${fromVersion} -> ${toVersion}`,
        'MIGRATION_FAILED'
      );
    }

    for (let i = fromIndex + 1; i <= toIndex; i++) {
      const version = versions[i];
      if (version && this.migrations[version]) {
        migratedData = this.migrations[version](migratedData);
      }
    }

    return migratedData;
  }

  static getCurrentVersion(): string {
    return STORAGE_CONFIG.CURRENT_VERSION;
  }

  static getStoredVersion(): string {
    if (!StorageManager.isAvailable()) {
      return STORAGE_CONFIG.CURRENT_VERSION;
    }

    const version = localStorage.getItem(STORAGE_CONFIG.KEYS.MIGRATION_VERSION);
    return version || '0.0.0';
  }

  static setStoredVersion(version: string): void {
    if (StorageManager.isAvailable()) {
      localStorage.setItem(STORAGE_CONFIG.KEYS.MIGRATION_VERSION, version);
    }
  }
}

/**
 * Export/Import functionality
 */
export class DataExporter {
  /**
   * Export all data as JSON
   */
  static exportToJSON(): StorageResult<JSONExportData> {
    try {
      const moodEntriesResult = StorageManager.getItem(
        STORAGE_CONFIG.KEYS.MOOD_ENTRIES,
        (data): data is MoodEntry[] => Array.isArray(data) && data.every(validateMoodEntry),
        []
      );

      const computedScoresResult = StorageManager.getItem(
        STORAGE_CONFIG.KEYS.COMPUTED_SCORES,
        (data): data is ComputedScores[] => Array.isArray(data) && data.every(validateComputedScores),
        []
      );

      const driverAnalysisResult = StorageManager.getItem(
        STORAGE_CONFIG.KEYS.DRIVER_ANALYSIS,
        (data): data is DriverAnalysis => data !== null && typeof data === 'object',
        null as DriverAnalysis | null
      );

      const powerHourHeatmapResult = StorageManager.getItem(
        STORAGE_CONFIG.KEYS.POWER_HOUR_HEATMAP,
        (data): data is PowerHourHeatmap => data !== null && typeof data === 'object',
        null as PowerHourHeatmap | null
      );

      const coachTipsResult = StorageManager.getItem(
        STORAGE_CONFIG.KEYS.COACH_TIPS,
        (data): data is CoachTip[] => Array.isArray(data),
        []
      );

      if (!moodEntriesResult.success || !computedScoresResult.success) {
        throw new StorageError('Failed to read data for export', 'EXPORT_FAILED');
      }

      const exportData: JSONExportData = {
        moodEntries: moodEntriesResult.data,
        computedScores: computedScoresResult.data,
        coachTips: coachTipsResult.success ? coachTipsResult.data : [],
        metadata: {
          exportDate: new Date().toISOString(),
          totalEntries: moodEntriesResult.data.length,
          dateRange: this.getDateRange(moodEntriesResult.data),
          version: STORAGE_CONFIG.CURRENT_VERSION,
          appVersion: '1.0.0',
        },
      };

      if (driverAnalysisResult.success && driverAnalysisResult.data !== null) {
        exportData.driverAnalysis = driverAnalysisResult.data;
      }

      if (powerHourHeatmapResult.success && powerHourHeatmapResult.data !== null) {
        exportData.powerHourHeatmap = powerHourHeatmapResult.data;
      }

      return { success: true, data: exportData };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'Failed to export data to JSON',
          'EXPORT_FAILED',
          error as Error
        ),
      };
    }
  }

  /**
   * Export data as CSV
   */
  static exportToCSV(): StorageResult<CSVExportData> {
    try {
      const moodEntriesResult = StorageManager.getItem(
        STORAGE_CONFIG.KEYS.MOOD_ENTRIES,
        (data): data is MoodEntry[] => Array.isArray(data) && data.every(validateMoodEntry),
        []
      );

      const computedScoresResult = StorageManager.getItem(
        STORAGE_CONFIG.KEYS.COMPUTED_SCORES,
        (data): data is ComputedScores[] => Array.isArray(data) && data.every(validateComputedScores),
        []
      );

      if (!moodEntriesResult.success || !computedScoresResult.success) {
        throw new StorageError('Failed to read data for CSV export', 'EXPORT_FAILED');
      }

      const csvData: CSVExportData = {
        moodEntries: moodEntriesResult.data.map(entry => ({
          id: entry.id,
          timestamp: entry.timestamp.toISOString(),
          timeBucket: entry.timeBucket,
          valence: entry.valence,
          energy: entry.energy,
          focus: entry.focus,
          stress: entry.stress,
          tags: entry.tags.join(','),
          ...(entry.deepworkMinutes !== undefined && { deepworkMinutes: entry.deepworkMinutes }),
          ...(entry.tasksCompleted !== undefined && { tasksCompleted: entry.tasksCompleted }),
          ...(entry.sleepHours !== undefined && { sleepHours: entry.sleepHours }),
          ...(entry.recoveryAction !== undefined && { recoveryAction: entry.recoveryAction }),
          ...(entry.socialTouchpoints !== undefined && { socialTouchpoints: entry.socialTouchpoints }),
        })),
        dailyScores: computedScoresResult.data.map((score, index) => {
          const date = new Date(Date.now() - (computedScoresResult.data.length - index - 1) * 24 * 60 * 60 * 1000);
          return {
            date: date.toISOString().split('T')[0]!,
            MC: score.MC,
            DSS: score.DSS,
            LM: score.LM,
            RI: score.RI,
            CN: score.CN,
          };
        }),
        metadata: {
          exportDate: new Date().toISOString(),
          totalEntries: moodEntriesResult.data.length,
          dateRange: this.getDateRange(moodEntriesResult.data),
          version: STORAGE_CONFIG.CURRENT_VERSION,
        },
      };

      return { success: true, data: csvData };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'Failed to export data to CSV',
          'EXPORT_FAILED',
          error as Error
        ),
      };
    }
  }

  /**
   * Generate CSV string for download
   */
  static generateCSVString(csvData: CSVExportData): string {
    const headers = [
      'ID', 'Timestamp', 'Time Bucket', 'Valence', 'Energy', 'Focus', 'Stress',
      'Tags', 'Deep Work Minutes', 'Tasks Completed', 'Sleep Hours',
      'Recovery Action', 'Social Touchpoints'
    ];

    const rows = csvData.moodEntries.map(entry => [
      entry.id,
      entry.timestamp,
      entry.timeBucket,
      entry.valence,
      entry.energy,
      entry.focus,
      entry.stress,
      entry.tags,
      entry.deepworkMinutes || '',
      entry.tasksCompleted || '',
      entry.sleepHours || '',
      entry.recoveryAction || '',
      entry.socialTouchpoints || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private static getDateRange(entries: MoodEntry[]): { start: string; end: string } {
    if (entries.length === 0) {
      const now = new Date().toISOString();
      return { start: now, end: now };
    }

    const dates = entries.map(entry => new Date(entry.timestamp));
    const start = new Date(Math.min(...dates.map(d => d.getTime())));
    const end = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }
}

/**
 * Data import functionality
 */
export class DataImporter {
  /**
   * Import JSON data
   */
  static importFromJSON(jsonData: JSONExportData, options: {
    mergeMode: 'merge' | 'replace';
    skipDuplicates: boolean;
    preserveSettings: boolean;
  }): StorageResult<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const errors: string[] = [];
      let imported = 0;
      let skipped = 0;

      // Validate import data
      if (!jsonData.moodEntries || !Array.isArray(jsonData.moodEntries)) {
        errors.push('Invalid mood entries data');
      }

      if (!jsonData.computedScores || !Array.isArray(jsonData.computedScores)) {
        errors.push('Invalid computed scores data');
      }

      if (errors.length > 0) {
        return {
          success: false,
          error: new StorageError(
            'Invalid import data format',
            'IMPORT_FAILED'
          ),
        };
      }

      // Import mood entries
      if (options.mergeMode === 'replace') {
        StorageManager.setItem(STORAGE_CONFIG.KEYS.MOOD_ENTRIES, jsonData.moodEntries);
        imported += jsonData.moodEntries.length;
      } else {
        const existingResult = StorageManager.getItem(
          STORAGE_CONFIG.KEYS.MOOD_ENTRIES,
          (data): data is MoodEntry[] => Array.isArray(data) && data.every(validateMoodEntry),
          []
        );

        if (existingResult.success) {
          const existingIds = new Set(existingResult.data.map(entry => entry.id));
          const newEntries = jsonData.moodEntries.filter(entry => 
            !existingIds.has(entry.id) || !options.skipDuplicates
          );

          const mergedEntries = [...existingResult.data, ...newEntries];
          StorageManager.setItem(STORAGE_CONFIG.KEYS.MOOD_ENTRIES, mergedEntries);
          imported += newEntries.length;
          skipped += jsonData.moodEntries.length - newEntries.length;
        }
      }

      // Import computed scores
      if (options.mergeMode === 'replace') {
        StorageManager.setItem(STORAGE_CONFIG.KEYS.COMPUTED_SCORES, jsonData.computedScores);
      } else {
        const existingResult = StorageManager.getItem(
          STORAGE_CONFIG.KEYS.COMPUTED_SCORES,
          (data): data is ComputedScores[] => Array.isArray(data) && data.every(validateComputedScores),
          []
        );

        if (existingResult.success) {
          const mergedScores = [...existingResult.data, ...jsonData.computedScores];
          StorageManager.setItem(STORAGE_CONFIG.KEYS.COMPUTED_SCORES, mergedScores);
        }
      }

      // Import other data if available
      if (jsonData.driverAnalysis) {
        StorageManager.setItem(STORAGE_CONFIG.KEYS.DRIVER_ANALYSIS, jsonData.driverAnalysis);
      }

      if (jsonData.powerHourHeatmap) {
        StorageManager.setItem(STORAGE_CONFIG.KEYS.POWER_HOUR_HEATMAP, jsonData.powerHourHeatmap);
      }

      if (jsonData.coachTips && jsonData.coachTips.length > 0) {
        StorageManager.setItem(STORAGE_CONFIG.KEYS.COACH_TIPS, jsonData.coachTips);
      }

      return { success: true, data: { imported, skipped, errors } };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'Failed to import data',
          'IMPORT_FAILED',
          error as Error
        ),
      };
    }
  }

  /**
   * Validate import data
   */
  static validateImportData(data: unknown): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object');
      return { isValid: false, errors };
    }

    const importData = data as Record<string, unknown>;

    // Check required fields
    if (!importData.moodEntries || !Array.isArray(importData.moodEntries)) {
      errors.push('Missing or invalid moodEntries array');
    } else {
      importData.moodEntries.forEach((entry: unknown, index: number) => {
        if (!validateMoodEntry(entry)) {
          errors.push(`Invalid mood entry at index ${index}`);
        }
      });
    }

    if (!importData.computedScores || !Array.isArray(importData.computedScores)) {
      errors.push('Missing or invalid computedScores array');
    } else {
      importData.computedScores.forEach((score: unknown, index: number) => {
        if (!validateComputedScores(score)) {
          errors.push(`Invalid computed score at index ${index}`);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Test data generation for development
 */
export class TestDataGenerator {
  /**
   * Generate historical mood entries for testing
   */
  static generateHistoricalMoodEntries(daysBack: number = 14): MoodEntry[] {
    const entries: MoodEntry[] = [];
    const timeBuckets: Array<'Morning' | 'Midday' | 'Evening' | 'Night'> = ['Morning', 'Midday', 'Evening', 'Night'];
    const commonTags = [
      'studying', 'coffee', 'exercise', 'good-sleep', 'stressful', 'productive',
      'social', 'tired', 'focused', 'distracted', 'motivated', 'anxious',
      'relaxed', 'energetic', 'sleepy', 'hungry', 'caffeine', 'music'
    ];

    for (let day = 0; day < daysBack; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);

      // Generate 1-3 entries per day
      const entriesPerDay = Math.floor(Math.random() * 3) + 1;
      const usedTimeBuckets = new Set<string>();

      for (let entry = 0; entry < entriesPerDay; entry++) {
        let timeBucket: 'Morning' | 'Midday' | 'Evening' | 'Night';
        do {
          const randomIndex = Math.floor(Math.random() * timeBuckets.length);
          timeBucket = timeBuckets[randomIndex]!;
        } while (usedTimeBuckets.has(timeBucket) && usedTimeBuckets.size < timeBuckets.length);

        usedTimeBuckets.add(timeBucket);

        // Generate realistic mood data
        const baseValence = 3 + Math.random() * 2; // 3-5 range
        const baseEnergy = 2 + Math.random() * 3; // 2-5 range
        const baseFocus = 2 + Math.random() * 3; // 2-5 range
        const baseStress = Math.random() * 3; // 0-3 range

        // Adjust based on time of day
        let valence = baseValence;
        let energy = baseEnergy;
        let focus = baseFocus;
        let stress = baseStress;

        switch (timeBucket) {
          case 'Morning':
            energy += 0.5;
            focus += 0.3;
            stress -= 0.2;
            break;
          case 'Midday':
            valence += 0.2;
            energy += 0.3;
            break;
          case 'Evening':
            energy -= 0.3;
            stress += 0.2;
            break;
          case 'Night':
            energy -= 0.5;
            focus -= 0.3;
            stress += 0.3;
            break;
        }

        // Generate tags
        const numTags = Math.floor(Math.random() * 4) + 1;
        const selectedTags = commonTags
          .sort(() => Math.random() - 0.5)
          .slice(0, numTags);

        // Generate optional fields
        const deepworkMinutes = Math.random() > 0.3 ? Math.floor(Math.random() * 120) + 15 : undefined;
        const tasksCompleted = Math.random() > 0.2 ? Math.floor(Math.random() * 8) + 1 : undefined;
        const sleepHours = Math.random() > 0.1 ? 6 + Math.random() * 3 : undefined;
        const recoveryAction = Math.random() > 0.6;
        const socialTouchpoints = Math.random() > 0.4 ? Math.floor(Math.random() * 5) + 1 : undefined;

        const moodEntry: MoodEntry = {
          id: `test_entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(date.getTime() + Math.random() * 24 * 60 * 60 * 1000),
          timeBucket,
          valence: Math.max(0, Math.min(5, Math.round(valence * 10) / 10)),
          energy: Math.max(0, Math.min(5, Math.round(energy * 10) / 10)),
          focus: Math.max(0, Math.min(5, Math.round(focus * 10) / 10)),
          stress: Math.max(0, Math.min(5, Math.round(stress * 10) / 10)),
          tags: selectedTags,
          ...(deepworkMinutes !== undefined && { deepworkMinutes }),
          ...(tasksCompleted !== undefined && { tasksCompleted }),
          ...(sleepHours !== undefined && { sleepHours }),
          ...(recoveryAction !== undefined && { recoveryAction }),
          ...(socialTouchpoints !== undefined && { socialTouchpoints }),
        };

        entries.push(moodEntry);
      }
    }

    return entries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Generate computed scores for mood entries
   */
  static generateComputedScores(moodEntries: MoodEntry[]): ComputedScores[] {
    const scores: ComputedScores[] = [];
    const dailyEntries = new Map<string, MoodEntry[]>();

    // Group entries by date
    moodEntries.forEach(entry => {
      const dateKey = entry.timestamp.toISOString().split('T')[0];
      if (dateKey) {
        if (!dailyEntries.has(dateKey)) {
          dailyEntries.set(dateKey, []);
        }
        dailyEntries.get(dateKey)!.push(entry);
      }
    });

    // Generate scores for each day
    dailyEntries.forEach((entries) => {
      const avgValence = entries.reduce((sum, e) => sum + e.valence, 0) / entries.length;
      const avgEnergy = entries.reduce((sum, e) => sum + e.energy, 0) / entries.length;
      const avgFocus = entries.reduce((sum, e) => sum + e.focus, 0) / entries.length;
      const avgStress = entries.reduce((sum, e) => sum + e.stress, 0) / entries.length;

      const MC = (avgValence + avgEnergy + avgFocus - avgStress) / 4;
      const DSS = (entries.reduce((sum, e) => sum + (e.tasksCompleted || 0), 0) * 0.4) +
                 (entries.reduce((sum, e) => sum + (e.deepworkMinutes || 0), 0) * 0.01) +
                 (MC * 0.3);
      const LM = avgFocus + (entries.reduce((sum, e) => sum + (e.deepworkMinutes || 0), 0) * 0.1);
      const RI = (entries.reduce((sum, e) => sum + (e.sleepHours || 0), 0) * 0.3) +
                 (entries.filter(e => e.recoveryAction).length * 0.2) +
                 ((5 - avgStress) * 0.1);
      const CN = (entries.reduce((sum, e) => sum + (e.socialTouchpoints || 0), 0) * 0.1) +
                 (avgValence > 3 ? 0.2 : 0);

      scores.push({
        MC: Math.max(-1.25, Math.min(5, MC)),
        DSS: Math.max(0, DSS),
        LM: Math.max(0, LM),
        RI: Math.max(0, Math.min(5, RI)),
        CN: Math.max(0, CN),
      });
    });

    return scores;
  }

  /**
   * Generate sample driver analysis
   */
  static generateDriverAnalysis(moodEntries: MoodEntry[]): DriverAnalysis {
    const tagStats = new Map<string, { count: number; totalMC: number; entries: MoodEntry[] }>();

    moodEntries.forEach(entry => {
      const MC = (entry.valence + entry.energy + entry.focus - entry.stress) / 4;
      
      entry.tags.forEach(tag => {
        if (!tagStats.has(tag)) {
          tagStats.set(tag, { count: 0, totalMC: 0, entries: [] });
        }
        const stats = tagStats.get(tag)!;
        stats.count++;
        stats.totalMC += MC;
        stats.entries.push(entry);
      });
    });

    const helpfulTags = Array.from(tagStats.entries())
      .filter(([, stats]) => stats.count >= 3)
      .map(([tag, stats]) => ({
        tag,
        correlation: (stats.totalMC / stats.count) - 2.5, // Baseline MC
        mcImprovement: stats.totalMC / stats.count,
        occurrences: stats.count,
      }))
      .filter(item => item.correlation > 0.1)
      .sort((a, b) => b.correlation - a.correlation)
      .slice(0, 5);

    const harmfulTags = Array.from(tagStats.entries())
      .filter(([, stats]) => stats.count >= 3)
      .map(([tag, stats]) => ({
        tag,
        correlation: (stats.totalMC / stats.count) - 2.5,
        mcDecrease: 2.5 - (stats.totalMC / stats.count),
        occurrences: stats.count,
      }))
      .filter(item => item.correlation < -0.1)
      .sort((a, b) => a.correlation - b.correlation)
      .slice(0, 5);

    return {
      helpfulTags,
      harmfulTags,
      confidence: Math.min(1, moodEntries.length / 50), // Confidence based on sample size
      lastUpdated: new Date(),
    };
  }

  /**
   * Generate sample coach tips
   */
  static generateCoachTips(moodEntries: MoodEntry[]): CoachTip[] {
    const tips: CoachTip[] = [];
    
    // Analyze recent mood patterns
    const recentEntries = moodEntries.slice(-10);
    const avgStress = recentEntries.reduce((sum, e) => sum + e.stress, 0) / recentEntries.length;
    const avgSleep = recentEntries.reduce((sum, e) => sum + (e.sleepHours || 7), 0) / recentEntries.length;
    const avgSocial = recentEntries.reduce((sum, e) => sum + (e.socialTouchpoints || 0), 0) / recentEntries.length;

    if (avgStress > 3) {
      tips.push({
        id: `tip_${Date.now()}_stress`,
        conditions: [
          { score: 'stress', operator: '>=', value: 3 }
        ],
        priority: 'high',
        content: 'Consider taking breaks and practicing relaxation techniques. High stress can impact your focus and overall well-being.',
        category: 'stress_management',
        suggestedAction: 'Take a 5-minute break and practice deep breathing'
      });
    }

    if (avgSleep < 6) {
      tips.push({
        id: `tip_${Date.now()}_sleep`,
        conditions: [
          { score: 'sleepHours', operator: '<=', value: 6 }
        ],
        priority: 'high',
        content: 'Getting adequate sleep is crucial for academic performance. Aim for 7-9 hours of quality sleep each night.',
        category: 'sleep_recovery',
        suggestedAction: 'Create a consistent bedtime routine'
      });
    }

    if (avgSocial < 1) {
      tips.push({
        id: `tip_${Date.now()}_social`,
        conditions: [
          { score: 'socialTouchpoints', operator: '<=', value: 1 }
        ],
        priority: 'medium',
        content: 'Social connections are important for mental health. Try to engage with friends or classmates regularly.',
        category: 'social_connection',
        suggestedAction: 'Reach out to a friend or join a study group'
      });
    }

    return tips;
  }

  /**
   * Generate all test data and save to storage
   */
  static generateAndSaveTestData(daysBack: number = 14): StorageResult<{
    moodEntries: number;
    computedScores: number;
    coachTips: number;
  }> {
    try {
      const moodEntries = this.generateHistoricalMoodEntries(daysBack);
      const computedScores = this.generateComputedScores(moodEntries);
      const driverAnalysis = this.generateDriverAnalysis(moodEntries);
      const coachTips = this.generateCoachTips(moodEntries);

      // Save to storage
      const moodResult = StorageManager.setItem(STORAGE_CONFIG.KEYS.MOOD_ENTRIES, moodEntries);
      const scoresResult = StorageManager.setItem(STORAGE_CONFIG.KEYS.COMPUTED_SCORES, computedScores);
      StorageManager.setItem(STORAGE_CONFIG.KEYS.DRIVER_ANALYSIS, driverAnalysis);
      StorageManager.setItem(STORAGE_CONFIG.KEYS.COACH_TIPS, coachTips);

      if (!moodResult.success || !scoresResult.success) {
        throw new Error('Failed to save test data to storage');
      }

      return {
        success: true,
        data: {
          moodEntries: moodEntries.length,
          computedScores: computedScores.length,
          coachTips: coachTips.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new StorageError(
          'Failed to generate test data',
          'EXPORT_FAILED',
          error as Error
        ),
      };
    }
  }

  /**
   * Generate demo data for hackathon presentation
   */
  static generateDemoData(): MoodEntry[] {
    const entries: MoodEntry[] = [];
    const today = new Date();
    
    // Generate 14 days of demo data with clear patterns
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Create patterns for demo
      let baseMood = 3.0;
      let tags: string[] = [];
      
      if (i === 0) {
        // Today - great day
        baseMood = 4.2;
        tags = ['productive', 'motivated', 'study'];
      } else if (i === 1) {
        // Yesterday - good day
        baseMood = 3.8;
        tags = ['social', 'friends', 'gym'];
      } else if (i === 2) {
        // Day before - exam stress
        baseMood = 2.5;
        tags = ['exam', 'stress', 'study'];
      } else if (i < 7) {
        // This week - generally good
        baseMood = 3.2 + Math.random() * 0.8;
        tags = ['study', 'productive', 'coffee'];
      } else {
        // Last week - more varied
        baseMood = 2.8 + Math.random() * 1.0;
        tags = ['work', 'tired', 'assignment'];
      }
      
      const entry: MoodEntry = {
        id: `demo-${i}`,
        timestamp: date,
        timeBucket: this.getTimeBucket(Math.floor(Math.random() * 12) + 8),
        valence: Math.round((baseMood + (Math.random() - 0.5) * 0.6) * 10) / 10,
        energy: Math.round((baseMood + (Math.random() - 0.5) * 0.5) * 10) / 10,
        focus: Math.round((baseMood + (Math.random() - 0.5) * 0.4) * 10) / 10,
        stress: Math.round((5 - baseMood + (Math.random() - 0.5) * 0.6) * 10) / 10,
        tags,
        deepworkMinutes: Math.random() > 0.4 ? Math.floor(Math.random() * 120) + 60 : 0,
        tasksCompleted: Math.random() > 0.3 ? Math.floor(Math.random() * 6) + 2 : 0,
        sleepHours: Math.random() > 0.2 ? Math.floor(Math.random() * 3) + 7 : 0,
        recoveryAction: Math.random() > 0.5,
        socialTouchpoints: Math.random() > 0.4 ? Math.floor(Math.random() * 4) + 2 : 0
      };
      
      entries.push(entry);
    }
    
    return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Get time bucket based on hour
   */
  private static getTimeBucket(hour: number): TimeBucket {
    if (hour >= 5 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 17) return 'Midday';
    if (hour >= 17 && hour < 22) return 'Evening';
    return 'Night';
  }
}
