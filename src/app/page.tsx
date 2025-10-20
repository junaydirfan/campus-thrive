'use client';

import { useState, useEffect, useMemo } from 'react';
import { Layout, PageContainer, Section } from "@/components/Layout";
import { DailyCheckin } from "@/components/DailyCheckin";
import { ScoresDisplay } from "@/components/ScoresDisplay";
import { CoachTips } from "@/components/CoachTips";
import { DemoMode } from "@/components/DemoMode";
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { MoodEntry } from '@/types';
import { 
  Calendar,
  Target,
  CheckCircle,
  BarChart3,
  Grid3X3,
  Download,
  Plus,
  Activity,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { format, isToday, isYesterday, differenceInDays, startOfDay } from 'date-fns';

/**
 * Dashboard statistics interface
 */
interface DashboardStats {
  streak: number;
  totalEntries: number;
  lastEntryDate: Date | null;
  hasEntryToday: boolean;
  averageMC: number;
  averageDSS: number;
  weeklyEntries: number;
}

/**
 * Recent entry preview component
 */
function RecentEntriesPreview({ entries }: { entries: MoodEntry[] }) {
  const recentEntries = entries.slice(-5).reverse();

  if (recentEntries.length === 0) {
    return (
      <div className="card p-6 text-center">
        <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No entries yet</h3>
        <p className="text-muted-foreground mb-4">
          Start tracking your wellness to see your recent entries here.
        </p>
        <button className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add First Entry
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Entries</h3>
        <span className="text-sm text-muted-foreground">{recentEntries.length} entries</span>
      </div>
      <div className="space-y-3">
        {recentEntries.map((entry) => {
          const entryDate = new Date(entry.timestamp);
          const isTodayEntry = isToday(entryDate);
          const isYesterdayEntry = isYesterday(entryDate);
          
          let dateLabel = '';
          if (isTodayEntry) {
            dateLabel = 'Today';
          } else if (isYesterdayEntry) {
            dateLabel = 'Yesterday';
          } else {
            dateLabel = format(entryDate, 'MMM dd');
          }

          const mc = (entry.valence + entry.energy + entry.focus + (5 - entry.stress)) / 4;

          return (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  mc >= 4 ? 'bg-green-500' : mc >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                  <div className="font-medium text-foreground">{dateLabel}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.timeBucket} • {entry.tags.slice(0, 2).join(', ')}
                    {entry.tags.length > 2 && ` +${entry.tags.length - 2} more`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">
                  MC: {mc.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {format(entryDate, 'h:mm a')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
        </div>
  );
}

/**
 * Quick action buttons component
 */
function QuickActions() {
  const actions = [
    {
      title: 'View Trends',
      description: 'See your progress over time',
      icon: <BarChart3 className="w-5 h-5" />,
      href: '/trends',
      color: 'text-blue-600'
    },
    {
      title: 'See Patterns',
      description: 'Discover activity drivers',
      icon: <Grid3X3 className="w-5 h-5" />,
      href: '/patterns',
      color: 'text-green-600'
    },
    {
      title: 'Export Data',
      description: 'Download your data',
      icon: <Download className="w-5 h-5" />,
      href: '/export',
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <a
          key={index}
          href={action.href}
          className="card p-4 hover:shadow-md transition-all duration-200 group cursor-pointer"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`${action.color}`}>
              {action.icon}
            </div>
            <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
              {action.title}
            </h4>
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-sm text-muted-foreground">{action.description}</p>
        </a>
      ))}
    </div>
  );
}

/**
 * Personalized welcome message component
 */
function WelcomeMessage({ stats }: { stats: DashboardStats }) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getPersonalizedMessage = () => {
    if (stats.totalEntries === 0) {
      return "Welcome to CampusThrive! Start your wellness journey by logging your first entry.";
    }
    
    if (stats.streak >= 7) {
      return `Amazing! You've maintained a ${stats.streak}-day streak. Keep up the great work!`;
    }
    
    if (stats.streak >= 3) {
      return `Great job! You're on a ${stats.streak}-day streak. Consistency is key!`;
    }
    
    if (stats.hasEntryToday) {
      return "You've already logged an entry today. How are you feeling now?";
    }
    
    if (stats.lastEntryDate) {
      const daysSince = differenceInDays(new Date(), stats.lastEntryDate);
      if (daysSince === 1) {
        return "Ready to continue your wellness journey? Log today's entry to keep your streak going!";
      } else if (daysSince <= 3) {
        return `It's been ${daysSince} days since your last entry. Time to get back on track!`;
      } else {
        return "Welcome back! Ready to restart your wellness tracking journey?";
      }
    }
    
    return "Ready to start tracking your wellness? Every entry helps you understand yourself better.";
  };

  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">{getGreeting()}!</h1>
      </div>
      <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
        {getPersonalizedMessage()}
      </p>
      {stats.streak > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span>{stats.streak}-day streak</span>
        </div>
      )}
    </div>
  );
}

/**
 * Dashboard statistics calculator
 */
function calculateDashboardStats(entries: MoodEntry[]): DashboardStats {
  if (entries.length === 0) {
    return {
      streak: 0,
      totalEntries: 0,
      lastEntryDate: null,
      hasEntryToday: false,
      averageMC: 0,
      averageDSS: 0,
      weeklyEntries: 0
    };
  }

  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const lastEntryDate = new Date(sortedEntries[0]?.timestamp || '');
  const hasEntryToday = isToday(lastEntryDate);

  // Calculate streak
  let streak = 0;
  const today = new Date();
  let currentDate = startOfDay(today);
  
  for (const entry of sortedEntries) {
    const entryDate = startOfDay(new Date(entry.timestamp));
    if (entryDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    } else if (entryDate.getTime() < currentDate.getTime()) {
      break;
    }
  }

  // Calculate averages
  const mcValues = entries.map(entry => 
    (entry.valence + entry.energy + entry.focus + (5 - entry.stress)) / 4
  );
  const averageMC = mcValues.reduce((sum, mc) => sum + mc, 0) / mcValues.length;

  const dssValues = entries.map(entry => {
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
  });
  const averageDSS = dssValues.reduce((sum, dss) => sum + dss, 0) / dssValues.length;

  // Calculate weekly entries
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyEntries = entries.filter(entry => 
    new Date(entry.timestamp) >= weekAgo
  ).length;

  return {
    streak,
    totalEntries: entries.length,
    lastEntryDate,
    hasEntryToday,
    averageMC,
    averageDSS,
    weeklyEntries
  };
}

/**
 * Main Dashboard component
 */
export default function Dashboard() {
  const { value: moodEntries } = useMoodEntries();
  const [isLoading, setIsLoading] = useState(true);
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [showLearnMore, setShowLearnMore] = useState(false);

  // Calculate dashboard statistics
  const stats = useMemo(() => calculateDashboardStats(moodEntries), [moodEntries]);

  // Simulate loading delay
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [moodEntries]);

  const handleStartTracking = () => {
    setShowGetStarted(true);
  };

  const handleLearnMore = () => {
    setShowLearnMore(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <PageContainer>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>

        {/* Welcome Header */}
        <Section 
          title=""
          description=""
        >
          <WelcomeMessage stats={stats} />
        </Section>

        {/* Get Started Section - Always at the top */}
        <Section title="Get Started" description="Begin your wellness journey">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Target className="w-12 h-12 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">Ready to Thrive?</h3>
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start tracking your wellness today and discover patterns that help you succeed. 
              It only takes 30 seconds to log your first entry.
            </p>
            <div className="flex flex-wrap gap-6 justify-center">
              <button 
                onClick={handleStartTracking}
                className="btn btn-primary btn-lg flex items-center gap-3 px-8 py-4 text-lg font-semibold"
              >
                <Plus className="w-6 h-6" />
                Start Tracking
              </button>
              <button 
                onClick={handleLearnMore}
                className="btn btn-outline btn-lg flex items-center gap-3 px-8 py-4 text-lg font-semibold"
              >
                <Activity className="w-6 h-6" />
                Learn More
              </button>
            </div>
          </div>
        </Section>

        {/* Quick Daily Check-in */}
        {(!stats.hasEntryToday || showGetStarted) && (
          <Section title="Quick Check-in" description="Log your current mood and activities">
            <DailyCheckin />
          </Section>
        )}

        {/* Demo Mode Section */}
        <Section>
          <DemoMode />
        </Section>

        {/* Current Scores */}
        <Section title="Your Wellness Scores" description="Track your progress and performance">
          <ScoresDisplay />
        </Section>

        {/* Coach Tips */}
        <Section title="Personalized Coaching" description="Get actionable tips based on your data">
          <CoachTips />
        </Section>

        {/* Recent Entries & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentEntriesPreview entries={moodEntries} />
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <QuickActions />
            </div>
            
            {/* Dashboard Stats */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Your Progress</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center flex flex-col justify-center min-h-[60px]">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{stats.streak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center flex flex-col justify-center min-h-[60px]">
                  <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalEntries}</div>
                  <div className="text-sm text-muted-foreground">Total Entries</div>
                </div>
                <div className="text-center flex flex-col justify-center min-h-[60px]">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{stats.weeklyEntries}</div>
                  <div className="text-sm text-muted-foreground">This Week</div>
                </div>
                <div className="text-center flex flex-col justify-center min-h-[60px]">
                  <div className="text-2xl font-bold text-orange-600 mb-1">{stats.averageMC.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Avg MC</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Learn More Modal */}
        {showLearnMore && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">About CampusThrive</h2>
                  <button 
                    onClick={() => setShowLearnMore(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">🔒 Privacy-First Design</h3>
                    <p className="text-muted-foreground">
                      All your data stays on your device. No external servers, no data collection, 
                      no analytics. Complete control over your personal information.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">📊 Comprehensive Tracking</h3>
                    <p className="text-muted-foreground">
                      Track mood across 4 dimensions (Valence, Energy, Focus, Stress), activities, 
                      sleep, social interactions, and more. Get insights into patterns that affect your wellness.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">🧠 Smart Scoring</h3>
                    <p className="text-muted-foreground">
                      Advanced algorithms calculate your Mood Composite (MC) and Daily Success Score (DSS) 
                      with personalized baselines and z-score normalization for meaningful insights.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">🤖 AI Coaching</h3>
                    <p className="text-muted-foreground">
                      Get personalized tips based on your mood patterns, activities, and goals. 
                      Over 50 tips across 10 categories to help you thrive.
                    </p>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => {
                        setShowLearnMore(false);
                        handleStartTracking();
                      }}
                      className="btn btn-primary btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium"
                    >
                      <Plus className="w-5 h-5" />
                      Start Tracking Now
                    </button>
                    <button 
                      onClick={() => setShowLearnMore(false)}
                      className="btn btn-outline btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </Layout>
  );
}