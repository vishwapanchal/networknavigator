
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import './typing-glitch-tagline.css';

interface TypingGlitchTaglineProps {
  text: string;
  className?: string;
  typingEnabled?: boolean; // New prop
  typingSpeed?: number;
  glitchEnabled?: boolean; // New prop
  glitchIntervalMin?: number;
  glitchIntervalMax?: number;
  glitchDuration?: number;
}

export const TypingGlitchTagline: React.FC<TypingGlitchTaglineProps> = ({
  text,
  className,
  typingEnabled = true, // Default to true
  typingSpeed = 70,
  glitchEnabled = true, // Default to true
  glitchIntervalMin = 4000,
  glitchIntervalMax = 8000,
  glitchDuration = 180,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isGlitching, setIsGlitching] = useState(false);
  const glitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const glitchEffectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Typing effect
  useEffect(() => {
    setDisplayedText('');
    setIsTypingComplete(false);
    setIsGlitching(false); // Reset glitch state on text change
    if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    if (glitchEffectTimeoutRef.current) clearTimeout(glitchEffectTimeoutRef.current);

    if (text) {
      if (!typingEnabled) {
        setDisplayedText(text);
        setIsTypingComplete(true);
        return; // Skip typing animation
      }

      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
        if (i === text.length) {
          clearInterval(intervalId);
          setIsTypingComplete(true);
        }
      }, typingSpeed);
      return () => clearInterval(intervalId);
    }
  }, [text, typingSpeed, typingEnabled]);

  // Glitch effect scheduling
  useEffect(() => {
    if (isTypingComplete && glitchEnabled) { // Only schedule if glitchEnabled is true
      const scheduleGlitch = () => {
        const delay = Math.random() * (glitchIntervalMax - glitchIntervalMin) + glitchIntervalMin;
        glitchTimeoutRef.current = setTimeout(() => {
          setIsGlitching(true);
          glitchEffectTimeoutRef.current = setTimeout(() => {
            setIsGlitching(false);
            if (glitchEnabled) { // Check again in case it was disabled during the timeout
                 scheduleGlitch();
            }
          }, glitchDuration);
        }, delay);
      };
      scheduleGlitch();
    } else {
      // Ensure glitching stops if component re-renders with glitchEnabled=false or typing not complete
      setIsGlitching(false);
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
      if (glitchEffectTimeoutRef.current) clearTimeout(glitchEffectTimeoutRef.current);
    }

    return () => {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
      if (glitchEffectTimeoutRef.current) clearTimeout(glitchEffectTimeoutRef.current);
    };
  }, [isTypingComplete, glitchEnabled, glitchIntervalMin, glitchIntervalMax, glitchDuration, text]); // Added text to dependencies to re-evaluate on text change

  return (
    <div
      className={cn(
        'font-semibold relative', // Removed 'text-glow-accent' - will be controlled by passed className
        isGlitching && glitchEnabled ? 'glitching' : '', // Apply 'glitching' only if enabled
        className
      )}
    >
      <span data-text={text} className="tagline-text-content">
        {displayedText}
      </span>
      {typingEnabled && !isTypingComplete && <span className="typing-cursor">|</span>}
    </div>
  );
};

