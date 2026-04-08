"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type FeedbackItem = {
  id: number;
  label: string;
  feedback: string;
  x?: number;
  y?: number;
};

type Marker = {
  id: number;
  x: number;
  y: number;
};

const DEFAULT_MARKERS: Marker[] = [
  { id: 1, x: 0.5, y: 0.08 },
  { id: 2, x: 0.75, y: 0.15 },
  { id: 3, x: 0.25, y: 0.25 },
  { id: 4, x: 0.5, y: 0.4 },
  { id: 5, x: 0.3, y: 0.55 },
  { id: 6, x: 0.65, y: 0.7 },
];

type Props = {
  screenshotSrc: string;
  feedback: FeedbackItem[];
  activeId: number | null;
  onMarkerClick: (id: number) => void;
};

export default function AnnotatedImage({
  screenshotSrc,
  feedback,
  activeId,
  onMarkerClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Screenshot */}
      <Image
        src={screenshotSrc}
        alt="Page screenshot"
        width={1280}
        height={800}
        className="w-full h-auto block"
        unoptimized
      />

      {/* Markers overlaid on top */}
      {dimensions.width > 0 &&
        feedback.map((item) => {
          const marker = DEFAULT_MARKERS.find((m) => m.id === item.id);
          const xPos = item.x ?? marker?.x ?? 0.5;
          const yPos = item.y ?? marker?.y ?? 0.5;

          const left = xPos * dimensions.width;
          const top = yPos * (dimensions.height || dimensions.width * 0.6);
          const isActive = activeId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onMarkerClick(item.id)}
              style={{ left, top }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 touch-manipulation tap-highlight-transparent"
            >
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-60" />
              )}
              <span
                className={`relative flex items-center justify-center w-7 h-7 rounded-full text-xs font-black shadow-lg border-2 transition-all duration-200 ${
                  isActive
                    ? "bg-yellow-400 border-yellow-400 text-[#1a1a1a] scale-125"
                    : "bg-[#1a1a1a] border-white text-white hover:scale-110"
                }`}
              >
                {item.id}
              </span>
            </button>
          );
        })}
    </div>
  );
}
