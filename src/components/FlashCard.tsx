import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Character } from '@/lib/storage';

interface FlashCardProps {
  character: Character;
  onAnswer: (isCorrect: boolean) => void;
  showAnswer?: boolean;
}

export default function FlashCard({ character, onAnswer, showAnswer = false }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Use ref to track drag offset to avoid stale closures in event listeners
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Reset flip state when character changes
  useEffect(() => {
    setIsFlipped(false);
    // Reset drag offset ref
    dragOffsetRef.current = { x: 0, y: 0 };
    setDragOffset({ x: 0, y: 0 });
    
    // Trigger quick shake when resetting to a new card (back to question)
    // But skip on very first render to avoid animation on page load
    if (!isFirstRender.current) {
      setAnimationClass('animate-quick-shake');
      const timer = setTimeout(() => setAnimationClass(''), 300);
      return () => clearTimeout(timer);
    } else {
      isFirstRender.current = false;
    }
  }, [character.id]);

  // Handle flip animations
  const handleFlip = (flipped: boolean) => {
    setIsFlipped(flipped);
    if (flipped) {
      setAnimationClass('animate-bounce-shake');
      // Remove class after animation completes so it can be re-triggered if needed
      setTimeout(() => setAnimationClass(''), 600);
    } else {
      setAnimationClass('animate-quick-shake');
      setTimeout(() => setAnimationClass(''), 300);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const startX = e.clientX - rect.left - rect.width / 2;
      const startY = e.clientY - rect.top - rect.height / 2;
      
      const handleMouseMove = (moveE: MouseEvent) => {
        const newX = moveE.clientX - rect.left - rect.width / 2 - startX;
        const newY = moveE.clientY - rect.top - rect.height / 2 - startY;
        
        // Update both ref (for logic) and state (for render)
        dragOffsetRef.current = { x: newX, y: newY };
        setDragOffset({ x: newX, y: newY });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        
        // Check ref instead of state to get the latest value
        if (Math.abs(dragOffsetRef.current.x) > 100) {
          if (dragOffsetRef.current.x > 0) {
            onAnswer(true); // Swipe right = correct
          } else {
            onAnswer(false); // Swipe left = incorrect
          }
        }
        
        // Reset both
        dragOffsetRef.current = { x: 0, y: 0 };
        setDragOffset({ x: 0, y: 0 });
        
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const startX = touch.clientX - rect.left - rect.width / 2;
      const startY = touch.clientY - rect.top - rect.height / 2;
      
      const handleTouchMove = (moveE: TouchEvent) => {
        const moveTouch = moveE.touches[0];
        const newX = moveTouch.clientX - rect.left - rect.width / 2 - startX;
        const newY = moveTouch.clientY - rect.top - rect.height / 2 - startY;
        
        // Update both ref (for logic) and state (for render)
        dragOffsetRef.current = { x: newX, y: newY };
        setDragOffset({ x: newX, y: newY });
      };

      const handleTouchEnd = () => {
        setIsDragging(false);
        
        // Check ref instead of state
        if (Math.abs(dragOffsetRef.current.x) > 100) {
          if (dragOffsetRef.current.x > 0) {
            onAnswer(true); // Swipe right = correct
          } else {
            onAnswer(false); // Swipe left = incorrect
          }
        }
        
        // Reset both
        dragOffsetRef.current = { x: 0, y: 0 };
        setDragOffset({ x: 0, y: 0 });
        
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
  };

  const rotation = dragOffset.x * 0.1; // Slight rotation based on drag
  const opacity = Math.max(0.7, 1 - Math.abs(dragOffset.x) * 0.002);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Swipe indicators */}
      <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200 ${
        dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-red-500 text-white p-3 rounded-full">
          <ThumbsDown size={24} />
        </div>
      </div>
      
      <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 transition-opacity duration-200 ${
        dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="bg-green-500 text-white p-3 rounded-full">
          <ThumbsUp size={24} />
        </div>
      </div>

      {/* Main card */}
      <Card
        ref={cardRef}
        className={`cursor-grab active:cursor-grabbing transition-all duration-300 ${
          isDragging ? 'scale-105 shadow-2xl' : 'hover:shadow-lg'
        } ${isFlipped ? 'bg-blue-50' : 'bg-white'} ${animationClass}`}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
          opacity: opacity,
          transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <CardContent className="p-8 text-center min-h-[300px] flex flex-col justify-center">
          {!isFlipped ? (
            // Front side - Chinese character ONLY
            <div className="space-y-4">
              <div className="text-6xl font-bold text-gray-800 mb-4">
                {character.chinese}
              </div>
              {/* Category removed from front side */}
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlip(true);
                }}
                className="mt-4"
              >
                Show Answer
              </Button>
            </div>
          ) : (
            // Back side - Pinyin and English
            <div className="space-y-6">
              <div className="text-4xl font-bold text-gray-800">
                {character.chinese}
              </div>
              <div className="text-2xl text-blue-600 font-medium">
                {character.pinyin}
              </div>
              <div className="text-xl text-gray-700">
                {character.english}
              </div>
              <div className="text-sm text-gray-500 uppercase tracking-wide">
                {character.category}
              </div>
              
              {showAnswer && (
                <div className="flex gap-4 justify-center mt-6">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnswer(false);
                    }}
                    className="!bg-transparent !hover:bg-transparent border-red-500 text-red-500 hover:bg-red-50"
                  >
                    <ThumbsDown className="mr-2" size={20} />
                    Incorrect
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnswer(true);
                    }}
                    className="!bg-transparent !hover:bg-transparent border-green-500 text-green-500 hover:bg-green-50"
                  >
                    <ThumbsUp className="mr-2" size={20} />
                    Correct
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Reset flip button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleFlip(false);
            }}
            className="absolute top-4 right-4"
          >
            <RotateCcw size={16} />
          </Button>
        </CardContent>
      </Card>

      {/* Instructions */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Swipe right for correct, left for incorrect, or use buttons
      </div>
    </div>
  );
}