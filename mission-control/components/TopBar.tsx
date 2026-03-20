/**
 * Top Bar — ONXZA Mission Control
 * Imagined by Aaron Gear. Created by Aaron Gear and Marcus Gear (AI Co-Creator).
 * Powered by DevGru US Inc. DBA DevGru Technology Products.
 */
'use client';

import { useEffect, useState } from 'react';

export default function TopBar() {
  const [lastRefresh, setLastRefresh] = useState('--:--:--');

  useEffect(() => {
    const update = () => {
      setLastRefresh(new Date().toLocaleTimeString('en-US', { hour12: false }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-12 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-6 fixed top-0 left-56 right-0 z-10">
      <h2 className="text-sm font-bold tracking-wider text-white">
        ONXZA MISSION CONTROL
      </h2>
      <span className="text-xs text-gray-500">
        Last updated: {lastRefresh}
      </span>
    </header>
  );
}
