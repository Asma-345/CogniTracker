import React, { useState, useCallback, useRef } from 'react';

export interface KeystrokeMetrics {
  avgFlightTime: number;
  avgDwellTime: number;
  stdDevFlightTime: number;
  stdDevDwellTime: number;
  errorRate: number;
  totalKeystrokes: number;
  backspaces: number;
  rawDwellTimes: number[];
  rawFlightTimes: number[];
}

export const useKeystrokeDynamics = () => {
  const [metrics, setMetrics] = useState<KeystrokeMetrics>({
    avgFlightTime: 0,
    avgDwellTime: 0,
    stdDevFlightTime: 0,
    stdDevDwellTime: 0,
    errorRate: 0,
    totalKeystrokes: 0,
    backspaces: 0,
    rawDwellTimes: [],
    rawFlightTimes: [],
  });

  const keyStartTimes = useRef<Record<string, number>>({});
  const lastKeyEndTime = useRef<number | null>(null);

  const calculateStdDev = (arr: number[], mean: number) => {
    if (arr.length < 2) return 0;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const resetMetrics = useCallback(() => {
    setMetrics({
      avgFlightTime: 0,
      avgDwellTime: 0,
      stdDevFlightTime: 0,
      stdDevDwellTime: 0,
      errorRate: 0,
      totalKeystrokes: 0,
      backspaces: 0,
      rawDwellTimes: [],
      rawFlightTimes: [],
    });
    keyStartTimes.current = {};
    lastKeyEndTime.current = null;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const now = performance.now();
    
    // Capture Flight Time (Time between previous key UP and current key DOWN)
    if (lastKeyEndTime.current !== null) {
      const flightTime = now - lastKeyEndTime.current;
      setMetrics(prev => ({
        ...prev,
        rawFlightTimes: [...prev.rawFlightTimes, flightTime]
      }));
    }

    // Start recording Dwell Time for this key
    if (!keyStartTimes.current[e.key]) {
      keyStartTimes.current[e.key] = now;
      
      setMetrics(prev => {
        const isBackspace = e.key === 'Backspace';
        const newBackspaces = isBackspace ? prev.backspaces + 1 : prev.backspaces;
        const newTotal = prev.totalKeystrokes + 1;
        return {
          ...prev,
          totalKeystrokes: newTotal,
          backspaces: newBackspaces,
          errorRate: newTotal > 0 ? newBackspaces / newTotal : 0
        };
      });
    }
  }, []);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    const now = performance.now();
    const startTime = keyStartTimes.current[e.key];

    if (startTime) {
      const dwellTime = now - startTime;
      delete keyStartTimes.current[e.key];
      lastKeyEndTime.current = now;

      setMetrics(prev => {
        const newDwellTimes = [...prev.rawDwellTimes, dwellTime];
        const avgDwell = newDwellTimes.reduce((a, b) => a + b, 0) / newDwellTimes.length;
        const avgFlight = prev.rawFlightTimes.reduce((a, b) => a + b, 0) / (prev.rawFlightTimes.length || 1);
        
        const stdDevDwell = calculateStdDev(newDwellTimes, avgDwell);
        const stdDevFlight = calculateStdDev(prev.rawFlightTimes, avgFlight);

        return {
          ...prev,
          rawDwellTimes: newDwellTimes,
          avgDwellTime: avgDwell,
          avgFlightTime: avgFlight,
          stdDevDwellTime: stdDevDwell,
          stdDevFlightTime: stdDevFlight
        };
      });
    }
  }, []);

  return {
    metrics,
    handleKeyDown,
    handleKeyUp,
    resetMetrics
  };
};
