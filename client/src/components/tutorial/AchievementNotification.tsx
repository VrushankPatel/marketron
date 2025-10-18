import { useEffect } from 'react';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AchievementNotification() {
  const { showAchievementNotification, dismissAchievementNotification } = useTutorialStore();

  useEffect(() => {
    if (showAchievementNotification) {
      // Play a sound or animation
      const audio = new Audio('/sounds/achievement.mp3'); // Optional: add achievement sound
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors
      });
    }
  }, [showAchievementNotification]);

  if (!showAchievementNotification) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[10001] animate-in slide-in-from-top-5">
      <Card className="w-[350px] border-2 border-yellow-500 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 shadow-2xl">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={dismissAchievementNotification}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{showAchievementNotification.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Achievement Unlocked!</CardTitle>
              </div>
              <CardDescription className="text-xs">
                +{showAchievementNotification.points} points
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {showAchievementNotification.category}
              </Badge>
              <h4 className="font-semibold">{showAchievementNotification.title}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              {showAchievementNotification.description}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
