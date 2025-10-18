import { useEffect, useState } from 'react';
import { useTutorialStore } from '@/stores/useTutorialStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';

export function TutorialOverlay() {
  const {
    activeTutorial,
    currentStepIndex,
    isTutorialActive,
    highlightedElement,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
  } = useTutorialStore();

  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (highlightedElement && isTutorialActive) {
      const element = document.querySelector(highlightedElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightPosition(rect);
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightPosition(null);
      }
    } else {
      setHighlightPosition(null);
    }
  }, [highlightedElement, isTutorialActive, currentStepIndex]);

  if (!activeTutorial || !isTutorialActive) {
    return null;
  }

  const currentStep = activeTutorial.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / activeTutorial.steps.length) * 100;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === activeTutorial.steps.length - 1;

  const getStepCardPosition = () => {
    if (!highlightPosition || !currentStep) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const padding = 20;
    const cardWidth = 400;
    const cardHeight = 300;

    let top = 0;
    let left = 0;

    switch (currentStep.position) {
      case 'top':
        top = highlightPosition.top - cardHeight - padding;
        left = highlightPosition.left + highlightPosition.width / 2 - cardWidth / 2;
        break;
      case 'bottom':
        top = highlightPosition.bottom + padding;
        left = highlightPosition.left + highlightPosition.width / 2 - cardWidth / 2;
        break;
      case 'left':
        top = highlightPosition.top + highlightPosition.height / 2 - cardHeight / 2;
        left = highlightPosition.left - cardWidth - padding;
        break;
      case 'right':
        top = highlightPosition.top + highlightPosition.height / 2 - cardHeight / 2;
        left = highlightPosition.right + padding;
        break;
    }

    // Ensure card stays within viewport
    top = Math.max(padding, Math.min(top, window.innerHeight - cardHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));

    return { top: `${top}px`, left: `${left}px` };
  };

  const cardPosition = getStepCardPosition();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 z-[9998] pointer-events-none" />

      {/* Highlight overlay */}
      {highlightPosition && (
        <>
          <div
            className="fixed z-[9999] pointer-events-none border-4 border-cyan-400 rounded-lg shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse"
            style={{
              top: highlightPosition.top - 4,
              left: highlightPosition.left - 4,
              width: highlightPosition.width + 8,
              height: highlightPosition.height + 8,
            }}
          />
          <div
            className="fixed z-[9997] bg-white/10 pointer-events-auto"
            style={{
              top: highlightPosition.top,
              left: highlightPosition.left,
              width: highlightPosition.width,
              height: highlightPosition.height,
            }}
          />
        </>
      )}

      {/* Tutorial step card */}
      <Card
        className="fixed z-[10000] w-[400px] shadow-2xl border-2 border-cyan-500/50 bg-background"
        style={cardPosition}
      >
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={skipTutorial}
          >
            <X className="h-4 w-4" />
          </Button>
          <CardTitle className="pr-8">{currentStep?.title}</CardTitle>
          <CardDescription>
            Step {currentStepIndex + 1} of {activeTutorial.steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{currentStep?.description}</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousStep}
              disabled={isFirstStep}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            {!isLastStep ? (
              <Button size="sm" onClick={nextStep}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={completeTutorial} className="bg-green-600 hover:bg-green-700">
                Complete
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={skipTutorial}>
            <SkipForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
        </CardFooter>
      </Card>
    </>
  );
}
