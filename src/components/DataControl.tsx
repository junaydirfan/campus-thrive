/**
 * CampusThrive Data Control Component
 * 
 * Features:
 * - Export options (CSV, JSON)
 * - Import functionality with validation
 * - Privacy controls and storage management
 * - Drag-and-drop file import
 * - Success/error messaging
 * - Confirmation dialogs
 */

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { 
  Download,
  Upload,
  Trash2,
  FileText,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  HardDrive,
  Loader2
} from 'lucide-react';
import { 
  CSVExporter, 
  JSONExporter, 
  JSONImporter,
  CSVImporter,
  StorageManager,
  ImportResult,
  StorageUsage
} from '@/lib/export';
import { MoodEntry } from '@/types';

/**
 * Message type for notifications
 */
interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  content: string;
  duration?: number;
}

/**
 * Loading component
 */
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{message}</span>
    </div>
  );
}

/**
 * Message notification component
 */
function MessageNotification({ message, onClose }: { message: Message; onClose: () => void }) {
  const getIcon = () => {
    switch (message.type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (message.type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getBgColor()}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{message.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{message.content}</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/**
 * Storage usage component
 */
function StorageUsageDisplay({ usage }: { usage: StorageUsage }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive className="w-5 h-5 text-muted-foreground" />
        <h3 className="font-medium text-foreground">Storage Usage</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Total Entries:</span>
          <span className="ml-2 font-medium text-foreground">{usage.entryCount}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Data Size:</span>
          <span className="ml-2 font-medium text-foreground">{StorageManager.formatBytes(usage.totalSize)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Date Range:</span>
          <span className="ml-2 font-medium text-foreground">
            {usage.oldestEntry ? new Date(usage.oldestEntry).toLocaleDateString() : 'N/A'} - 
            {usage.newestEntry ? new Date(usage.newestEntry).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Export section component
 */
function ExportSection({ moodEntries, onMessage }: { 
  moodEntries: MoodEntry[]; 
  onMessage: (message: Message) => void;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      const csvContent = CSVExporter.exportMoodEntries(moodEntries);
      CSVExporter.downloadCSV(csvContent);
      
      onMessage({
        type: 'success',
        title: 'CSV Export Complete',
        content: `Exported ${moodEntries.length} entries to CSV file`
      });
    } catch (error) {
      onMessage({
        type: 'error',
        title: 'Export Failed',
        content: `Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleJSONExport = async () => {
    setIsExporting(true);
    try {
      const exportData = JSONExporter.exportCompleteData(moodEntries);
      JSONExporter.downloadJSON(exportData);
      
      onMessage({
        type: 'success',
        title: 'JSON Export Complete',
        content: `Exported complete data structure with ${moodEntries.length} entries`
      });
    } catch (error) {
      onMessage({
        type: 'error',
        title: 'Export Failed',
        content: `Failed to export JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Export Data</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Download your wellness data in various formats. All exports are generated locally 
        and your data never leaves your device.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleCSVExport}
          disabled={isExporting || moodEntries.length === 0}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <LoadingSpinner message="Exporting..." />
          ) : (
            <>
              <FileText className="w-4 h-4" />
              Export CSV
            </>
          )}
        </button>

        <button
          onClick={handleJSONExport}
          disabled={isExporting || moodEntries.length === 0}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted hover:text-foreground transition-colors flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <LoadingSpinner message="Exporting..." />
          ) : (
            <>
              <Database className="w-4 h-4" />
              Export JSON
            </>
          )}
        </button>
      </div>

      {moodEntries.length === 0 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>No data available to export. Start logging entries to enable export.</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Import section component
 */
function ImportSection({ onImport, onMessage }: { 
  onImport: (result: ImportResult) => void;
  onMessage: (message: Message) => void;
}) {
  const [isImporting, setIsImporting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    const isJSON = file.name.endsWith('.json');
    const isCSV = file.name.endsWith('.csv');

    if (!isJSON && !isCSV) {
      onMessage({
        type: 'error',
        title: 'Invalid File Type',
        content: 'Please select a JSON or CSV file exported from CampusThrive'
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = isJSON 
        ? await JSONImporter.importFromFile(file)
        : await CSVImporter.importFromFile(file);
      
      onImport(result);
      
      if (result.success) {
        onMessage({
          type: 'success',
          title: 'Import Successful',
          content: `Imported ${result.importedEntries} entries successfully from ${isJSON ? 'JSON' : 'CSV'}`
        });
      } else {
        onMessage({
          type: 'error',
          title: 'Import Failed',
          content: result.message
        });
      }

      // Show warnings if any
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          onMessage({
            type: 'warning',
            title: 'Import Warning',
            content: warning
          });
        });
      }
    } catch (error) {
      onMessage({
        type: 'error',
        title: 'Import Error',
        content: `Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Import Data</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Import previously exported JSON or CSV data to restore or merge with your current data.
      </p>

      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragOver ? 'border-primary bg-primary/5' : 'border-border'}
          ${isImporting ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {isImporting ? (
          <LoadingSpinner message="Importing data..." />
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
            <div className="text-sm text-muted-foreground">
              <p>Drop a JSON or CSV file here or click to browse</p>
              <p className="text-xs mt-1">Supports CampusThrive JSON exports and CSV files</p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );
}

/**
 * Privacy controls section
 */
function PrivacyControls({ onClearData, onMessage }: { 
  onClearData: () => void;
  onMessage: (message: Message) => void;
}) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClearData = () => {
    StorageManager.clearAllData();
    onClearData();
    setShowConfirmDialog(false);
    
    onMessage({
      type: 'success',
      title: 'Data Cleared',
      content: 'All local data has been permanently deleted'
    });
  };

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Privacy Controls</h3>
      </div>
      
      <div className="space-y-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800 dark:text-green-200">Privacy First</h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your data never leaves your device. All processing happens locally in your browser. 
                No external servers, no data collection, complete privacy protection.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Clear All Data</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Permanently delete all your wellness data from this device. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="mt-2 px-3 py-1.5 text-sm font-medium text-red-600 bg-background border border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-700 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-foreground">Confirm Data Deletion</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to permanently delete all your wellness data? 
              This action cannot be undone and you will lose all your entries, scores, and patterns.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground bg-background border border-border rounded-md hover:bg-muted hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-md hover:bg-red-700 hover:border-red-700 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main DataControl component
 */
export function DataControl() {
  const { value: moodEntries, setValue: setMoodEntries } = useMoodEntries();
  const [messages, setMessages] = useState<Message[]>([]);
  const [storageUsage, setStorageUsage] = useState<StorageUsage>({
    totalSize: 0,
    entryCount: 0,
    oldestEntry: null,
    newestEntry: null
  });

  // Update storage usage when entries change
  const updateStorageUsage = useCallback(() => {
    const usage = StorageManager.getStorageUsage(moodEntries);
    setStorageUsage(usage);
  }, [moodEntries]);

  // Handle import result
  const handleImport = useCallback((result: ImportResult) => {
    if (result.success && result.importedEntries > 0 && result.entries.length > 0) {
      // Merge imported entries with existing entries
      const existingIds = new Set(moodEntries.map(e => e.id));
      const newEntries = result.entries.filter(e => !existingIds.has(e.id));
      
      if (newEntries.length > 0) {
        const mergedEntries = [...moodEntries, ...newEntries];
        setMoodEntries(mergedEntries);
        updateStorageUsage();
        
        console.log(`Import successful: Added ${newEntries.length} new entries (${result.importedEntries - newEntries.length} duplicates skipped)`);
      } else {
        console.log('Import successful but all entries were duplicates');
      }
    }
  }, [moodEntries, setMoodEntries, updateStorageUsage]);

  // Handle clear data
  const handleClearData = useCallback(() => {
    setMoodEntries([]);
    updateStorageUsage();
  }, [setMoodEntries, updateStorageUsage]);

  // Add message
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // Auto-remove message after duration
    if (message.duration !== 0) {
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m !== message));
      }, message.duration || 5000);
    }
  }, []);

  // Remove message
  const removeMessage = useCallback((message: Message) => {
    setMessages(prev => prev.filter(m => m !== message));
  }, []);

  // Update storage usage on mount and when entries change
  useEffect(() => {
    updateStorageUsage();
  }, [updateStorageUsage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-bold text-foreground">Data Control</h2>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Export, import, and manage your wellness data with complete privacy. 
          All operations happen locally on your device.
        </p>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((message, index) => (
            <MessageNotification
              key={index}
              message={message}
              onClose={() => removeMessage(message)}
            />
          ))}
        </div>
      )}

      {/* Privacy Controls */}
      <PrivacyControls onClearData={handleClearData} onMessage={addMessage} />

      {/* Storage Usage */}
      <StorageUsageDisplay usage={storageUsage} />

      {/* Export Section */}
      <ExportSection moodEntries={moodEntries} onMessage={addMessage} />

      {/* Import Section */}
      <ImportSection onImport={handleImport} onMessage={addMessage} />

      {/* Help Section */}
      <div className="card p-6 bg-muted/50">
        <h3 className="text-lg font-semibold text-foreground mb-4">Data Management Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Export Best Practices</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Export regularly to create backups</li>
              <li>• Use JSON format for complete data restoration</li>
              <li>• CSV format is great for data analysis in Excel</li>
              <li>• Store exports in a secure location</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Import Guidelines</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Only import files exported from CampusThrive</li>
              <li>• Import will validate data integrity automatically</li>
              <li>• Consider backing up current data before importing</li>
              <li>• Check import results for any warnings or errors</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
