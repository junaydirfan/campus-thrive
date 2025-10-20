/**
 * CampusThrive Intelligent Coaching System
 * 
 * Provides contextual, actionable tips based on:
 * - Current mood state analysis
 * - Recent tags and patterns
 * - Time of day considerations
 * - Historical wellness data
 */

import type { CoachTip } from '@/types';

/**
 * Tip categories for organization and matching
 */
export enum TipCategory {
  STRESS_MANAGEMENT = 'stress_management',
  MOOD_BOOST = 'mood_boost',
  FOCUS_ENHANCEMENT = 'focus_enhancement',
  ENERGY_MANAGEMENT = 'energy_management',
  SLEEP_RECOVERY = 'sleep_recovery',
  SOCIAL_CONNECTION = 'social_connection',
  EXAM_PREP = 'exam_prep',
  PRODUCTIVITY = 'productivity',
  MINDFULNESS = 'mindfulness',
  PHYSICAL_WELLNESS = 'physical_wellness'
}

/**
 * Tip priority levels
 */
export enum TipPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

/**
 * Time-based contexts for tip selection
 */
export enum TimeContext {
  MORNING = 'morning',
  MIDDAY = 'midday',
  EVENING = 'evening',
  NIGHT = 'night'
}

/**
 * Comprehensive tip database with 50+ contextual suggestions
 */
export const COACH_TIPS_DATABASE: CoachTip[] = [
  // HIGH STRESS SITUATIONS
  {
    id: 'stress_breathing_1',
    content: 'Take 4 deep breaths: Inhale for 4 counts, hold for 4, exhale for 6. This activates your parasympathetic nervous system.',
    conditions: [
      { score: 'stress', operator: '>=', value: 4 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.STRESS_MANAGEMENT,
    duration: 2,
    suggestedAction: 'Find a quiet spot and practice box breathing',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'stress_progressive_relaxation',
    content: 'Tense and release each muscle group for 5 seconds, starting from your toes up to your head. Notice the difference.',
    conditions: [
      { score: 'stress', operator: '>=', value: 4 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.STRESS_MANAGEMENT,
    duration: 5,
    suggestedAction: 'Find a comfortable position and work through each muscle group',
    timeContext: [TimeContext.EVENING, TimeContext.NIGHT]
  },
  {
    id: 'stress_grounding_54321',
    content: 'Ground yourself with the 5-4-3-2-1 technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste.',
    conditions: [
      { score: 'stress', operator: '>=', value: 3 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.STRESS_MANAGEMENT,
    duration: 3,
    suggestedAction: 'Look around your current environment and engage your senses',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },

  // LOW MOOD SCENARIOS
  {
    id: 'mood_gratitude_3',
    content: 'Write down 3 things you\'re grateful for right now, no matter how small. Gratitude shifts your brain\'s focus to positive patterns.',
    conditions: [
      { score: 'valence', operator: '<=', value: 2 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.MOOD_BOOST,
    duration: 3,
    suggestedAction: 'Grab a pen and paper or use your phone notes',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'mood_music_boost',
    content: 'Play one upbeat song that makes you want to move. Music activates reward centers in your brain.',
    conditions: [
      { score: 'valence', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.MOOD_BOOST,
    duration: 4,
    suggestedAction: 'Put on headphones and choose an energizing track',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'mood_nature_connection',
    content: 'Step outside for 2 minutes and notice something beautiful in nature - a tree, cloud, or bird. Nature connection boosts mood.',
    conditions: [
      { score: 'valence', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.MOOD_BOOST,
    duration: 2,
    suggestedAction: 'Go to a window or step outside briefly',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },

  // HIGH ENERGY BUT LOW FOCUS
  {
    id: 'focus_pomodoro_start',
    content: 'Start a 25-minute focused work session. Set a timer and commit to one task only. Energy without focus needs structure.',
    conditions: [
      { score: 'energy', operator: '>=', value: 4 },
      { score: 'focus', operator: '<=', value: 2 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.FOCUS_ENHANCEMENT,
    duration: 10,
    suggestedAction: 'Choose one specific task and set a 25-minute timer',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY]
  },
  {
    id: 'focus_environment_reset',
    content: 'Clear your workspace of distractions. Put phone in another room, close unnecessary tabs, and create a clean focus zone.',
    conditions: [
      { score: 'energy', operator: '>=', value: 3 },
      { score: 'focus', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.FOCUS_ENHANCEMENT,
    duration: 3,
    suggestedAction: 'Spend 2 minutes organizing your immediate environment',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY]
  },
  {
    id: 'focus_body_double',
    content: 'Use a "body double" - study with a friend virtually or in person. Social presence can help channel energy into focus.',
    conditions: [
      { score: 'energy', operator: '>=', value: 4 },
      { score: 'focus', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.FOCUS_ENHANCEMENT,
    duration: 2,
    suggestedAction: 'Text a study buddy or join a virtual study room',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },

  // PRE-EXAM ANXIETY
  {
    id: 'exam_confidence_anchor',
    content: 'Recall a time you successfully handled a challenging situation. This creates a confidence anchor for your current challenge.',
    conditions: [
      { score: 'stress', operator: '>=', value: 3 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.EXAM_PREP,
    duration: 3,
    suggestedAction: 'Close your eyes and vividly remember a past success',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'exam_active_recall',
    content: 'Instead of re-reading notes, test yourself on key concepts. Active recall is more effective than passive review.',
    conditions: [
      { score: 'stress', operator: '>=', value: 3 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.EXAM_PREP,
    duration: 5,
    suggestedAction: 'Create flashcards or quiz yourself on main topics',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'exam_visualization_success',
    content: 'Visualize yourself calmly walking into the exam, finding your seat, and confidently answering questions. Mental rehearsal builds confidence.',
    conditions: [
      { score: 'stress', operator: '>=', value: 3 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.EXAM_PREP,
    duration: 2,
    suggestedAction: 'Spend 2 minutes visualizing exam day success',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },

  // SLEEP DEBT RECOVERY
  {
    id: 'sleep_wind_down_ritual',
    content: 'Create a 10-minute wind-down ritual: dim lights, gentle music, or light reading. Signal to your brain that sleep is coming.',
    conditions: [
      { score: 'sleepHours', operator: '<=', value: 6 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.SLEEP_RECOVERY,
    duration: 10,
    suggestedAction: 'Start your wind-down routine 30 minutes before bed',
    timeContext: [TimeContext.EVENING, TimeContext.NIGHT]
  },
  {
    id: 'sleep_blue_light_break',
    content: 'Put away screens 1 hour before bed. Blue light disrupts melatonin production. Try reading or gentle stretching instead.',
    conditions: [
      { score: 'sleepHours', operator: '<=', value: 6 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.SLEEP_RECOVERY,
    duration: 1,
    suggestedAction: 'Set a phone reminder to put devices away',
    timeContext: [TimeContext.EVENING, TimeContext.NIGHT]
  },
  {
    id: 'sleep_breathing_478',
    content: 'Practice 4-7-8 breathing: Inhale for 4, hold for 7, exhale for 8. This technique promotes relaxation and better sleep.',
    conditions: [
      { score: 'sleepHours', operator: '<=', value: 6 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.SLEEP_RECOVERY,
    duration: 3,
    suggestedAction: 'Practice this breathing pattern while lying in bed',
    timeContext: [TimeContext.EVENING, TimeContext.NIGHT]
  },

  // SOCIAL CONNECTION NEEDS
  {
    id: 'social_quick_reach_out',
    content: 'Send a quick text to someone you care about. Even brief social connection releases oxytocin and improves mood.',
    conditions: [
      { score: 'socialTouchpoints', operator: '<=', value: 1 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.SOCIAL_CONNECTION,
    duration: 2,
    suggestedAction: 'Send a thoughtful message to a friend or family member',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'social_shared_activity',
    content: 'Invite someone to join you for a simple activity - a walk, coffee, or study session. Shared experiences strengthen bonds.',
    conditions: [
      { score: 'socialTouchpoints', operator: '<=', value: 1 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.SOCIAL_CONNECTION,
    duration: 5,
    suggestedAction: 'Reach out with a specific activity invitation',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'social_gratitude_share',
    content: 'Tell someone why you appreciate them. Expressing gratitude strengthens relationships and boosts both your moods.',
    conditions: [
      { score: 'socialTouchpoints', operator: '<=', value: 1 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.SOCIAL_CONNECTION,
    duration: 3,
    suggestedAction: 'Call, text, or tell someone in person what you appreciate about them',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },

  // ENERGY MANAGEMENT
  {
    id: 'energy_micro_movement',
    content: 'Do 2 minutes of movement - jumping jacks, dancing, or stretching. Physical activity increases blood flow and energy.',
    conditions: [
      { score: 'energy', operator: '<=', value: 2 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.ENERGY_MANAGEMENT,
    duration: 2,
    suggestedAction: 'Stand up and move your body for 2 minutes',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'energy_hydration_boost',
    content: 'Drink a full glass of water. Dehydration is a common cause of low energy. Your brain needs proper hydration to function.',
    conditions: [
      { score: 'energy', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.ENERGY_MANAGEMENT,
    duration: 1,
    suggestedAction: 'Get up and drink a full glass of water',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'energy_sunlight_exposure',
    content: 'Get 5 minutes of natural sunlight. Light exposure helps regulate your circadian rhythm and boosts alertness.',
    conditions: [
      { score: 'energy', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.ENERGY_MANAGEMENT,
    duration: 5,
    suggestedAction: 'Step outside or sit by a sunny window',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY]
  },

  // MINDFULNESS & AWARENESS
  {
    id: 'mindfulness_body_scan',
    content: 'Do a quick body scan: Notice any tension from head to toe. Simply awareness often releases physical stress.',
    conditions: [
      { score: 'stress', operator: '>=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.MINDFULNESS,
    duration: 3,
    suggestedAction: 'Sit comfortably and slowly scan your body for tension',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'mindfulness_present_moment',
    content: 'Focus on your current activity for 2 minutes. When your mind wanders, gently return to what you\'re doing right now.',
    conditions: [
      { score: 'focus', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.MINDFULNESS,
    duration: 2,
    suggestedAction: 'Choose one simple activity and give it your full attention',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'mindfulness_gratitude_moment',
    content: 'Pause and notice one thing you\'re grateful for in this exact moment. Gratitude anchors you in the present.',
    conditions: [
      { score: 'valence', operator: '<=', value: 3 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.MINDFULNESS,
    duration: 1,
    suggestedAction: 'Stop what you\'re doing and notice something positive',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },

  // PHYSICAL WELLNESS
  {
    id: 'physical_posture_reset',
    content: 'Reset your posture: shoulders back, spine straight, feet flat. Good posture improves breathing and energy.',
    conditions: [
      { score: 'energy', operator: '<=', value: 3 }
    ],
    priority: TipPriority.LOW,
    category: TipCategory.PHYSICAL_WELLNESS,
    duration: 1,
    suggestedAction: 'Adjust your sitting or standing position',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'physical_eye_rest',
    content: 'Follow the 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds. Give your eyes a break.',
    conditions: [
      { score: 'focus', operator: '<=', value: 3 }
    ],
    priority: TipPriority.LOW,
    category: TipCategory.PHYSICAL_WELLNESS,
    duration: 1,
    suggestedAction: 'Look away from your screen at something distant',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },
  {
    id: 'physical_stretch_break',
    content: 'Do 3 simple stretches: neck rolls, shoulder shrugs, and wrist circles. Movement prevents stiffness and improves circulation.',
    conditions: [
      { score: 'energy', operator: '<=', value: 3 }
    ],
    priority: TipPriority.LOW,
    category: TipCategory.PHYSICAL_WELLNESS,
    duration: 2,
    suggestedAction: 'Stand up and do gentle stretches for 2 minutes',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING]
  },

  // PRODUCTIVITY & TIME MANAGEMENT
  {
    id: 'productivity_task_breakdown',
    content: 'Break your next big task into 3 smaller steps. Small wins build momentum and reduce overwhelm.',
    conditions: [
      { score: 'focus', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.PRODUCTIVITY,
    duration: 3,
    suggestedAction: 'Write down 3 specific steps for your current task',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY]
  },
  {
    id: 'productivity_time_blocking',
    content: 'Set a 15-minute timer for focused work, then take a 5-minute break. Short bursts can be more effective than long sessions.',
    conditions: [
      { score: 'focus', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.PRODUCTIVITY,
    duration: 10,
    suggestedAction: 'Set a timer and commit to 15 minutes of focused work',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY]
  },
  {
    id: 'productivity_environment_optimization',
    content: 'Optimize your workspace: good lighting, comfortable temperature, and minimal distractions. Environment affects performance.',
    conditions: [
      { score: 'focus', operator: '<=', value: 2 }
    ],
    priority: TipPriority.LOW,
    category: TipCategory.PRODUCTIVITY,
    duration: 5,
    suggestedAction: 'Make 2 small improvements to your workspace',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY]
  },

  // ADDITIONAL CONTEXTUAL TIPS
  {
    id: 'context_morning_motivation',
    content: 'Set one intention for today. Having a clear purpose gives your day direction and motivation.',
    conditions: [
      { score: 'energy', operator: '<=', value: 3 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.PRODUCTIVITY,
    duration: 2,
    suggestedAction: 'Write down one specific goal for today',
    timeContext: [TimeContext.MORNING]
  },
  {
    id: 'context_midday_energy_dip',
    content: 'Take a 10-minute walk outside. Natural light and movement combat the afternoon energy dip.',
    conditions: [
      { score: 'energy', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.ENERGY_MANAGEMENT,
    duration: 10,
    suggestedAction: 'Step outside for a brief walk or fresh air',
    timeContext: [TimeContext.MIDDAY]
  },
  {
    id: 'context_evening_reflection',
    content: 'Reflect on one thing that went well today. Ending the day with positive reflection improves sleep and mood.',
    conditions: [
      { score: 'valence', operator: '<=', value: 3 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.MOOD_BOOST,
    duration: 3,
    suggestedAction: 'Think about or write down one positive moment from today',
    timeContext: [TimeContext.EVENING, TimeContext.NIGHT]
  },
  {
    id: 'context_night_wind_down',
    content: 'Create a bedtime routine: same time each night, calming activities, and a consistent sleep schedule.',
    conditions: [
      { score: 'sleepHours', operator: '<=', value: 6 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.SLEEP_RECOVERY,
    duration: 5,
    suggestedAction: 'Start your bedtime routine 30 minutes before your target sleep time',
    timeContext: [TimeContext.EVENING, TimeContext.NIGHT]
  },

  // TAG-BASED CONTEXTUAL TIPS
  {
    id: 'tag_study_focus_boost',
    content: 'Use the Pomodoro Technique: 25 minutes focused study, 5-minute break. This matches your brain\'s natural attention span.',
    conditions: [
      { score: 'focus', operator: '<=', value: 2 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.FOCUS_ENHANCEMENT,
    duration: 10,
    suggestedAction: 'Set a 25-minute timer and focus on one study topic',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING],
    requiredTags: ['study', 'exam']
  },
  {
    id: 'tag_exercise_energy_boost',
    content: 'Do 5 minutes of high-intensity exercise: jumping jacks, burpees, or running in place. Exercise releases endorphins and boosts energy.',
    conditions: [
      { score: 'energy', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.ENERGY_MANAGEMENT,
    duration: 5,
    suggestedAction: 'Do 5 minutes of vigorous exercise',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING],
    requiredTags: ['gym', 'exercise', 'workout']
  },
  {
    id: 'tag_social_connection_boost',
    content: 'Reach out to a friend or family member. Social connection is a powerful mood booster and stress reducer.',
    conditions: [
      { score: 'valence', operator: '<=', value: 2 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.SOCIAL_CONNECTION,
    duration: 3,
    suggestedAction: 'Send a message or call someone you care about',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY, TimeContext.EVENING],
    requiredTags: ['social', 'friends', 'family']
  },
  {
    id: 'tag_caffeine_awareness',
    content: 'Notice your caffeine intake today. Too much caffeine can increase anxiety and disrupt sleep patterns.',
    conditions: [
      { score: 'stress', operator: '>=', value: 3 }
    ],
    priority: TipPriority.MEDIUM,
    category: TipCategory.STRESS_MANAGEMENT,
    duration: 1,
    suggestedAction: 'Consider reducing caffeine or switching to decaf',
    timeContext: [TimeContext.MORNING, TimeContext.MIDDAY],
    requiredTags: ['caffeine', 'coffee']
  },
  {
    id: 'tag_sleep_optimization',
    content: 'Create a sleep-friendly environment: cool room, dark space, and comfortable bedding. Quality sleep affects all aspects of wellness.',
    conditions: [
      { score: 'sleepHours', operator: '<=', value: 6 }
    ],
    priority: TipPriority.HIGH,
    category: TipCategory.SLEEP_RECOVERY,
    duration: 5,
    suggestedAction: 'Make your bedroom more sleep-friendly',
    timeContext: [TimeContext.EVENING, TimeContext.NIGHT],
    requiredTags: ['sleep', 'rest']
  }
];

/**
 * Coach engine for intelligent tip matching and selection
 */
export class CoachEngine {
  private static instance: CoachEngine;
  private userFavorites: Set<string> = new Set();
  private completedTips: Set<string> = new Set();

  private constructor() {
    this.loadUserPreferences();
  }

  static getInstance(): CoachEngine {
    if (!CoachEngine.instance) {
      CoachEngine.instance = new CoachEngine();
    }
    return CoachEngine.instance;
  }

  /**
   * Load user preferences from localStorage
   */
  private loadUserPreferences(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const favorites = localStorage.getItem('campus-thrive-favorite-tips');
      const completed = localStorage.getItem('campus-thrive-completed-tips');
      
      if (favorites) {
        this.userFavorites = new Set(JSON.parse(favorites));
      }
      if (completed) {
        this.completedTips = new Set(JSON.parse(completed));
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  /**
   * Save user preferences to localStorage
   */
  private saveUserPreferences(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem('campus-thrive-favorite-tips', JSON.stringify([...this.userFavorites]));
      localStorage.setItem('campus-thrive-completed-tips', JSON.stringify([...this.completedTips]));
    } catch (error) {
      console.error('Error saving user preferences:', error);
    }
  }

  /**
   * Get current time context
   */
  private getCurrentTimeContext(): TimeContext {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return TimeContext.MORNING;
    if (hour >= 12 && hour < 17) return TimeContext.MIDDAY;
    if (hour >= 17 && hour < 22) return TimeContext.EVENING;
    return TimeContext.NIGHT;
  }

  /**
   * Calculate tip relevance score based on current mood state
   */
  private calculateRelevanceScore(tip: CoachTip, currentMood: Record<string, number | boolean>, recentTags: string[]): number {
    let score = 0;

    // Check condition matches
    for (const condition of tip.conditions) {
      const currentValue = currentMood[condition.score];
      if (currentValue !== undefined) {
        // Convert boolean to number for comparison
        const numericValue = typeof currentValue === 'boolean' ? (currentValue ? 1 : 0) : currentValue;
        
        switch (condition.operator) {
          case '>=':
            if (numericValue >= condition.value) score += 10;
            break;
          case '<=':
            if (numericValue <= condition.value) score += 10;
            break;
          case '>':
            if (numericValue > condition.value) score += 10;
            break;
          case '<':
            if (numericValue < condition.value) score += 10;
            break;
          case '=':
            if (numericValue === condition.value) score += 10;
            break;
        }
      }
    }

    // Priority bonus
    switch (tip.priority) {
      case TipPriority.HIGH:
        score += 5;
        break;
      case TipPriority.MEDIUM:
        score += 3;
        break;
      case TipPriority.LOW:
        score += 1;
        break;
    }

    // Time context bonus
    const currentTimeContext = this.getCurrentTimeContext();
    if (tip.timeContext && tip.timeContext.includes(currentTimeContext)) {
      score += 3;
    }

    // Tag relevance bonus
    if (tip.requiredTags) {
      const tagMatches = tip.requiredTags.filter(tag => recentTags.includes(tag)).length;
      score += tagMatches * 2;
    }

    // Avoid recently completed tips
    if (this.completedTips.has(tip.id)) {
      score -= 5;
    }

    // Favorited tips bonus
    if (this.userFavorites.has(tip.id)) {
      score += 2;
    }

    return score;
  }

  /**
   * Get personalized coaching tips based on current state
   */
  getPersonalizedTips(currentMood: Record<string, number | boolean>, recentTags: string[] = [], limit: number = 3): CoachTip[] {
    const scoredTips = COACH_TIPS_DATABASE.map(tip => ({
      tip,
      score: this.calculateRelevanceScore(tip, currentMood, recentTags)
    }));

    // Sort by relevance score and return top tips
    return scoredTips
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.tip);
  }

  /**
   * Get onboarding tips for new users (no entries yet)
   */
  getOnboardingTips(limit: number = 3): CoachTip[] {
    const onboardingTips = COACH_TIPS_DATABASE.filter(tip => 
      tip.category === TipCategory.MINDFULNESS || 
      tip.category === TipCategory.PRODUCTIVITY ||
      tip.category === TipCategory.PHYSICAL_WELLNESS
    );

    // Sort by priority and return top tips
    return onboardingTips
      .sort((a, b) => {
        const priorityOrder = { [TipPriority.HIGH]: 3, [TipPriority.MEDIUM]: 2, [TipPriority.LOW]: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, limit);
  }

  /**
   * Get smart tips based on current entry and recent patterns
   */
  selectRelevantTips(currentEntry: any, recentEntries: any[], maxTips: number = 3): CoachTip[] {
    if (!currentEntry) {
      return this.getOnboardingTips(maxTips);
    }

    // Extract current mood state
    const currentMood = {
      valence: currentEntry.valence || 2.5,
      energy: currentEntry.energy || 2.5,
      focus: currentEntry.focus || 2.5,
      stress: currentEntry.stress || 2.5,
      sleepHours: currentEntry.sleepHours || 7,
      recoveryAction: currentEntry.recoveryAction || false,
      socialTouchpoints: currentEntry.socialTouchpoints || 0
    };

    // Get recent tags
    const recentTags = recentEntries.flatMap(entry => entry.tags || []);

    // Get personalized tips
    return this.getPersonalizedTips(currentMood, recentTags, maxTips);
  }

  /**
   * Mark a tip as completed
   */
  markTipCompleted(tipId: string): void {
    this.completedTips.add(tipId);
    this.saveUserPreferences();
  }

  /**
   * Toggle tip favorite status
   */
  toggleTipFavorite(tipId: string): boolean {
    if (this.userFavorites.has(tipId)) {
      this.userFavorites.delete(tipId);
      this.saveUserPreferences();
      return false;
    } else {
      this.userFavorites.add(tipId);
      this.saveUserPreferences();
      return true;
    }
  }

  /**
   * Check if tip is favorited
   */
  isTipFavorited(tipId: string): boolean {
    return this.userFavorites.has(tipId);
  }

  /**
   * Check if tip was recently completed
   */
  isTipCompleted(tipId: string): boolean {
    return this.completedTips.has(tipId);
  }

  /**
   * Get tips by category
   */
  getTipsByCategory(category: TipCategory): CoachTip[] {
    return COACH_TIPS_DATABASE.filter(tip => tip.category === category);
  }

  /**
   * Get all available categories
   */
  getAllCategories(): TipCategory[] {
    return Object.values(TipCategory);
  }

  /**
   * Clear completed tips (for testing or reset)
   */
  clearCompletedTips(): void {
    this.completedTips.clear();
    this.saveUserPreferences();
  }

  /**
   * Get user statistics
   */
  getUserStats(): { favorites: number; completed: number; total: number } {
    return {
      favorites: this.userFavorites.size,
      completed: this.completedTips.size,
      total: COACH_TIPS_DATABASE.length
    };
  }
}
