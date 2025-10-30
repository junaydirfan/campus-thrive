/**
 * CampusThrive Enhanced Export/Import Library
 * 
 * Features:
 * - CSV export with all entry data and calculated scores
 * - JSON export with complete data structure
 * - JSON import with validation and integrity checks
 * - Merge vs replace options
 * - Privacy controls and storage management
 */

import { MoodEntry, ComputedScores, DriverAnalysis, PowerHourHeatmap, CoachTip } from '@/types';
import { calculateDSS } from './scoring';

/**
 * Export data structure
 */
export interface ExportData {
  version: string;
  exportDate: string;
  moodEntries: MoodEntry[];
  computedScores: ComputedScores[];
  driverAnalysis: DriverAnalysis[];
  powerHourHeatmap: PowerHourHeatmap;
  coachTips: CoachTip[];
  settings: Record<string, any>;
  metadata: {
    totalEntries: number;
    dateRange: {
      start: string;
      end: string;
    };
    appVersion: string;
  };
}

/**
 * Import result interface
 */
export interface ImportResult {
  success: boolean;
  message: string;
  importedEntries: number;
  entries: MoodEntry[]; // Add the actual imported entries
  errors: string[];
  warnings: string[];
}

/**
 * Storage usage information
 */
export interface StorageUsage {
  totalSize: number;
  entryCount: number;
  oldestEntry: string | null;
  newestEntry: string | null;
}

/**
 * Enhanced CSV Exporter
 */
export class CSVExporter {
  /**
   * Export mood entries to CSV format
   */
  static exportMoodEntries(entries: MoodEntry[]): string {
    if (entries.length === 0) {
      return 'No data to export';
    }

    const headers = [
      'ID',
      'Timestamp',
      'Time Bucket',
      'Valence',
      'Energy',
      'Focus',
      'Stress',
      'Tags',
      'Deep Work Minutes',
      'Tasks Completed',
      'Sleep Hours',
      'Recovery Action',
      'Social Touchpoints',
      'MC Score',
      'DSS Score',
      'LM Score',
      'RI Score',
      'CN Score'
    ];

    const rows = entries.map((entry, idx) => {
      // Gather all previous entries (sorted) as historical context
      const entryDate = new Date(entry.timestamp);
      const historicalEntries = entries
        .filter((e, j) => j < idx && new Date(e.timestamp) < entryDate);
      
      const dssResult = calculateDSS(entry, historicalEntries);
      const cn = dssResult.components.cn.zScore;
      // Keep the rest using the old calculated values for MC, DSS, LM, RI
      const mc = this.calculateMC(entry);
      const dss = this.calculateDSS(entry);
      const lm = this.calculateLM(entry);
      const ri = this.calculateRI(entry);

      return [
        entry.id,
        entry.timestamp,
        entry.timeBucket,
        entry.valence,
        entry.energy,
        entry.focus,
        entry.stress,
        entry.tags.join('; '),
        entry.deepworkMinutes || '',
        entry.tasksCompleted || '',
        entry.sleepHours || '',
        entry.recoveryAction ? 'Yes' : 'No',
        entry.socialTouchpoints || '',
        mc.toFixed(2),
        dss.toFixed(2),
        lm.toFixed(2),
        ri.toFixed(2),
        cn.toFixed(2)
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Calculate MC (Mood Composite) score
   */
  private static calculateMC(entry: MoodEntry): number {
    return (entry.valence + entry.energy + entry.focus + (5 - entry.stress)) / 4;
  }

  /**
   * Calculate DSS (Daily Success Score)
   */
  private static calculateDSS(entry: MoodEntry): number {
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
   * Calculate LM (Learning Momentum)
   */
  private static calculateLM(entry: MoodEntry): number {
    const focus = entry.focus;
    const deepworkMinutes = entry.deepworkMinutes || 0;
    const tasksCompleted = entry.tasksCompleted || 0;
    
    const focusComponent = focus / 5;
    const deepworkComponent = Math.min(1, deepworkMinutes / 180);
    const tasksComponent = Math.min(1, tasksCompleted / 10);
    
    return (focusComponent * 0.5) + (deepworkComponent * 0.3) + (tasksComponent * 0.2);
  }

  /**
   * Calculate RI (Recovery Index)
   */
  private static calculateRI(entry: MoodEntry): number {
    const sleepHours = entry.sleepHours || 0;
    const recoveryAction = entry.recoveryAction ? 1 : 0;
    const stress = entry.stress;
    
    const sleepComponent = Math.min(1, sleepHours / 8);
    const recoveryComponent = recoveryAction;
    const stressComponent = (5 - stress) / 5;
    
    return (sleepComponent * 0.4) + (recoveryComponent * 0.3) + (stressComponent * 0.3);
  }

  /**
   * Download CSV file
   */
  static downloadCSV(csvContent: string, filename?: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `campus-thrive-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

/**
 * Enhanced JSON Exporter
 */
export class JSONExporter {
  /**
   * Export complete data structure to JSON
   */
  static exportCompleteData(
    moodEntries: MoodEntry[],
    computedScores: ComputedScores[] = [],
    driverAnalysis: DriverAnalysis[] = [],
    powerHourHeatmap: PowerHourHeatmap = { matrix: [], peakHours: [], lowHours: [], lastUpdated: new Date() },
    coachTips: CoachTip[] = [],
    settings: Record<string, any> = {}
  ): ExportData {
    const sortedEntries = [...moodEntries].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const exportData: ExportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      moodEntries: sortedEntries,
      computedScores,
      driverAnalysis,
      powerHourHeatmap,
      coachTips,
      settings,
      metadata: {
        totalEntries: moodEntries.length,
        dateRange: {
          start: sortedEntries.length > 0 ? String(sortedEntries[0]?.timestamp || '') : '',
          end: sortedEntries.length > 0 ? String(sortedEntries[sortedEntries.length - 1]?.timestamp || '') : ''
        },
        appVersion: '1.0.0'
      }
    };

    return exportData;
  }

  /**
   * Download JSON file
   */
  static downloadJSON(data: ExportData, filename?: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `campus-thrive-export-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

/**
 * Enhanced CSV Importer
 */
export class CSVImporter {
  /**
   * Import CSV data with validation
   */
  static async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      console.log('CSV Import: File content preview:', text.substring(0, 500));
      return this.parseCSV(text);
    } catch (error) {
      console.error('CSV Import Error:', error);
      return {
        success: false,
        message: 'Failed to read CSV file',
        importedEntries: 0,
        entries: [], // Add empty entries array
        errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Parse CSV content and convert to mood entries
   */
  private static parseCSV(csvContent: string): ImportResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const importedEntries: MoodEntry[] = [];

    try {
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        errors.push('CSV file must contain at least a header row and one data row');
        return {
          success: false,
          message: 'Invalid CSV format',
          importedEntries: 0,
          entries: [], // Add empty entries array
          errors,
          warnings
        };
      }

      const headers = this.parseCSVLine(lines[0]!);
      console.log('CSV Import: Headers found:', headers);
      
      const expectedHeaders = [
        'ID', 'Timestamp', 'Time Bucket', 'Valence', 'Energy', 'Focus', 'Stress', 'Tags',
        'Deep Work Minutes', 'Tasks Completed', 'Sleep Hours', 'Recovery Action', 'Social Touchpoints',
        'MC Score', 'DSS Score', 'LM Score', 'RI Score', 'CN Score'
      ];

      // Check if headers match expected format
      const headerMatch = expectedHeaders.every(header => 
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      console.log('CSV Import: Header match result:', headerMatch);

      if (!headerMatch) {
        warnings.push('CSV headers may not match expected format. Some data may not import correctly.');
      }

      // Process data rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;

        try {
          const values = this.parseCSVLine(line);
          console.log(`CSV Import: Processing row ${i + 1}, values:`, values);
          const entry = this.createMoodEntryFromCSV(values, headers, i);
          
          if (entry) {
            console.log(`CSV Import: Successfully created entry for row ${i + 1}:`, entry);
            importedEntries.push(entry);
          } else {
            console.log(`CSV Import: Failed to create entry for row ${i + 1}`);
            errors.push(`Invalid data in row ${i + 1}`);
          }
        } catch (error) {
          console.error(`CSV Import: Error parsing row ${i + 1}:`, error);
          errors.push(`Error parsing row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const success = errors.length === 0 && importedEntries.length > 0;

      return {
        success,
        message: success 
          ? `Successfully imported ${importedEntries.length} entries from CSV` 
          : `Import failed: ${errors.length} errors found`,
        importedEntries: importedEntries.length,
        entries: importedEntries, // Return the actual entries
        errors,
        warnings
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to parse CSV content',
        importedEntries: 0,
        entries: [], // Add empty entries array
        errors: [`CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Create a mood entry from CSV values
   */
  private static createMoodEntryFromCSV(values: string[], headers: string[], rowIndex: number): MoodEntry | null {
    try {
      // Find column indices
      const getColumnIndex = (headerName: string): number => {
        return headers.findIndex(h => h.toLowerCase().includes(headerName.toLowerCase()));
      };

      const idIndex = getColumnIndex('ID');
      const timestampIndex = getColumnIndex('Timestamp');
      const timeBucketIndex = getColumnIndex('Time Bucket');
      const valenceIndex = getColumnIndex('Valence');
      const energyIndex = getColumnIndex('Energy');
      const focusIndex = getColumnIndex('Focus');
      const stressIndex = getColumnIndex('Stress');
      const tagsIndex = getColumnIndex('Tags');
      const deepworkIndex = getColumnIndex('Deep Work Minutes');
      const tasksIndex = getColumnIndex('Tasks Completed');
      const sleepIndex = getColumnIndex('Sleep Hours');
      const recoveryIndex = getColumnIndex('Recovery Action');
      const socialIndex = getColumnIndex('Social Touchpoints');

      // Validate required fields
      if (idIndex === -1 || timestampIndex === -1 || timeBucketIndex === -1 || 
          valenceIndex === -1 || energyIndex === -1 || focusIndex === -1 || stressIndex === -1) {
        return null;
      }

      // Parse values
      const id = values[idIndex]?.trim() || `csv-import-${Date.now()}-${rowIndex}`;
      const timestamp = new Date(values[timestampIndex]?.trim() || new Date());
      const timeBucket = values[timeBucketIndex]?.trim() || 'Morning';
      const valence = parseFloat(values[valenceIndex]?.trim() || '2.5');
      const energy = parseFloat(values[energyIndex]?.trim() || '2.5');
      const focus = parseFloat(values[focusIndex]?.trim() || '2.5');
      const stress = parseFloat(values[stressIndex]?.trim() || '2.5');

      // Validate numeric values
      if (isNaN(valence) || valence < 0 || valence > 5) return null;
      if (isNaN(energy) || energy < 0 || energy > 5) return null;
      if (isNaN(focus) || focus < 0 || focus > 5) return null;
      if (isNaN(stress) || stress < 0 || stress > 5) return null;

      // Parse optional fields
      const tags = tagsIndex !== -1 ? 
        values[tagsIndex]?.split(';').map(t => t.trim()).filter(t => t) || [] : [];
      
      const deepworkMinutes = deepworkIndex !== -1 ? 
        (values[deepworkIndex]?.trim() === '' ? 0 : parseInt(values[deepworkIndex]?.trim() || '0') || 0) : 0;
      
      const tasksCompleted = tasksIndex !== -1 ? 
        (values[tasksIndex]?.trim() === '' ? 0 : parseInt(values[tasksIndex]?.trim() || '0') || 0) : 0;
      
      const sleepHours = sleepIndex !== -1 ? 
        (values[sleepIndex]?.trim() === '' ? 0 : parseFloat(values[sleepIndex]?.trim() || '0') || 0) : 0;
      
      const recoveryAction = recoveryIndex !== -1 && values[recoveryIndex]?.trim() !== '' ? 
        values[recoveryIndex]?.toLowerCase().includes('yes') || 
        values[recoveryIndex]?.toLowerCase().includes('true') || 
        values[recoveryIndex] === '1' : false;
      
      const socialTouchpoints = socialIndex !== -1 ? 
        (values[socialIndex]?.trim() === '' ? 0 : parseInt(values[socialIndex]?.trim() || '0') || 0) : 0;

      // Validate time bucket - match the actual TimeBucket type
      const validTimeBuckets = ['Morning', 'Midday', 'Evening', 'Night'];
      const validTimeBucket = validTimeBuckets.includes(timeBucket) ? timeBucket : 'Morning';

      // Create the entry object with proper typing
      const entry: MoodEntry = {
        id,
        timestamp,
        timeBucket: validTimeBucket as 'Morning' | 'Midday' | 'Evening' | 'Night',
        valence,
        energy,
        focus,
        stress,
        tags,
        recoveryAction
      };

      // Add optional fields only if they have values
      if (deepworkMinutes > 0) {
        entry.deepworkMinutes = deepworkMinutes;
      }
      if (tasksCompleted > 0) {
        entry.tasksCompleted = tasksCompleted;
      }
      if (sleepHours > 0) {
        entry.sleepHours = sleepHours;
      }
      if (socialTouchpoints > 0) {
        entry.socialTouchpoints = socialTouchpoints;
      }

      return entry;
    } catch (error) {
      console.error('Error creating mood entry from CSV:', error);
      return null;
    }
  }
}
export class JSONImporter {
  /**
   * Import JSON data with validation
   */
  static async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      console.log('JSON Import: File content preview:', text.substring(0, 500));
      const data = JSON.parse(text);
      console.log('JSON Import: Parsed data structure:', {
        version: data.version,
        moodEntriesCount: data.moodEntries?.length || 0,
        hasComputedScores: !!data.computedScores,
        hasDriverAnalysis: !!data.driverAnalysis
      });
      
      return this.validateAndImport(data);
    } catch (error) {
      console.error('JSON Import Error:', error);
      return {
        success: false,
        message: 'Invalid JSON file format',
        importedEntries: 0,
        entries: [], // Add empty entries array
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: []
      };
    }
  }

  /**
   * Validate and import data
   */
  private static validateAndImport(data: any): ImportResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let importedEntries = 0;
    const validEntries: MoodEntry[] = [];

    // Check if it's a valid export format
    if (!data.version || !data.moodEntries) {
      errors.push('Invalid export format - missing required fields');
      return {
        success: false,
        message: 'Invalid export format',
        importedEntries: 0,
        entries: [], // Add empty entries array
        errors,
        warnings
      };
    }

    // Validate mood entries
    if (Array.isArray(data.moodEntries)) {
      for (const entry of data.moodEntries) {
        if (this.validateMoodEntry(entry)) {
          importedEntries++;
          validEntries.push(entry); // Add valid entry to the array
        } else {
          console.log('JSON Import: Invalid entry:', entry.id, {
            timeBucket: entry.timeBucket,
            valence: entry.valence,
            energy: entry.energy,
            focus: entry.focus,
            stress: entry.stress,
            tags: entry.tags
          });
          errors.push(`Invalid mood entry: ${entry.id || 'unknown'}`);
        }
      }
    } else {
      errors.push('Mood entries must be an array');
    }

    // Check for version compatibility
    if (data.version !== '1.0.0') {
      warnings.push(`Export version ${data.version} may not be fully compatible`);
    }

    // Check date range
    if (data.metadata?.dateRange) {
      const startDate = new Date(data.metadata.dateRange.start);
      const endDate = new Date(data.metadata.dateRange.end);
      const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 365) {
        warnings.push('Import contains data spanning more than a year');
      }
    }

    const success = errors.length === 0 && importedEntries > 0;

    return {
      success,
      message: success 
        ? `Successfully imported ${importedEntries} entries` 
        : `Import failed: ${errors.length} errors found`,
      importedEntries,
      entries: validEntries, // Return the actual entries
      errors,
      warnings
    };
  }

  /**
   * Validate individual mood entry
   */
  private static validateMoodEntry(entry: any): boolean {
    const requiredFields = ['id', 'timestamp', 'timeBucket', 'valence', 'energy', 'focus', 'stress', 'tags'];
    
    for (const field of requiredFields) {
      if (entry[field] === undefined || entry[field] === null) {
        return false;
      }
    }

    // Validate data types and ranges
    if (typeof entry.valence !== 'number' || entry.valence < 0 || entry.valence > 5) return false;
    if (typeof entry.energy !== 'number' || entry.energy < 0 || entry.energy > 5) return false;
    if (typeof entry.focus !== 'number' || entry.focus < 0 || entry.focus > 5) return false;
    if (typeof entry.stress !== 'number' || entry.stress < 0 || entry.stress > 5) return false;
    if (!Array.isArray(entry.tags)) return false;
    
    // Validate time bucket - match the actual TimeBucket type from types/index.ts
    const validTimeBuckets = ['Morning', 'Midday', 'Evening', 'Night'];
    const timeBucketLower = entry.timeBucket?.toLowerCase();
    const validTimeBucketLower = ['morning', 'midday', 'evening', 'night'];
    if (!validTimeBuckets.includes(entry.timeBucket) && !validTimeBucketLower.includes(timeBucketLower)) return false;

    // Validate timestamp
    const timestamp = new Date(entry.timestamp);
    if (isNaN(timestamp.getTime())) return false;

    return true;
  }

  /**
   * Merge imported data with existing data
   */
  static mergeData(existingEntries: MoodEntry[], importedEntries: MoodEntry[]): MoodEntry[] {
    const existingIds = new Set(existingEntries.map(e => e.id));
    const newEntries = importedEntries.filter(e => !existingIds.has(e.id));
    
    return [...existingEntries, ...newEntries];
  }

  /**
   * Replace existing data with imported data
   */
  static replaceData(importedEntries: MoodEntry[]): MoodEntry[] {
    return [...importedEntries];
  }
}

/**
 * Storage Manager
 */
export class StorageManager {
  /**
   * Get storage usage information
   */
  static getStorageUsage(moodEntries: MoodEntry[]): StorageUsage {
    const totalSize = JSON.stringify(moodEntries).length;
    const entryCount = moodEntries.length;
    
    let oldestEntry: string | null = null;
    let newestEntry: string | null = null;
    
    if (moodEntries.length > 0) {
      const sortedEntries = [...moodEntries].sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      oldestEntry = sortedEntries[0]?.timestamp ? String(sortedEntries[0].timestamp) : null;
      newestEntry = sortedEntries[sortedEntries.length - 1]?.timestamp ? String(sortedEntries[sortedEntries.length - 1]!.timestamp) : null;
    }
    
    return {
      totalSize,
      entryCount,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Clear all local data
   */
  static clearAllData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('campus-thrive-mood-entries');
      localStorage.removeItem('campus-thrive-computed-scores');
      localStorage.removeItem('campus-thrive-driver-analysis');
      localStorage.removeItem('campus-thrive-power-hour-heatmap');
      localStorage.removeItem('campus-thrive-coach-tips');
      localStorage.removeItem('campus-thrive-settings');
    }
  }

  /**
   * Get storage quota information
   */
  static async getStorageQuota(): Promise<{ used: number; total: number; percentage: number }> {
    if (typeof window === 'undefined' || !('storage' in navigator) || !('estimate' in navigator.storage)) {
      return { used: 0, total: 0, percentage: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;
      
      return { used, total, percentage };
    } catch (error) {
      console.error('Failed to get storage quota:', error);
      return { used: 0, total: 0, percentage: 0 };
    }
  }

  /**
   * Format bytes to human readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
