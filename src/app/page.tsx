
'use client';

import type { NextPage } from 'next';
import { NetworkCanvas } from '@/components/network-canvas';
import { Sidebar } from '@/components/sidebar';
import { PerformanceMetrics } from '@/components/performance-metrics';
import { NetworkProvider } from '@/context/network-context';
import { TypingGlitchTagline } from '@/components/typing-glitch-tagline';

const Home: NextPage = () => {
  const titleText = "Optimizing Data Flow in IoT Sensor Networks Using Graph Theory";
  const taglineText = "Harnessing graph intelligence to power smarter, faster IoT networks";

  return (
    <NetworkProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
        {/* Title, Credits, and Tagline Area */}
        <header className="p-4 border-b border-border/50 text-center shadow-lg bg-card/80 backdrop-blur-sm">
          {/* Use the TypingGlitchTagline component for the main title */}
          <TypingGlitchTagline
            text={titleText}
            className="text-xl md:text-2xl font-bold text-glow-primary block" // Added block for h1-like behavior
            typingSpeed={50} // Adjusted typing speed for title
            glitchIntervalMin={5000}
            glitchIntervalMax={10000}
            glitchDuration={220}
          />
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Collaboratively developed by Vishwa Panchal – 1RV24IS413 & Yashvanth M U – 1RV23IS141
          </p>
          {/* Revert tagline to a static p element with appropriate styling */}
          <p 
            className="text-sm md:text-md font-semibold text-glow-accent mt-2 min-h-[1.5em] md:min-h-[1.25em]"
          >
            {taglineText}
          </p>
        </header>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden"> {/* This row contains Sidebar and the main canvas/metrics area */}
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden"> {/* This column contains Canvas and Metrics */}
            <NetworkCanvas />
            <PerformanceMetrics />
          </div>
        </div>
      </div>
    </NetworkProvider>
  );
};

export default Home;
