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

    const rows = entries.map(entry => {
      const mc = this.calculateMC(entry);
      const dss = this.calculateDSS(entry);
      const lm = this.calculateLM(entry);
      const ri = this.calculateRI(entry);
      const cn = this.calculateCN(entry);

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
   * Calculate CN (Connection)
   */
  private static calculateCN(entry: MoodEntry): number {
    const valence = entry.valence;
    const socialTouchpoints = entry.socialTouchpoints || 0;
    const socialTags = entry.tags.filter(tag => 
      ['social', 'friends', 'family', 'party', 'dating'].includes(tag.toLowerCase())
    ).length;
    
    const valenceComponent = valence / 5;
    const touchpointsComponent = Math.min(1, socialTouchpoints / 5);
    const tagsComponent = Math.min(1, socialTags / 3);
    
    return (valenceComponent * 0.4) + (touchpointsComponent * 0.4) + (tagsComponent * 0.2);
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
 * Enhanced JSON Importer
 */
export class JSONImporter {
  /**
   * Import JSON data with validation
   */
  static async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      return this.validateAndImport(data);
    } catch (error) {
      return {
        success: false,
        message: 'Invalid JSON file format',
        importedEntries: 0,
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

    // Check if it's a valid export format
    if (!data.version || !data.moodEntries) {
      errors.push('Invalid export format - missing required fields');
      return {
        success: false,
        message: 'Invalid export format',
        importedEntries: 0,
        errors,
        warnings
      };
    }

    // Validate mood entries
    if (Array.isArray(data.moodEntries)) {
      for (const entry of data.moodEntries) {
        if (this.validateMoodEntry(entry)) {
          importedEntries++;
        } else {
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
    if (!['morning', 'afternoon', 'evening', 'night'].includes(entry.timeBucket)) return false;

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
