"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className, ...ariaProps }: SliderProps) {
  const percentage = ((value[0] - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex w-full touch-none select-none items-center", className)} role="group">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0]}
        onChange={(e) => onValueChange([parseInt(e.target.value)])}
        className="w-full h-2 rounded-full appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        style={{
          background: `linear-gradient(to right, #059669 0%, #059669 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`,
        }}
        aria-valuenow={value[0]}
        aria-valuemin={min}
        aria-valuemax={max}
        {...ariaProps}
      />
    </div>
  );
}

export { Slider };
