'use client';

import type { NextPage } from 'next';
import { NetworkCanvas } from '@/components/network-canvas';
import { Sidebar } from '@/components/sidebar';
import { PerformanceMetrics } from '@/components/performance-metrics';
import { NetworkProvider } from '@/context/network-context';
import { Toaster } from '@/components/ui/toaster';

const Home: NextPage = () => {
  return (
    <NetworkProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <NetworkCanvas />
          <PerformanceMetrics />
        </div>
        <Toaster />
      </div>
    </NetworkProvider>
  );
};

export default Home;
