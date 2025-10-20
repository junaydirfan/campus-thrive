'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Layout, PageContainer, Section } from "@/components/Layout";
import { useMoodEntries } from '@/hooks/useLocalStorage';
import {
  Shield,
  Download,
  Upload,
  Trash2,
  Database,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  FileText,
  Clock,
  Loader2,
  HelpCircle,
  RefreshCw,
  Calendar,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  CSVExporter,
  JSONExporter,
  JSONImporter,
  StorageManager,
  ImportResult,
  type StorageUsage
} from '@/lib/export';
import { format, subDays } from 'date-fns';

/**
 * Data retention period options
 */
type RetentionPeriod = '7d' | '14d' | '30d' | '90d' | '1y' | 'forever';

/**
 * Privacy explanation component
 */
function PrivacyExplanation() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-8 h-8 text-green-600" />
        <h3 className="text-xl font-semibold text-foreground">Your Data Stays Private</h3>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">100% Local Storage</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                All your wellness data is stored locally on your device using browser localStorage. 
                Nothing is sent to external servers or cloud services.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Database className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">No Data Collection</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  We don't collect, track, or analyze your personal data. Your privacy is completely protected.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <HardDrive className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">Device-Only Access</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Only you can access your data. It's stored securely in your browser and never transmitted.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Important Note</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Data is stored in your browser's localStorage. Clearing browser data or using incognito mode 
                will remove your data. Export your data regularly for backup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Storage usage component
 */
function StorageUsage({ 
  storageUsage, 
  isLoading 
}: { 
  storageUsage: StorageUsage | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!storageUsage) {
    return (
      <div className="card p-6 text-center">
        <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No storage data</h3>
        <p className="text-muted-foreground">
          Unable to retrieve storage information.
        </p>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const usagePercentage = storageUsage.totalSize > 0 ? (storageUsage.totalSize / (1024 * 1024)) * 100 : 0; // Convert to MB and percentage

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Storage Usage</h3>
      </div>
      
      <div className="space-y-4">
        {/* Usage Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used Storage</span>
            <span className="font-medium text-foreground">
              {formatBytes(storageUsage.totalSize)} used
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            {usagePercentage.toFixed(1)}% of available storage used
          </div>
        </div>

        {/* Storage Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-background-alt rounded-lg">
            <div className="text-sm text-muted-foreground">Total Entries</div>
            <div className="text-lg font-bold text-foreground">{storageUsage.entryCount}</div>
          </div>
          <div className="p-3 bg-background-alt rounded-lg">
            <div className="text-sm text-muted-foreground">Data Range</div>
            <div className="text-sm font-medium text-foreground">
              {storageUsage.oldestEntry ? format(new Date(storageUsage.oldestEntry), 'MMM dd') : 'N/A'} - {' '}
              {storageUsage.newestEntry ? format(new Date(storageUsage.newestEntry), 'MMM dd') : 'N/A'}
            </div>
          </div>
        </div>

        {/* Storage Warning */}
        {usagePercentage > 80 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                Storage is {usagePercentage.toFixed(1)}% full. Consider exporting or cleaning up old data.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Export controls component
 */
function ExportControls({ 
  onExportCSV, 
  onExportJSON, 
  isExporting 
}: {
  onExportCSV: () => void;
  onExportJSON: () => void;
  isExporting: boolean;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Export Your Data</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download your wellness data in various formats for backup, analysis, or sharing.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={onExportCSV}
            disabled={isExporting}
            className="btn btn-outline flex items-center gap-2 justify-center"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                Export CSV
              </>
            )}
          </button>
          
          <button
            onClick={onExportJSON}
            disabled={isExporting}
            className="btn btn-outline flex items-center gap-2 justify-center"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Database className="w-4 h-4" />
                Export JSON
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>CSV:</strong> Spreadsheet-compatible format for data analysis<br />
          <strong>JSON:</strong> Complete data structure for backup and import
        </div>
      </div>
    </div>
  );
}

/**
 * Import functionality component
 */
function ImportControls({ 
  onImport, 
  isImporting, 
  importResult 
}: {
  onImport: (file: File) => void;
  isImporting: boolean;
  importResult: ImportResult | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImport(e.dataTransfer.files[0]);
    }
  }, [onImport]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImport(e.target.files[0]);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Import Data</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Import previously exported JSON data to restore your wellness history.
        </p>
        
        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isImporting ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Importing data...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">Drop JSON file here</p>
                <p className="text-xs text-muted-foreground">or click to browse</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline btn-sm"
              >
                Choose File
              </button>
            </div>
          )}
        </div>

        {/* Import Result */}
        {importResult && (
          <div className={`p-3 rounded-lg ${
            importResult.success 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                importResult.success 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-red-800 dark:text-red-200'
              }`}>
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </span>
            </div>
            <p className={`text-xs mt-1 ${
              importResult.success 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-red-700 dark:text-red-300'
            }`}>
              {importResult.message}
            </p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <strong>Supported format:</strong> JSON files exported from CampusThrive<br />
          <strong>Note:</strong> Importing will merge with existing data unless you choose to replace it
        </div>
      </div>
    </div>
  );
}

/**
 * Data retention settings component
 */
function DataRetentionSettings({ 
  retentionPeriod, 
  onRetentionChange, 
  onCleanup 
}: {
  retentionPeriod: RetentionPeriod;
  onRetentionChange: (period: RetentionPeriod) => void;
  onCleanup: () => void;
}) {
  const retentionOptions = [
    { key: '7d' as RetentionPeriod, label: '7 Days', description: 'Keep last week' },
    { key: '14d' as RetentionPeriod, label: '14 Days', description: 'Keep last 2 weeks' },
    { key: '30d' as RetentionPeriod, label: '30 Days', description: 'Keep last month' },
    { key: '90d' as RetentionPeriod, label: '90 Days', description: 'Keep last 3 months' },
    { key: '1y' as RetentionPeriod, label: '1 Year', description: 'Keep last year' },
    { key: 'forever' as RetentionPeriod, label: 'Forever', description: 'Keep all data' }
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Data Retention</h3>
      </div>
      
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose how long to keep your wellness data. Older entries will be automatically cleaned up.
        </p>
        
        <div className="space-y-2">
          {retentionOptions.map((option) => (
            <label key={option.key} className="flex items-center gap-3 p-3 rounded-lg hover:bg-background-alt cursor-pointer">
              <input
                type="radio"
                name="retention"
                value={option.key}
                checked={retentionPeriod === option.key}
                onChange={(e) => onRetentionChange(e.target.value as RetentionPeriod)}
                className="text-primary"
              />
              <div className="flex-1">
                <div className="font-medium text-foreground">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            </label>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <button
            onClick={onCleanup}
            className="btn btn-outline flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Clean Up Old Data Now
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Manually remove entries older than your retention period
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Complete data deletion component
 */
function DataDeletion({ 
  onDeleteAll, 
  isDeleting 
}: {
  onDeleteAll: () => void;
  isDeleting: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (showConfirm) {
      onDeleteAll();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div className="card p-6 border-red-200 dark:border-red-800">
      <div className="flex items-center gap-2 mb-4">
        <Trash2 className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold text-red-600">Delete All Data</h3>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Permanent Deletion</h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                This will permanently delete all your wellness data from this device. 
                This action cannot be undone. Make sure to export your data first if you want to keep it.
              </p>
            </div>
          </div>
        </div>

        {showConfirm && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Are you sure?</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  This will delete all your entries, scores, and settings. Type "DELETE" to confirm.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`btn flex items-center gap-2 ${
              showConfirm ? 'btn-destructive' : 'btn-outline'
            }`}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {showConfirm ? 'Confirm Deletion' : 'Delete All Data'}
              </>
            )}
          </button>
          
          {showConfirm && (
            <button
              onClick={() => setShowConfirm(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <strong>Warning:</strong> This action is irreversible. Export your data first if you want to keep it.
        </div>
      </div>
    </div>
  );
}

/**
 * Help documentation component
 */
function HelpDocumentation() {
  const [activeTab, setActiveTab] = useState<'formats' | 'privacy' | 'troubleshooting'>('formats');

  const tabs = [
    { key: 'formats' as const, label: 'Data Formats', icon: FileText },
    { key: 'privacy' as const, label: 'Privacy', icon: Shield },
    { key: 'troubleshooting' as const, label: 'Troubleshooting', icon: HelpCircle }
  ];

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Help & Documentation</h3>
      </div>
      
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="pt-4">
          {activeTab === 'formats' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">CSV Format</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Comma-separated values format compatible with Excel, Google Sheets, and other spreadsheet applications.
                </p>
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <strong>Columns:</strong> Date, Time, Valence, Energy, Focus, Stress, Tags, Deep Work Minutes, Tasks Completed, Sleep Hours, Recovery Action, Social Touchpoints, MC Score, DSS Score
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">JSON Format</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Complete data structure including all entries, computed scores, and metadata. Used for backup and import.
                </p>
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <strong>Structure:</strong> Array of mood entries with timestamps, scores, tags, and computed metrics
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Local Storage Only</h4>
                <p className="text-sm text-muted-foreground">
                  All data is stored in your browser's localStorage. No data is sent to external servers or cloud services.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Data Security</h4>
                <p className="text-sm text-muted-foreground">
                  Your data is protected by browser security. Only you can access it through this application.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Backup Recommendations</h4>
                <p className="text-sm text-muted-foreground">
                  Export your data regularly to prevent loss from browser clearing or device changes.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'troubleshooting' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Data Not Loading</h4>
                <p className="text-sm text-muted-foreground">
                  Try refreshing the page. If data is still missing, check if browser data was cleared.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Import Failed</h4>
                <p className="text-sm text-muted-foreground">
                  Ensure the file is a valid JSON format exported from CampusThrive. Check file size limits.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-foreground mb-2">Storage Full</h4>
                <p className="text-sm text-muted-foreground">
                  Export old data and use the cleanup tool to free up space. Consider adjusting retention settings.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main DataControlPage component
 */
export default function DataControlPage() {
  const { value: moodEntries, setValue: setMoodEntries } = useMoodEntries();
  const [retentionPeriod, setRetentionPeriod] = useState<RetentionPeriod>('forever');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);

  // Load storage usage
  useEffect(() => {
    const loadStorageUsage = async () => {
      try {
        const usage = StorageManager.getStorageUsage(moodEntries);
        setStorageUsage(usage);
      } catch (error) {
        console.error('Error loading storage usage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageUsage();
  }, [moodEntries]);

  // Export functions
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await CSVExporter.exportMoodEntries(moodEntries);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      await JSONExporter.exportCompleteData(moodEntries);
    } catch (error) {
      console.error('Error exporting JSON:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Import function
  const handleImport = async (file: File) => {
    setIsImporting(true);
    setImportResult(null);
    
    try {
      const result = await JSONImporter.importFromFile(file);
      setImportResult(result);
      
      if (result.success) {
        // Reload the page or refresh data after successful import
        window.location.reload();
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: 'Failed to import file. Please check the file format.',
        importedEntries: 0,
        errors: ['Import failed'],
        warnings: []
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Cleanup function
  const handleCleanup = () => {
    const cutoffDate = retentionPeriod === 'forever' 
      ? null 
      : subDays(new Date(), parseInt(retentionPeriod.replace(/\D/g, '')) * (retentionPeriod.includes('y') ? 365 : 1));
    
    const filteredEntries = cutoffDate 
      ? moodEntries.filter(entry => new Date(entry.timestamp) >= cutoffDate)
      : moodEntries;
    
    setMoodEntries(filteredEntries);
  };

  // Delete all function
  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      setMoodEntries([]);
      // Clear any other stored data
      localStorage.removeItem('campusThrive_settings');
      localStorage.removeItem('campusThrive_coachPreferences');
    } catch (error) {
      console.error('Error deleting data:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalEntries = moodEntries.length;
  const uniqueDays = new Set(moodEntries.map(entry => 
    new Date(entry.timestamp).toDateString()
  )).size;

  return (
    <Layout>
      <PageContainer>
        {/* Header */}
        <Section 
          title="Data Control Center"
          description="Manage your wellness data with complete privacy and control. Export, import, and configure your data settings."
        >
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold text-foreground">Data Control Center</h2>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your data, your control. Export, import, and manage your wellness data with complete privacy.
              Everything stays on your device.
            </p>
          </div>
        </Section>

        {/* Privacy Explanation */}
        <PrivacyExplanation />

        {/* Storage Usage */}
        <StorageUsage storageUsage={storageUsage} isLoading={isLoading} />

        {/* Export Controls */}
        <ExportControls
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          isExporting={isExporting}
        />

        {/* Import Controls */}
        <ImportControls
          onImport={handleImport}
          isImporting={isImporting}
          importResult={importResult}
        />

        {/* Data Retention Settings */}
        <DataRetentionSettings
          retentionPeriod={retentionPeriod}
          onRetentionChange={setRetentionPeriod}
          onCleanup={handleCleanup}
        />

        {/* Complete Data Deletion */}
        <DataDeletion
          onDeleteAll={handleDeleteAll}
          isDeleting={isDeleting}
        />

        {/* Help Documentation */}
        <HelpDocumentation />

        {/* Data Summary */}
        <Section title="Your Data Summary" description="Overview of your current data">
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-background-alt rounded-lg">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{uniqueDays}</div>
                <div className="text-sm text-muted-foreground">Days Tracked</div>
              </div>
              <div className="text-center p-4 bg-background-alt rounded-lg">
                <Activity className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{totalEntries}</div>
                <div className="text-sm text-muted-foreground">Total Entries</div>
              </div>
              <div className="text-center p-4 bg-background-alt rounded-lg">
                <BarChart3 className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">
                  {totalEntries > 0 ? (totalEntries / uniqueDays).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-muted-foreground">Avg per Day</div>
              </div>
            </div>
          </div>
        </Section>
      </PageContainer>
    </Layout>
  );
}
