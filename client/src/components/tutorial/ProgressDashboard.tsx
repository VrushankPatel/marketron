import { useTutorialStore } from '@/stores/useTutorialStore';
import { achievements, tutorials } from '@/data/tutorials';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Award,
  BookOpen,
  TrendingUp,
  Clock,
  Target,
} from 'lucide-react';

export function ProgressDashboard() {
  const {
    completedTutorials,
    totalPoints,
    stats,
    achievements: userAchievements,
  } = useTutorialStore();

  const tutorialProgress = (completedTutorials.length / tutorials.length) * 100;
  const unlockedAchievements = userAchievements.filter((a) => a.unlocked);
  const achievementProgress = (unlockedAchievements.length / achievements.length) * 100;

  const achievementsByCategory = (category: string) => {
    return achievements.filter((a) => a.category === category);
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {unlockedAchievements.length} achievements unlocked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-cyan-500" />
              Tutorial Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {completedTutorials.length}/{tutorials.length}
            </div>
            <Progress value={tutorialProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Trading Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Orders:</span>
                <span className="font-semibold">{stats.ordersPlaced}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trades:</span>
                <span className="font-semibold">{stats.tradesExecuted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Instruments:</span>
                <span className="font-semibold">{stats.instrumentsTraded.size}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Achievements
              </CardTitle>
              <CardDescription>
                Track your progress and unlock rewards
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {Math.round(achievementProgress)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="trading">Trading</TabsTrigger>
              <TabsTrigger value="learning">Learning</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="risk">Risk</TabsTrigger>
              <TabsTrigger value="mastery">Mastery</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {achievements.map((achievement) => {
                    const userAchievement = userAchievements.find(
                      (a) => a.id === achievement.id
                    );
                    const isUnlocked = userAchievement?.unlocked || false;

                    return (
                      <Card
                        key={achievement.id}
                        className={`${
                          isUnlocked
                            ? 'border-yellow-500/50 bg-yellow-500/5'
                            : 'opacity-60'
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-3">
                            <div className="text-3xl">{achievement.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">
                                  {achievement.title}
                                </h4>
                                {isUnlocked && (
                                  <Badge
                                    variant="outline"
                                    className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs"
                                  >
                                    +{achievement.points}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {achievement.description}
                              </p>
                              {isUnlocked && userAchievement?.unlockedAt && (
                                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
            {['trading', 'learning', 'analysis', 'risk', 'mastery'].map((category) => (
              <TabsContent key={category} value={category}>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {achievementsByCategory(category).map((achievement) => {
                      const userAchievement = userAchievements.find(
                        (a) => a.id === achievement.id
                      );
                      const isUnlocked = userAchievement?.unlocked || false;

                      return (
                        <Card
                          key={achievement.id}
                          className={`${
                            isUnlocked
                              ? 'border-yellow-500/50 bg-yellow-500/5'
                              : 'opacity-60'
                          }`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-3">
                              <div className="text-3xl">{achievement.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-sm">
                                    {achievement.title}
                                  </h4>
                                  {isUnlocked && (
                                    <Badge
                                      variant="outline"
                                      className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs"
                                    >
                                      +{achievement.points}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {achievement.description}
                                </p>
                                {isUnlocked && userAchievement?.unlockedAt && (
                                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(userAchievement.unlockedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
