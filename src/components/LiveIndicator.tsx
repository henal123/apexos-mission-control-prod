'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LiveIndicatorProps {
  connected: boolean;
  reconnecting?: boolean;
  lastUpdate?: Date;
}

export function LiveIndicator({
  connected,
  reconnecting = false,
  lastUpdate,
}: LiveIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    if (!lastUpdate) return;
    
    const updateElapsed = () => {
      const now = Date.now();
      const updateTime = lastUpdate.getTime();
      setElapsed(Math.floor((now - updateTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [lastUpdate]);

  // Determine visual state
  const isLive = connected && !reconnecting;
  const isReconnecting = reconnecting;
  const isOffline = !connected && !reconnecting;

  // Configuration for each state
  const stateConfig = {
    live: {
      dotClass: 'bg-green-500',
      pulseClass: 'animate-pulse',
      text: 'Live',
      textClass: 'text-green-400',
    },
    reconnecting: {
      dotClass: 'bg-amber-500',
      pulseClass: 'animate-pulse',
      text: 'Reconnecting...',
      textClass: 'text-amber-400',
    },
    offline: {
      dotClass: 'bg-red-500',
      pulseClass: '',
      text: 'Offline',
      textClass: 'text-red-400',
    },
  };

  const config = isLive 
    ? stateConfig.live 
    : isReconnecting 
    ? stateConfig.reconnecting 
    : stateConfig.offline;

  // Format elapsed time display
  const getElapsedText = () => {
    if (!lastUpdate) return 'Never updated';
    
    if (elapsed < 1) {
      return 'Just now';
    } else if (elapsed === 1) {
      return '1 second ago';
    } else if (elapsed < 60) {
      return `${elapsed} seconds ago`;
    } else {
      const minutes = Math.floor(elapsed / 60);
      const remainingSeconds = elapsed % 60;
      if (minutes === 1) {
        return remainingSeconds > 0 
          ? `1m ${remainingSeconds}s ago` 
          : '1 minute ago';
      }
      return remainingSeconds > 0 
        ? `${minutes}m ${remainingSeconds}s ago` 
        : `${minutes} minutes ago`;
    }
  };

  return (
    <div className="flex flex-col items-start">
      {/* Main indicator row */}
      <div className="flex items-center gap-2">
        {/* Status dot with optional pulse animation */}
        <span
          className={cn(
            'inline-block h-2.5 w-2.5 rounded-full',
            config.dotClass,
            config.pulseClass
          )}
        />
        {/* Status text */}
        <span className={cn('text-sm font-medium', config.textClass)}>
          {config.text}
        </span>
      </div>
      
      {/* Last update timestamp */}
      <div className="text-xs text-slate-500 mt-0.5">
        Last update: {getElapsedText()}
      </div>
    </div>
  );
}

export default LiveIndicator;
