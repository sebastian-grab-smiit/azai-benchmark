'use client';

import { useState, useMemo } from 'react';
import { BenchmarkView } from '@/components/benchmark-view';

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <BenchmarkView />
    </main>
  );
}
