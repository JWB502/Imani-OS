import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  onRatingChange?: (rating: number) => void;
  className?: string;
  max?: number;
  readOnly?: boolean;
}

export function StarRating({
  rating = 0,
  onRatingChange,
  className,
  max = 5,
  readOnly = false,
}: StarRatingProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starIndex = i + 1;
        const isSelected = starIndex <= rating;
        
        return (
          <button
            key={i}
            type="button"
            disabled={readOnly}
            onClick={() => onRatingChange?.(starIndex)}
            className={cn(
              "p-0.5 transition-all outline-none",
              !readOnly && "hover:scale-110 active:scale-95 cursor-pointer",
              readOnly && "cursor-default"
            )}
          >
            <Star
              className={cn(
                "h-5 w-5",
                isSelected 
                  ? "fill-amber-400 text-amber-400" 
                  : "fill-transparent text-muted-foreground/30",
                !readOnly && !isSelected && "group-hover:text-muted-foreground/50"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
