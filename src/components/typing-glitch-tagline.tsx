
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import './typing-glitch-tagline.css';

interface TypingGlitchTaglineProps {
  text: string;
  className?: string;
  typingSpeed?: number;
  glitchEnabled?: boolean;
  glitchIntervalMin?: number;
  glitchIntervalMax?: number;
  glitchDuration?: number;
}

export const TypingGlitchTagline: React.FC<TypingGlitchTaglineProps> = ({
  text,
  className,
  typingSpeed = 70, // Adjusted speed
  glitchEnabled = true,
  glitchIntervalMin = 4000, // Min ms between glitches - Increased from 2500
  glitchIntervalMax = 8000, // Max ms between glitches - Increased from 6000
  glitchDuration = 180,    // How long a single glitch effect lasts
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
    setIsGlitching(false);
    if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
    if (glitchEffectTimeoutRef.current) clearTimeout(glitchEffectTimeoutRef.current);

    if (text) {
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
  }, [text, typingSpeed]);

  // Glitch effect scheduling
  useEffect(() => {
    if (isTypingComplete && glitchEnabled) {
      const scheduleGlitch = () => {
        const delay = Math.random() * (glitchIntervalMax - glitchIntervalMin) + glitchIntervalMin;
        glitchTimeoutRef.current = setTimeout(() => {
          setIsGlitching(true);
          glitchEffectTimeoutRef.current = setTimeout(() => {
            setIsGlitching(false);
            scheduleGlitch(); 
          }, glitchDuration);
        }, delay);
      };
      scheduleGlitch();
    } else {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
      if (glitchEffectTimeoutRef.current) clearTimeout(glitchEffectTimeoutRef.current);
      setIsGlitching(false);
    }

    return () => {
      if (glitchTimeoutRef.current) clearTimeout(glitchTimeoutRef.current);
      if (glitchEffectTimeoutRef.current) clearTimeout(glitchEffectTimeoutRef.current);
    };
  }, [isTypingComplete, glitchEnabled, glitchIntervalMin, glitchIntervalMax, glitchDuration]);

  return (
    <div
      className={cn(
        'font-semibold text-glow-accent relative', // Keep existing glow, it will be subtle
        isGlitching ? 'glitching' : '',      // Class to trigger glitch styling on children
        className
      )}
    >
      <span data-text={text} className="tagline-text-content">
        {displayedText}
      </span>
      {!isTypingComplete && <span className="typing-cursor">|</span>}
    </div>
  );
};

