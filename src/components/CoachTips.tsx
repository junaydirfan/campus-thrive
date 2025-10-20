/**
 * CampusThrive Coach Tips Component
 * 
 * Displays intelligent, contextual coaching tips based on:
 * - Current mood state analysis
 * - Recent tags and patterns
 * - Time of day considerations
 * - User preferences and history
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CoachEngine, TipCategory } from '@/lib/coach';
import { CoachTip } from '@/types';
import { useMoodEntries } from '@/hooks/useLocalStorage';
import { 
  Lightbulb, 
  CheckCircle, 
  Star, 
  StarOff,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

/**
 * Individual tip card component
 */
interface TipCardProps {
  tip: CoachTip;
  isFavorited: boolean;
  isCompleted: boolean;
  onToggleFavorite: (tipId: string) => void;
  onMarkCompleted: (tipId: string) => void;
  index: number;
}

function TipCard({ tip, isFavorited, isCompleted, onToggleFavorite, onMarkCompleted, index }: TipCardProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMarkCompleted = useCallback(() => {
    setIsAnimating(true);
    onMarkCompleted(tip.id);
    setTimeout(() => setIsAnimating(false), 300);
  }, [tip.id, onMarkCompleted]);

  const handleToggleFavorite = useCallback(() => {
    onToggleFavorite(tip.id);
  }, [tip.id, onToggleFavorite]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      [TipCategory.STRESS_MANAGEMENT]: 'bg-red-100 text-red-800 border-red-200',
      [TipCategory.MOOD_BOOST]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [TipCategory.FOCUS_ENHANCEMENT]: 'bg-blue-100 text-blue-800 border-blue-200',
      [TipCategory.ENERGY_MANAGEMENT]: 'bg-orange-100 text-orange-800 border-orange-200',
      [TipCategory.SLEEP_RECOVERY]: 'bg-purple-100 text-purple-800 border-purple-200',
      [TipCategory.SOCIAL_CONNECTION]: 'bg-green-100 text-green-800 border-green-200',
      [TipCategory.EXAM_PREP]: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      [TipCategory.PRODUCTIVITY]: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      [TipCategory.MINDFULNESS]: 'bg-pink-100 text-pink-800 border-pink-200',
      [TipCategory.PHYSICAL_WELLNESS]: 'bg-teal-100 text-teal-800 border-teal-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <div 
      className={`card transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
        isAnimating ? 'animate-pulse' : ''
      } ${isCompleted ? 'opacity-75 bg-green-50 border-green-200' : ''}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="card-content pt-2">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 pt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(tip.category)}`}>
                  {tip.category.replace('_', ' ').toUpperCase()}
                </span>
                {getPriorityIcon(tip.priority)}
              </div>
              <h3 className="font-semibold text-foreground">Coaching Tip</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                isFavorited 
                  ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorited ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
            </button>
            
            {!isCompleted && (
              <button
                onClick={handleMarkCompleted}
                className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                title="Mark as completed"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <p className="text-foreground leading-relaxed">
            {tip.content}
          </p>
          
          {tip.suggestedAction && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">Suggested Action:</p>
                  <p className="text-sm text-blue-700">{tip.suggestedAction}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>~{tip.duration} minute{tip.duration !== 1 ? 's' : ''}</span>
          </div>
          
          {isCompleted && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Completed</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Main Coach Tips Component
 */
export function CoachTips() {
  const [tips, setTips] = useState<CoachTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<TipCategory | 'all'>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  const [showMoreTips, setShowMoreTips] = useState(false);
  const [allRelevantTips, setAllRelevantTips] = useState<CoachTip[]>([]);
  const [coachEngine] = useState(() => {
    // Only initialize on client side
    if (typeof window === 'undefined') {
      return null;
    }
    return CoachEngine.getInstance();
  });

  const moodEntries = useMoodEntries();


  // Load personalized tips using smart selection
  const loadPersonalizedTips = useCallback(() => {
    if (!coachEngine) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const entries = moodEntries.value;
      const currentEntry = entries.length > 0 ? entries[entries.length - 1] : null;
      const recentEntries = entries.slice(-7); // Last 7 entries for context
      
      // Don't show tips if there are no entries
      if (entries.length === 0) {
        setAllRelevantTips([]);
        setTips([]);
        return;
      }
      
      // Use smart tip selection - get more tips for "show more" functionality
      let allRelevantTips = coachEngine.selectRelevantTips(currentEntry, recentEntries, 8);
      
      // Filter by category if selected
      if (selectedCategory !== 'all') {
        allRelevantTips = allRelevantTips.filter(tip => tip.category === selectedCategory);
      }
      
      // Filter completed tips if needed
      if (!showCompleted) {
        allRelevantTips = allRelevantTips.filter(tip => !coachEngine.isTipCompleted(tip.id));
      }
      
      // Store all relevant tips
      setAllRelevantTips(allRelevantTips);
      
      // Show first 3 tips by default
      setTips(allRelevantTips.slice(0, 3));
    } catch (error) {
      console.error('Error loading tips:', error);
      setTips([]);
    } finally {
      setIsLoading(false);
    }
  }, [coachEngine, moodEntries.value, selectedCategory, showCompleted]);

  // Load tips on mount and when dependencies change
  useEffect(() => {
    loadPersonalizedTips();
  }, [loadPersonalizedTips]);

  // Handle tip actions
  const handleToggleFavorite = useCallback((tipId: string) => {
    if (!coachEngine) return;
    coachEngine.toggleTipFavorite(tipId);
    loadPersonalizedTips(); // Refresh to update UI
  }, [coachEngine, loadPersonalizedTips]);

  const handleMarkCompleted = useCallback((tipId: string) => {
    if (!coachEngine) return;
    coachEngine.markTipCompleted(tipId);
    loadPersonalizedTips(); // Refresh to update UI
  }, [coachEngine, loadPersonalizedTips]);

  const handleRefreshTips = useCallback(() => {
    loadPersonalizedTips();
  }, [loadPersonalizedTips]);

  const handleClearCompleted = useCallback(() => {
    if (!coachEngine) return;
    coachEngine.clearCompletedTips();
    loadPersonalizedTips();
  }, [coachEngine, loadPersonalizedTips]);

  const handleShowMoreTips = useCallback(() => {
    setShowMoreTips(true);
    setTips(allRelevantTips);
  }, [allRelevantTips]);

  const handleShowLessTips = useCallback(() => {
    setShowMoreTips(false);
    setTips(allRelevantTips.slice(0, 3));
  }, [allRelevantTips]);

  // Get user stats
  const userStats = coachEngine ? coachEngine.getUserStats() : { favorites: 0, completed: 0, total: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Personalized Coaching</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {moodEntries.value.length === 0 
            ? "Complete your first mood check-in to get personalized coaching tips based on your wellness patterns."
            : "Hand-picked tips based on your current mood state, recent patterns, and time of day. Each tip is actionable within 1-10 minutes."
          }
        </p>
      </div>

      {/* Stats and Controls - only show when there are entries */}
      {moodEntries.value.length > 0 && (
        <div className="card">
          <div className="card-content">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div className="text-center flex flex-col justify-center min-h-[50px]">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{userStats.favorites}</div>
                  <div className="text-sm text-muted-foreground">Favorites</div>
                </div>
                <div className="text-center flex flex-col justify-center min-h-[50px]">
                  <div className="text-2xl font-bold text-green-600 mb-1">{userStats.completed}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center flex flex-col justify-center min-h-[50px]">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{userStats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Tips</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as TipCategory | 'all')}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="all">All Categories</option>
                  {coachEngine && coachEngine.getAllCategories().map(category => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-foreground">Show completed</span>
                </label>

                <button
                  onClick={handleRefreshTips}
                  className="btn btn-secondary btn-lg flex items-center gap-3 px-4 py-2 text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>

                {userStats.completed > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    className="btn btn-outline btn-lg flex items-center gap-3 px-4 py-2 text-sm font-medium"
                  >
                    Clear Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Analyzing your mood state...</p>
          </div>
        </div>
      ) : tips.length === 0 ? (
        <div className="card">
          <div className="card-content text-center py-12">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {moodEntries.value.length === 0 ? 'No Tips Yet' : 'No Tips Available'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {moodEntries.value.length === 0 
                ? 'Complete your first mood check-in to get personalized coaching tips.'
                : selectedCategory !== 'all' 
                  ? `No tips found for ${selectedCategory.replace('_', ' ')} category.`
                  : 'No personalized tips available at the moment.'
              }
            </p>
            {moodEntries.value.length > 0 && (
              <button
                onClick={handleRefreshTips}
                className="btn btn-primary btn-lg px-6 py-3 text-base font-medium"
              >
                Refresh Tips
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <TipCard
              key={tip.id}
              tip={tip}
              isFavorited={coachEngine ? coachEngine.isTipFavorited(tip.id) : false}
              isCompleted={coachEngine ? coachEngine.isTipCompleted(tip.id) : false}
              onToggleFavorite={handleToggleFavorite}
              onMarkCompleted={handleMarkCompleted}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Show More/Less Tips Button */}
      {!isLoading && allRelevantTips.length > 3 && (
        <div className="text-center">
          {!showMoreTips ? (
            <button
              onClick={handleShowMoreTips}
              className="btn btn-outline btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium mx-auto"
            >
              <Sparkles className="w-5 h-5" />
              Show More Tips ({allRelevantTips.length - 3} more)
            </button>
          ) : (
            <button
              onClick={handleShowLessTips}
              className="btn btn-outline btn-lg flex items-center gap-3 px-6 py-3 text-base font-medium mx-auto"
            >
              Show Less Tips
            </button>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="text-center text-sm text-muted-foreground">
        <p>
          Tips are generated based on your current mood state, recent tags, and time of day. 
          Mark tips as completed to avoid repetition and favorite helpful ones for easy access.
        </p>
      </div>
    </div>
  );
}
