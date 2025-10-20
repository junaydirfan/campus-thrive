/**
 * CampusThrive useLocalStorage Hook
 * 
 * Custom React hook for localStorage management with TypeScript generics,
 * automatic serialization, error handling, and data validation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StorageManager, 
  StorageError, 
  MigrationManager
} from '@/lib/storage';
import type { 
  MoodEntry, 
  ComputedScores, 
  DriverAnalysis, 
  PowerHourHeatmap, 
  CoachTip, 
  AppSettings
} from '@/types';

/**
 * Hook options for localStorage operations
 */
export interface UseLocalStorageOptions<T> {
  /** Default value to use when localStorage is empty or unavailable */
  defaultValue: T;
  /** Function to validate data when reading from storage */
  validator?: (data: unknown) => data is T;
  /** Whether to enable automatic cleanup of expired data */
  enableCleanup?: boolean;
  /** Whether to run migrations automatically */
  enableMigrations?: boolean;
  /** Callback for storage errors */
  onError?: (error: StorageError) => void;
  /** Callback for successful operations */
  onSuccess?: (data: T) => void;
}

/**
 * Return type for the useLocalStorage hook
 */
export interface UseLocalStorageReturn<T> {
  /** Current value from localStorage */
  value: T;
  /** Function to update the value in localStorage */
  setValue: (value: T | ((prevValue: T) => T)) => void;
  /** Function to remove the value from localStorage */
  removeValue: () => void;
  /** Whether the operation is in progress */
  loading: boolean;
  /** Any error that occurred during the last operation */
  error: StorageError | null;
  /** Whether localStorage is available */
  isAvailable: boolean;
  /** Storage usage information */
  storageInfo: { used: number; available: number; percentage: number };
  /** Force refresh the value from storage */
  refresh: () => void;
}

/**
 * Custom hook for localStorage with TypeScript generics and error handling
 */
export function useLocalStorage<T>(
  key: string,
  options: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const {
    defaultValue,
    validator,
    enableCleanup = true,
    enableMigrations = true,
    onError,
    onSuccess,
  } = options;

  // State management
  const [value, setValueState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<StorageError | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [storageInfo, setStorageInfo] = useState({ used: 0, available: 0, percentage: 0 });

  // Refs to prevent unnecessary re-renders
  const defaultValueRef = useRef(defaultValue);
  const validatorRef = useRef(validator);
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);

  // Update refs when options change
  useEffect(() => {
    defaultValueRef.current = defaultValue;
    validatorRef.current = validator;
    onErrorRef.current = onError;
    onSuccessRef.current = onSuccess;
  }, [defaultValue, validator, onError, onSuccess]);

  /**
   * Load value from localStorage
   */
  const loadValue = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      // Check if localStorage is available
      const available = StorageManager.isAvailable();
      setIsAvailable(available);

      if (!available) {
        setValueState(defaultValueRef.current);
        setLoading(false);
        return;
      }

      // Run migrations if enabled
      if (enableMigrations) {
        const storedVersion = MigrationManager.getStoredVersion();
        const currentVersion = MigrationManager.getCurrentVersion();
        
        if (storedVersion !== currentVersion) {
          // In a real app, you'd run migrations here
          // For now, we'll just update the version
          MigrationManager.setStoredVersion(currentVersion);
        }
      }

      // Get the value from storage
      const result = StorageManager.getItem(
        key,
        validatorRef.current || ((_data: unknown): _data is T => true),
        defaultValueRef.current
      );

      if (result.success) {
        setValueState(result.data);
        onSuccessRef.current?.(result.data);
      } else {
        setError(result.error);
        setValueState(defaultValueRef.current);
        onErrorRef.current?.(result.error);
      }

      // Update storage info
      setStorageInfo(StorageManager.getStorageInfo());

      // Run cleanup if enabled
      if (enableCleanup) {
        const cleanupResult = StorageManager.cleanupExpiredData();
        if (cleanupResult.removed > 0) {
          console.log(`Cleaned up ${cleanupResult.removed} expired entries, freed ${cleanupResult.freed} bytes`);
        }
      }

    } catch (err) {
      const storageError = new StorageError(
        `Failed to load value for key ${key}`,
        'INVALID_DATA',
        err as Error
      );
      setError(storageError);
      setValueState(defaultValueRef.current);
      onErrorRef.current?.(storageError);
    } finally {
      setLoading(false);
    }
  }, [key, enableCleanup, enableMigrations]);

  /**
   * Save value to localStorage
   */
  const setValue = useCallback((newValue: T | ((prevValue: T) => T)) => {
    setLoading(true);
    setError(null);

    try {
      const valueToSave = typeof newValue === 'function' 
        ? (newValue as (prevValue: T) => T)(value)
        : newValue;

      const result = StorageManager.setItem(key, valueToSave);

      if (result.success) {
        setValueState(valueToSave);
        onSuccessRef.current?.(valueToSave);
        
        // Update storage info
        setStorageInfo(StorageManager.getStorageInfo());
      } else {
        setError(result.error);
        onErrorRef.current?.(result.error);
        
        // If quota exceeded, try cleanup
        if (result.error.code === 'QUOTA_EXCEEDED') {
          const cleanupResult = StorageManager.forceCleanup();
          if (cleanupResult.removed > 0) {
            console.log(`Force cleanup removed ${cleanupResult.removed} entries, freed ${cleanupResult.freed} bytes`);
            
            // Try saving again after cleanup
            const retryResult = StorageManager.setItem(key, valueToSave);
            if (retryResult.success) {
              setValueState(valueToSave);
              onSuccessRef.current?.(valueToSave);
              setError(null);
            } else {
              setError(retryResult.error);
              onErrorRef.current?.(retryResult.error);
            }
          }
        }
      }
    } catch (err) {
      const storageError = new StorageError(
        `Failed to save value for key ${key}`,
        'QUOTA_EXCEEDED',
        err as Error
      );
      setError(storageError);
      onErrorRef.current?.(storageError);
    } finally {
      setLoading(false);
    }
  }, [key, value]);

  /**
   * Remove value from localStorage
   */
  const removeValue = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      StorageManager.removeItem(key);
      setValueState(defaultValueRef.current);
      onSuccessRef.current?.(defaultValueRef.current);
      
      // Update storage info
      setStorageInfo(StorageManager.getStorageInfo());
    } catch (err) {
      const storageError = new StorageError(
        `Failed to remove value for key ${key}`,
        'INVALID_DATA',
        err as Error
      );
      setError(storageError);
      onErrorRef.current?.(storageError);
    } finally {
      setLoading(false);
    }
  }, [key]);

  /**
   * Refresh value from storage
   */
  const refresh = useCallback(() => {
    loadValue();
  }, [loadValue]);

  // Load initial value
  useEffect(() => {
    loadValue();
  }, [loadValue]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    if (!isAvailable) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (validatorRef.current ? validatorRef.current(parsed) : true) {
            setValueState(parsed);
            onSuccessRef.current?.(parsed);
          }
        } catch (err) {
          console.warn('Failed to parse storage change event:', err);
        }
      } else if (e.key === key && e.newValue === null) {
        // Value was removed
        setValueState(defaultValueRef.current);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, isAvailable]);

  return {
    value,
    setValue,
    removeValue,
    loading,
    error,
    isAvailable,
    storageInfo,
    refresh,
  };
}

/**
 * Specialized hooks for common data types
 */

  /**
   * Hook for mood entries with validation
   */
  export function useMoodEntries() {
    return useLocalStorage('campus-thrive-mood-entries', {
      defaultValue: [] as MoodEntry[],
      validator: (data): data is MoodEntry[] => Array.isArray(data),
      enableCleanup: true,
      enableMigrations: true,
    });
  }

/**
 * Hook for app settings with validation
 */
export function useAppSettings() {
  return useLocalStorage('campus-thrive-settings', {
    defaultValue: {
      theme: 'system' as const,
      defaultTimeBucket: 'Morning' as const,
      showCoachTips: true,
      notifications: {
        moodReminders: true,
        coachTips: true,
        weeklyReports: true,
      },
      dataRetention: {
        moodEntriesDays: 14,
        scoresDays: 30,
      },
      privacy: {
        collectAnalytics: false,
        crashReporting: false,
      },
    },
    validator: (data): data is AppSettings => typeof data === 'object' && data !== null,
    enableCleanup: false,
    enableMigrations: true,
  });
}

/**
 * Hook for computed scores with validation
 */
export function useComputedScores() {
  return useLocalStorage('campus-thrive-computed-scores', {
    defaultValue: [] as ComputedScores[],
    validator: (data): data is ComputedScores[] => Array.isArray(data),
    enableCleanup: true,
    enableMigrations: true,
  });
}

/**
 * Hook for driver analysis with validation
 */
export function useDriverAnalysis() {
  return useLocalStorage('campus-thrive-driver-analysis', {
    defaultValue: null as DriverAnalysis | null,
    validator: (data): data is DriverAnalysis | null => data === null || typeof data === 'object',
    enableCleanup: false,
    enableMigrations: true,
  });
}

/**
 * Hook for power hour heatmap with validation
 */
export function usePowerHourHeatmap() {
  return useLocalStorage('campus-thrive-power-hour-heatmap', {
    defaultValue: null as PowerHourHeatmap | null,
    validator: (data): data is PowerHourHeatmap | null => data === null || typeof data === 'object',
    enableCleanup: false,
    enableMigrations: true,
  });
}

/**
 * Hook for coach tips with validation
 */
export function useCoachTips() {
  return useLocalStorage('campus-thrive-coach-tips', {
    defaultValue: [] as CoachTip[],
    validator: (data): data is CoachTip[] => Array.isArray(data),
    enableCleanup: false,
    enableMigrations: true,
  });
}

/**
 * Hook for storage management utilities
 */
export function useStorageManager() {
  const [storageInfo, setStorageInfo] = useState(() => StorageManager.getStorageInfo());
  const [isAvailable, setIsAvailable] = useState(() => StorageManager.isAvailable());

  const refreshStorageInfo = useCallback(() => {
    setStorageInfo(StorageManager.getStorageInfo());
    setIsAvailable(StorageManager.isAvailable());
  }, []);

  const cleanupExpiredData = useCallback(() => {
    const result = StorageManager.cleanupExpiredData();
    refreshStorageInfo();
    return result;
  }, [refreshStorageInfo]);

  const forceCleanup = useCallback(() => {
    const result = StorageManager.forceCleanup();
    refreshStorageInfo();
    return result;
  }, [refreshStorageInfo]);

  const clearAllData = useCallback(() => {
    StorageManager.clearAll();
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  return {
    storageInfo,
    isAvailable,
    refreshStorageInfo,
    cleanupExpiredData,
    forceCleanup,
    clearAllData,
  };
}
