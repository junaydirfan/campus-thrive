/**
 * Daily Check-in Demo Page
 * 
 * Showcases the complete daily check-in interface
 * with all features and functionality.
 */

'use client';

import { DailyCheckin } from '@/components/DailyCheckin';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { Calendar, TrendingUp, BarChart3 } from 'lucide-react';

export function DailyCheckinDemo() {
  const moodEntries = useMoodEntries();

  // Calculate some basic stats
  const totalEntries = moodEntries.value.length;
  const todayEntries = moodEntries.value.filter(entry => {
    const today = new Date().toDateString();
    return new Date(entry.timestamp).toDateString() === today;
  }).length;

  const avgMood = moodEntries.value.length > 0 
    ? moodEntries.value.reduce((sum, entry) => {
        const mc = (entry.valence + entry.energy + entry.focus - entry.stress) / 4;
        return sum + mc;
      }, 0) / moodEntries.value.length
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">CampusThrive</h1>
              <p className="text-sm text-muted-foreground">Daily Check-in Interface</p>
            </div>
            
            {/* Quick Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{totalEntries} total</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{todayEntries} today</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Avg: {avgMood.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Introduction */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Complete Daily Check-in Experience
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the full daily check-in interface with mood tracking, 
              time bucket selection, quick tags, and optional day-end details.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3 p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Quick & Easy</h3>
              <p className="text-sm text-muted-foreground">
                30-second completion goal with intuitive interface
              </p>
            </div>
            
            <div className="text-center space-y-3 p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Real-time Scores</h3>
              <p className="text-sm text-muted-foreground">
                See MC and DSS scores update as you fill the form
              </p>
            </div>
            
            <div className="text-center space-y-3 p-6 bg-card border border-border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Auto-save Draft</h3>
              <p className="text-sm text-muted-foreground">
                Never lose your progress with automatic draft saving
              </p>
            </div>
          </div>

          {/* Daily Check-in Interface */}
          <div className="bg-card border border-border rounded-lg p-6">
            <DailyCheckin />
          </div>

          {/* Recent Entries Preview */}
          {moodEntries.value.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Recent Check-ins</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moodEntries.value.slice(-6).reverse().map((entry) => {
                  const mc = (entry.valence + entry.energy + entry.focus - entry.stress) / 4;
                  const dss = (entry.tasksCompleted || 0) * 0.4 + (entry.deepworkMinutes || 0) * 0.01 + mc * 0.3;
                  
                  return (
                    <div key={entry.id} className="p-4 bg-secondary/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {new Date(entry.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {entry.timeBucket}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">V:{entry.valence.toFixed(1)}</span>
                        <span className="text-orange-600">E:{entry.energy.toFixed(1)}</span>
                        <span className="text-blue-600">F:{entry.focus.toFixed(1)}</span>
                        <span className="text-red-600">S:{entry.stress.toFixed(1)}</span>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-blue-600">MC: {mc.toFixed(1)}</span>
                        <span className="text-green-600">DSS: {dss.toFixed(1)}</span>
                      </div>
                      
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {entry.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs bg-primary/10 text-primary px-1 rounded">
                              {tag}
                            </span>
                          ))}
                          {entry.tags.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{entry.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
