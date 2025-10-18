import { useState } from 'react';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { tutorials } from '@/data/tutorials';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, CheckCircle2, Lock, Play } from 'lucide-react';

export function TutorialMenu() {
  const [open, setOpen] = useState(false);
  const { startTutorial, completedTutorials, getAvailableTutorials } = useTutorialStore();

  const availableTutorials = getAvailableTutorials(tutorials);
  const categories = ['basics', 'trading', 'analysis', 'risk', 'advanced'] as const;

  const handleStartTutorial = (tutorial: any) => {
    startTutorial(tutorial);
    setOpen(false);
  };

  const getTutorialsByCategory = (category: string) => {
    return tutorials.filter((t) => t.category === category);
  };

  const isTutorialAvailable = (tutorialId: string) => {
    return availableTutorials.some((t) => t.id === tutorialId);
  };

  const isTutorialCompleted = (tutorialId: string) => {
    return completedTutorials.includes(tutorialId);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-2" />
          Tutorials
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Trading Tutorials</DialogTitle>
          <DialogDescription>
            Learn how to use TradeFlow 3D with interactive, step-by-step tutorials.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="trading">Trading</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {getTutorialsByCategory(category).map((tutorial) => {
                    const isCompleted = isTutorialCompleted(tutorial.id);
                    const isAvailable = isTutorialAvailable(tutorial.id);
                    const isLocked = !isAvailable;

                    return (
                      <Card
                        key={tutorial.id}
                        className={`${isCompleted ? 'border-green-500/50 bg-green-500/5' : ''} ${
                          isLocked ? 'opacity-60' : ''
                        }`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base">{tutorial.title}</CardTitle>
                                {isCompleted && (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                )}
                                {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                              </div>
                              <CardDescription className="mt-1">
                                {tutorial.description}
                              </CardDescription>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleStartTutorial(tutorial)}
                              disabled={isLocked}
                              variant={isCompleted ? 'outline' : 'default'}
                            >
                              {isCompleted ? (
                                <>
                                  <Play className="h-4 w-4 mr-1" />
                                  Replay
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-1" />
                                  Start
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="capitalize">
                              {tutorial.category}
                            </Badge>
                            <span>•</span>
                            <span>{tutorial.steps.length} steps</span>
                            {tutorial.prerequisites && tutorial.prerequisites.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-orange-500">
                                  Prerequisites required
                                </span>
                              </>
                            )}
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
      </DialogContent>
    </Dialog>
  );
}
