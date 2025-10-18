import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string; // Action required to complete this step
  validation?: () => boolean; // Function to validate step completion
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: 'basics' | 'trading' | 'analysis' | 'risk' | 'advanced';
  steps: TutorialStep[];
  prerequisites?: string[]; // IDs of tutorials that must be completed first
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'trading' | 'learning' | 'analysis' | 'risk' | 'mastery';
  condition: () => boolean;
  unlocked: boolean;
  unlockedAt?: Date;
  points: number;
}

interface TutorialState {
  // Tutorial progress
  activeTutorial: Tutorial | null;
  currentStepIndex: number;
  completedTutorials: string[];
  tutorialHistory: { tutorialId: string; completedAt: Date }[];
  
  // Achievements
  achievements: Achievement[];
  totalPoints: number;
  
  // UI state
  isTutorialActive: boolean;
  showAchievementNotification: Achievement | null;
  highlightedElement: string | null;
  
  // User progress tracking
  stats: {
    ordersPlaced: number;
    tradesExecuted: number;
    instrumentsTraded: Set<string>;
    tutorialsCompleted: number;
    achievementsUnlocked: number;
    totalSessionTime: number;
    lastActiveDate: Date | null;
  };
  
  // Actions
  initializeAchievements: (achievementDefs: Achievement[]) => void;
  startTutorial: (tutorial: Tutorial) => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  completeTutorial: () => void;
  resetTutorial: () => void;
  
  // Achievement actions
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => void;
  dismissAchievementNotification: () => void;
  
  // Progress tracking
  incrementOrdersPlaced: () => void;
  incrementTradesExecuted: () => void;
  addInstrumentTraded: (symbol: string) => void;
  updateSessionTime: (minutes: number) => void;
  
  // Utility
  getTutorialProgress: (tutorialId: string) => number;
  getAvailableTutorials: (allTutorials: Tutorial[]) => Tutorial[];
  resetAllProgress: () => void;
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeTutorial: null,
      currentStepIndex: 0,
      completedTutorials: [],
      tutorialHistory: [],
      achievements: [],
      totalPoints: 0,
      isTutorialActive: false,
      showAchievementNotification: null,
      highlightedElement: null,
      
      stats: {
        ordersPlaced: 0,
        tradesExecuted: 0,
        instrumentsTraded: new Set<string>(),
        tutorialsCompleted: 0,
        achievementsUnlocked: 0,
        totalSessionTime: 0,
        lastActiveDate: null,
      },
      
      // Achievement initialization
      initializeAchievements: (achievementDefs) => {
        const { achievements: persistedAchievements } = get();
        
        // Merge persisted unlock status with fresh achievement definitions
        const mergedAchievements = achievementDefs.map(def => {
          const persisted = persistedAchievements.find(a => a.id === def.id);
          if (persisted && persisted.unlocked) {
            return {
              ...def,
              unlocked: persisted.unlocked,
              unlockedAt: persisted.unlockedAt ? new Date(persisted.unlockedAt) : undefined,
            };
          }
          return def;
        });
        
        set({ achievements: mergedAchievements });
      },
      
      // Tutorial actions
      startTutorial: (tutorial) => {
        set({
          activeTutorial: tutorial,
          currentStepIndex: 0,
          isTutorialActive: true,
          highlightedElement: tutorial.steps[0]?.target || null,
        });
      },
      
      nextStep: () => {
        const { activeTutorial, currentStepIndex } = get();
        if (!activeTutorial) return;
        
        const nextIndex = currentStepIndex + 1;
        
        if (nextIndex >= activeTutorial.steps.length) {
          get().completeTutorial();
        } else {
          set({
            currentStepIndex: nextIndex,
            highlightedElement: activeTutorial.steps[nextIndex]?.target || null,
          });
        }
      },
      
      previousStep: () => {
        const { currentStepIndex, activeTutorial } = get();
        if (currentStepIndex > 0 && activeTutorial) {
          const prevIndex = currentStepIndex - 1;
          set({
            currentStepIndex: prevIndex,
            highlightedElement: activeTutorial.steps[prevIndex]?.target || null,
          });
        }
      },
      
      skipTutorial: () => {
        set({
          activeTutorial: null,
          currentStepIndex: 0,
          isTutorialActive: false,
          highlightedElement: null,
        });
      },
      
      completeTutorial: () => {
        const { activeTutorial, completedTutorials, tutorialHistory, stats } = get();
        if (!activeTutorial) return;
        
        const newCompleted = [...completedTutorials];
        if (!newCompleted.includes(activeTutorial.id)) {
          newCompleted.push(activeTutorial.id);
        }
        
        set({
          completedTutorials: newCompleted,
          tutorialHistory: [
            ...tutorialHistory,
            { tutorialId: activeTutorial.id, completedAt: new Date() },
          ],
          activeTutorial: null,
          currentStepIndex: 0,
          isTutorialActive: false,
          highlightedElement: null,
          stats: {
            ...stats,
            tutorialsCompleted: stats.tutorialsCompleted + 1,
          },
        });
        
        // Check for achievements after completing tutorial
        setTimeout(() => get().checkAchievements(), 100);
      },
      
      resetTutorial: () => {
        const { activeTutorial } = get();
        if (activeTutorial) {
          set({
            currentStepIndex: 0,
            highlightedElement: activeTutorial.steps[0]?.target || null,
          });
        }
      },
      
      // Achievement actions
      checkAchievements: () => {
        const { achievements } = get();
        achievements.forEach((achievement) => {
          if (!achievement.unlocked && achievement.condition()) {
            get().unlockAchievement(achievement.id);
          }
        });
      },
      
      unlockAchievement: (achievementId) => {
        const { achievements, totalPoints, stats } = get();
        const achievement = achievements.find((a) => a.id === achievementId);
        
        if (achievement && !achievement.unlocked) {
          const updatedAchievements = achievements.map((a) =>
            a.id === achievementId
              ? { ...a, unlocked: true, unlockedAt: new Date() }
              : a
          );
          
          set({
            achievements: updatedAchievements,
            totalPoints: totalPoints + achievement.points,
            showAchievementNotification: { ...achievement, unlocked: true, unlockedAt: new Date() },
            stats: {
              ...stats,
              achievementsUnlocked: stats.achievementsUnlocked + 1,
            },
          });
          
          // Auto-dismiss notification after 5 seconds
          setTimeout(() => get().dismissAchievementNotification(), 5000);
        }
      },
      
      dismissAchievementNotification: () => {
        set({ showAchievementNotification: null });
      },
      
      // Progress tracking
      incrementOrdersPlaced: () => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            ordersPlaced: stats.ordersPlaced + 1,
            lastActiveDate: new Date(),
          },
        });
        get().checkAchievements();
      },
      
      incrementTradesExecuted: () => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            tradesExecuted: stats.tradesExecuted + 1,
            lastActiveDate: new Date(),
          },
        });
        get().checkAchievements();
      },
      
      addInstrumentTraded: (symbol) => {
        const { stats } = get();
        const newSet = new Set(stats.instrumentsTraded);
        newSet.add(symbol);
        set({
          stats: {
            ...stats,
            instrumentsTraded: newSet,
            lastActiveDate: new Date(),
          },
        });
        get().checkAchievements();
      },
      
      updateSessionTime: (minutes) => {
        const { stats } = get();
        set({
          stats: {
            ...stats,
            totalSessionTime: stats.totalSessionTime + minutes,
            lastActiveDate: new Date(),
          },
        });
      },
      
      // Utility
      getTutorialProgress: (tutorialId) => {
        const { completedTutorials } = get();
        return completedTutorials.includes(tutorialId) ? 100 : 0;
      },
      
      getAvailableTutorials: (allTutorials) => {
        const { completedTutorials } = get();
        return allTutorials.filter((tutorial) => {
          // Check if prerequisites are met
          if (tutorial.prerequisites) {
            return tutorial.prerequisites.every((prereq) =>
              completedTutorials.includes(prereq)
            );
          }
          return true;
        });
      },
      
      resetAllProgress: () => {
        set({
          activeTutorial: null,
          currentStepIndex: 0,
          completedTutorials: [],
          tutorialHistory: [],
          totalPoints: 0,
          isTutorialActive: false,
          showAchievementNotification: null,
          highlightedElement: null,
          stats: {
            ordersPlaced: 0,
            tradesExecuted: 0,
            instrumentsTraded: new Set<string>(),
            tutorialsCompleted: 0,
            achievementsUnlocked: 0,
            totalSessionTime: 0,
            lastActiveDate: null,
          },
        });
      },
    }),
    {
      name: 'tutorial-storage',
      partialize: (state) => ({
        completedTutorials: state.completedTutorials,
        tutorialHistory: state.tutorialHistory,
        // Only store achievement metadata, not the condition functions
        achievements: state.achievements.map(a => ({
          id: a.id,
          unlocked: a.unlocked,
          unlockedAt: a.unlockedAt,
        })),
        totalPoints: state.totalPoints,
        stats: {
          ...state.stats,
          // Convert Set to Array for serialization
          instrumentsTraded: Array.from(state.stats.instrumentsTraded),
        },
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reconstruct Set from Array
          if (state.stats.instrumentsTraded) {
            state.stats.instrumentsTraded = new Set(state.stats.instrumentsTraded as any);
          }
          
          // Convert Date strings back to Date objects
          if (state.tutorialHistory) {
            state.tutorialHistory = state.tutorialHistory.map(entry => ({
              ...entry,
              completedAt: new Date(entry.completedAt),
            }));
          }
          
          if (state.stats.lastActiveDate) {
            state.stats.lastActiveDate = new Date(state.stats.lastActiveDate);
          }
          
          // Achievement conditions will be re-initialized by initializeAchievements
        }
      },
    }
  )
);
