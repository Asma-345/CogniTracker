/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useKeystrokeDynamics, KeystrokeMetrics } from './hooks/useKeystrokeDynamics';
import { Activity, Brain, Timer, ShieldCheck, AlertTriangle, RefreshCw, Zap, Binary } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { cn } from './lib/utils';

type TestState = 'idle' | 'baseline' | 'current' | 'analyzing' | 'finished';

interface AnalysisResult {
  fatigueScore: number;
  primaryIndicator: string;
  scientificSummary: string;
  recommendation: string;
  strategy: string;
}

const TEST_DURATION = 30; // seconds

export default function App() {
  const [testState, setTestState] = useState<TestState>('idle');
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [baselineData, setBaselineData] = useState<KeystrokeMetrics | null>(null);
  const [currentData, setCurrentData] = useState<KeystrokeMetrics | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [inputText, setInputText] = useState("");
  
  const { metrics, handleKeyDown, handleKeyUp, resetMetrics } = useKeystrokeDynamics();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTest = (type: 'baseline' | 'current') => {
    resetMetrics();
    setInputText("");
    setTestState(type);
    setTimeLeft(TEST_DURATION);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (timeLeft === 0) {
      if (testState === 'baseline') {
        setBaselineData(metrics);
        setTestState('idle');
      } else if (testState === 'current') {
        setCurrentData(metrics);
        performAnalysis(baselineData!, metrics);
      }
    }
  }, [timeLeft, testState, metrics]);

  const performAnalysis = async (baseline: KeystrokeMetrics, current: KeystrokeMetrics) => {
    setTestState('analyzing');
    try {
      const prompt = `
        Analyze these sets of motor kinetics telemetry to detect acute cognitive fatigue.
        
        BASELINE (Rested):
        - Avg Flight Time (FT): ${baseline.avgFlightTime.toFixed(2)}ms
        - Avg Dwell Time (DT): ${baseline.avgDwellTime.toFixed(2)}ms
        - FT Jitter (StdDev): ${baseline.stdDevFlightTime.toFixed(2)}ms
        - Error Rate: ${(baseline.errorRate * 100).toFixed(2)}%
        
        CURRENT (Capture):
        - Avg Flight Time (FT): ${current.avgFlightTime.toFixed(2)}ms
        - Avg Dwell Time (DT): ${current.avgDwellTime.toFixed(2)}ms
        - FT Jitter (StdDev): ${current.stdDevFlightTime.toFixed(2)}ms
        - Error Rate: ${(current.errorRate * 100).toFixed(2)}%
        
        INDICATORS:
        1. FT increase >15% = Processing Latency.
        2. DT increase >10% = Motor Exhaustion.
        3. Jitter increase >20% = Rhythmic Decomposition.
      `;

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const result = await response.json() as AnalysisResult;
      result.strategy = "Groq Llama-3 (Cloud Relay)";
      
      setAnalysis(result);
      
      // Add to history
      const newEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        score: result.fatigueScore,
        indicator: result.primaryIndicator,
        profile: userProfile
      };
      setSessionHistory(prev => [newEntry, ...prev]);
      
      setTestState('finished');
    } catch (error) {
      console.error("Analysis failed, using deterministic fallback", error);
      
      // FALLBACK DETERMINISTIC LOGIC (Explains the 30/100 score)
      const dwellDelta = (current.avgDwellTime - baseline.avgDwellTime) / baseline.avgDwellTime;
      const flightDelta = (current.avgFlightTime - baseline.avgFlightTime) / baseline.avgFlightTime;
      const jitterDelta = (current.stdDevFlightTime - baseline.stdDevFlightTime) / (baseline.stdDevFlightTime || 1);
      const errorDelta = current.errorRate - baseline.errorRate;

      let score = 0;
      if (flightDelta > 0.1) score += 20;
      if (dwellDelta > 0.1) score += 20;
      if (jitterDelta > 0.1) score += 20;
      if (errorDelta > 0.05) score += 40;
      
      score = Math.min(Math.max(Math.round(score), 0), 100);

      const fallbackResult: AnalysisResult = {
        fatigueScore: score,
        primaryIndicator: score > 50 ? "Significant Kinetic Shift" : "Homeostatic Stability",
        scientificSummary: `Kinetics analysis detected a ${Math.abs(Math.round(flightDelta * 100))}% shift in processing latency.`,
        recommendation: score > 50 ? "Rest recommended." : "Metrics within normal limits.",
        strategy: "Deterministic Fallback Logic"
      };

      setAnalysis(fallbackResult);
      setTestState('finished');
    }
  };

  const getScoreColor = (score: number) => {
    if (score < 30) return 'text-green-400 border-green-400/30';
    if (score < 60) return 'text-yellow-400 border-yellow-400/30';
    return 'text-red-400 border-red-400/30';
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [userProfile, setUserProfile] = useState("Alpha-1");
  const [sessionHistory, setSessionHistory] = useState<{
    id: string;
    timestamp: string;
    score: number;
    indicator: string;
    profile: string;
  }[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('kinetic_scan_history');
    if (saved) {
      try {
        setSessionHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (sessionHistory.length > 0) {
      localStorage.setItem('kinetic_scan_history', JSON.stringify(sessionHistory));
    }
  }, [sessionHistory]);

  const seedSampleHistory = () => {
    const demoData = [
      { id: '1', timestamp: '08:15:22', score: 18, indicator: 'Homeostatic Peak', profile: userProfile },
      { id: '2', timestamp: '11:30:45', score: 24, indicator: 'Optimal Stability', profile: userProfile },
      { id: '3', timestamp: '14:10:12', score: 58, indicator: 'Cumulative Fatigue', profile: userProfile },
      { id: '4', timestamp: '16:45:33', score: 72, indicator: 'Critical Motor Shift', profile: userProfile },
      { id: '5', timestamp: 'Yesterday', score: 65, indicator: 'Sustained Exhaustion', profile: userProfile },
      { id: '6', timestamp: '2 days ago', score: 31, indicator: 'Post-Rest Recovery', profile: userProfile },
      { id: '7', timestamp: '3 days ago', score: 22, indicator: 'Baseline Established', profile: userProfile },
    ];
    setSessionHistory(demoData);
  };

  const PASSAGES = [
    "NEURO-BASELINE (CTRL-01): The intentional monitoring of motor kinetics requires a consistent environmental state and sustained cognitive focus. This controlled passage establishes the primary reference matrix for longitudinal neurological assessment.",
    "STRESS-LOAD (ALPHA-02): Increasing cognitive load through task complexity reveals the degradation of inhibitory motor programs. Physiological fatigue manifests as a shift in mean flight latency and a disruption of rhythmic periodicity.",
    "FATIGUE-DELTA (PHI-03): Rapid sequence execution under sustained attention reveals acute processing bottlenecks. The divergence from established baseline metrics indicates the onset of central executive exhaustion."
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto relative overflow-hidden text-slate-100 bg-[#0a0a0c]">
      {/* Dynamic Background Noise */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
      
      <div className="scanline" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent)] pointer-events-none" />
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4 relative z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter flex items-center gap-3">
            <Zap className="text-blue-400 fill-blue-400/20" />
            KINETIC-SCAN <span className="text-xs font-mono opacity-40 ml-2 tracking-widest uppercase px-2 py-1 border border-white/10 rounded">BETA v2.4</span>
          </h1>
          <p className="text-white/40 font-mono text-[10px] mt-2 uppercase tracking-[0.2em]">
            Neurological Assessment Interface // Motor-Kinetic Telemetry
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="hidden xl:flex flex-col items-end mr-4 border-r border-white/5 pr-4">
             <p className="text-[9px] font-mono opacity-30 uppercase tracking-widest">Signal Stability</p>
             <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-1 h-3 rounded-full",
                      metrics.stdDevFlightTime < 50 ? "bg-emerald-500" : 
                      metrics.stdDevFlightTime < 100 ? "bg-yellow-500" : "bg-red-500",
                      i > 3 && metrics.stdDevFlightTime > 80 && "opacity-20",
                      i > 2 && metrics.stdDevFlightTime > 120 && "opacity-20"
                    )} 
                  />
                ))}
             </div>
          </div>
          <div className="hidden lg:flex flex-col items-end mr-4 border-r border-white/5 pr-4">
             <p className="text-[9px] font-mono opacity-30 uppercase tracking-widest">System Time</p>
             <p className="text-sm font-mono text-blue-400/80 tabular-nums">
               {currentTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
             </p>
          </div>
          <div className="hidden md:block text-right mr-4 border-r border-white/5 pr-4">
             <p className="text-[9px] font-mono opacity-30 uppercase tracking-widest">Active Profiling</p>
             <select 
              value={userProfile} 
              onChange={(e) => setUserProfile(e.target.value)}
              className="bg-transparent text-xs font-mono text-blue-400 focus:outline-none cursor-pointer hover:text-blue-300 appearance-none"
             >
                <option value="Alpha-1" className="bg-[#111]">SUBJECT: ALPHA-1</option>
                <option value="Beta-2" className="bg-[#111]">SUBJECT: BETA-2</option>
                <option value="Guest" className="bg-[#111]">MODE: GUEST_DEBUG</option>
             </select>
          </div>
          <div className="px-4 py-2 border border-blue-500/10 bg-blue-500/5 rounded-sm flex items-center gap-3">
            <ShieldCheck size={14} className="text-blue-500/60" />
            <span className="text-[9px] font-mono opacity-60 uppercase tracking-widest">Auth: Encrypted Node</span>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Column: Metrics and Tests */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricBox 
              label="Dwell Time" 
              value={`${metrics.avgDwellTime.toFixed(1)}ms`} 
              icon={<Timer className="text-blue-400/60" />} 
              subtext="Motor precision duration"
            />
            <MetricBox 
              label="Flight Time" 
              value={`${metrics.avgFlightTime.toFixed(1)}ms`} 
              icon={<Brain className="text-indigo-400/60" />} 
              subtext="Cognitive processing lag"
            />
            <MetricBox 
              label="Jitter (σ)" 
              value={`${metrics.stdDevFlightTime.toFixed(1)}ms`} 
              icon={<Activity className="text-pink-400/60" />} 
              subtext="Rhythmic variance (Stability)"
            />
             <MetricBox 
              label="Err. Rate" 
              value={`${(metrics.errorRate * 100).toFixed(1)}%`} 
              icon={<AlertTriangle className={cn(metrics.errorRate > 0.05 ? "text-orange-400/60" : "text-emerald-400/60")} />} 
              subtext="Inhibitory control loss"
            />
          </div>

          {/* Test Control Area */}
          <div className="data-grid-item bg-white/[0.02] border-white/10 relative overflow-hidden h-[400px] flex flex-col">
            <AnimatePresence mode="wait">
              {testState === 'idle' ? (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center p-8"
                >
                  <Activity size={48} className="text-white/20 mb-6 animate-pulse" />
                  <h2 className="text-2xl font-semibold mb-2">Initialize Cognitive Scan</h2>
                  <p className="text-white/40 text-sm max-w-md mb-8">
                    To detect fatigue, we first need a baseline of your rested state. 
                    Then, perform the current test to identify cognitive degradation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                    <button 
                      onClick={() => startTest('baseline')}
                      className="flex-1 px-6 py-3 border border-white/10 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all font-mono text-xs tracking-widest uppercase flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={14} /> 1. Start Baseline
                    </button>
                    <button 
                      onClick={() => baselineData ? startTest('current') : null}
                      disabled={!baselineData}
                      className={cn(
                        "flex-1 px-6 py-3 border font-mono text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all",
                        baselineData 
                          ? "border-blue-500/50 hover:border-blue-500 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400" 
                          : "border-white/5 opacity-30 cursor-not-allowed"
                      )}
                    >
                      <Activity size={14} /> 2. Current Test
                    </button>
                  </div>
                  {!baselineData && (
                    <p className="text-[10px] uppercase tracking-widest text-orange-400/60 mt-4">
                      * System requires baseline data for delta calculation
                    </p>
                  )}
                </motion.div>
              ) : (testState === 'baseline' || testState === 'current') ? (
                <motion.div 
                  key="testing"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-mono text-xs tracking-[0.2em] text-blue-400 uppercase">
                      Capturing Telemetry: {testState}
                    </span>
                    <span className="font-mono text-2xl font-bold text-white/80 tabular-nums">
                      00:{timeLeft.toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="bg-white/5 p-4 border-l-2 border-blue-500/50 mb-4">
                    <p className="text-xs text-white/60 italic leading-relaxed">
                      {PASSAGES[testState === 'baseline' ? 0 : 1]}
                    </p>
                  </div>
                  
                  <textarea
                    autoFocus
                    placeholder="Type continuously to provide enough telemetry data. Focus on speed and accuracy. You can type about your day or repeat the alphabet..."
                    className="flex-1 bg-black/40 border border-white/5 p-4 font-mono text-sm resize-none focus:outline-none focus:border-blue-500/30"
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  
                  <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timeLeft / TEST_DURATION) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              ) : testState === 'analyzing' ? (
                <motion.div 
                  key="analyzing"
                  className="flex-1 flex flex-col items-center justify-center p-8"
                >
                  <div className="relative w-24 h-24 mb-6">
                    <motion.div 
                      className="absolute inset-0 border-2 border-blue-500/20 rounded-full"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute inset-2 border-2 border-blue-500/40 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Binary className="text-blue-500 animate-pulse" />
                    </div>
                  </div>
                  <h3 className="font-mono text-xs tracking-widest text-blue-400 uppercase mb-2">Consulting Hybrid Engine</h3>
                  <p className="text-white/40 text-xs font-mono">Running cross-matrix telemetry correlation...</p>
                </motion.div>
              ) : (
                <motion.div 
                  key="finished"
                  className="flex-1 overflow-y-auto custom-scrollbar"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                      <div>
                        <h2 className="text-xl font-bold uppercase tracking-tight">Fatigue Assessment Complete</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/10 text-white/60">STRATEGY: {analysis?.strategy}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setTestState('idle'); setAnalysis(null); }}
                        className="p-2 hover:bg-white/5 rounded-full transition-colors"
                      >
                        <RefreshCw size={20} className="text-white/40" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-6">
                          <div className={cn("p-6 border rounded-lg bg-black/40", getScoreColor(analysis?.fatigueScore || 0))}>
                            <span className="text-[10px] uppercase tracking-widest font-mono opacity-60">Fatigue Index</span>
                            <div className="text-6xl font-black mt-2 leading-none flex items-baseline gap-2">
                              {analysis?.fatigueScore}
                              <span className="text-xl font-medium opacity-40">/100</span>
                            </div>
                            <p className="mt-4 font-bold uppercase tracking-tight text-lg">{analysis?.primaryIndicator}</p>
                          </div>
                          
                          <div className="space-y-2">
                             <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Scientific Summary</h4>
                             <p className="text-sm leading-relaxed text-white/70 italic">"{analysis?.scientificSummary}"</p>
                          </div>
                          
                          <div className="p-4 border border-white/5 bg-white/5 rounded flex gap-3">
                            <Zap className="text-yellow-400 shrink-0" size={20} />
                            <div>
                               <h5 className="text-xs font-bold uppercase text-yellow-500/80">Clinician Advice</h5>
                               <p className="text-xs text-white/50 mt-1">{analysis?.recommendation}</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => {
                              const data = {
                                profile: userProfile,
                                score: analysis?.fatigueScore,
                                baseline: baselineData,
                                current: currentData,
                                timestamp: new Date().toISOString()
                              };
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `fatigue_report_${userProfile}.json`;
                              a.click();
                            }}
                            className="w-full py-3 border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-mono uppercase tracking-[0.2em] transition-all"
                          >
                            Export Session Logs (.JSON)
                          </button>
                       </div>

                       <div className="h-[300px] border border-white/5 p-4 bg-black/20 rounded">
                          <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">Dwell vs Flight Distribution (Current)</h4>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={currentData?.rawDwellTimes.slice(-20).map((d, i) => ({ 
                              idx: i, 
                              dwell: d, 
                              flight: currentData?.rawFlightTimes[i] || 0 
                            }))}>
                              <defs>
                                <linearGradient id="colorDwell" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorFlight" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                              <XAxis dataKey="idx" hide />
                              <YAxis hide domain={['auto', 'auto']} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                                itemStyle={{ color: '#fff' }}
                              />
                              <Area type="monotone" dataKey="dwell" stroke="#818cf8" fillOpacity={1} fill="url(#colorDwell)" strokeWidth={2} />
                              <Area type="monotone" dataKey="flight" stroke="#38bdf8" fillOpacity={1} fill="url(#colorFlight)" strokeWidth={2} />
                            </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Comparative Viz */}
        <div className="lg:col-span-4 space-y-6">
          <div className="data-grid-item bg-white/[0.02] border-white/5">
              <h3 className="font-mono text-[10px] tracking-widest uppercase text-white/40 mb-6 flex items-center gap-2">
                <Binary size={12} /> Kinetic Topology Delta
              </h3>
              
              <div className="space-y-8">
                 <ComparisonProgress label="Motor Persistence (Dwell)" baseline={baselineData?.avgDwellTime} current={metrics.avgDwellTime} />
                 <ComparisonProgress label="Processing Latency (MFL)" baseline={baselineData?.avgFlightTime} current={metrics.avgFlightTime} />
                 <ComparisonProgress label="Rhythmic Coefficient (CoV)" baseline={baselineData ? (baselineData.stdDevFlightTime / baselineData.avgFlightTime) * 100 : 0} current={(metrics.stdDevFlightTime / (metrics.avgFlightTime || 1)) * 100} />
                 <ComparisonProgress label="Inhibitory Motor Control" baseline={baselineData ? baselineData.errorRate * 100 : 0} current={metrics.errorRate * 100} inverse />
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                 <p className="text-[9px] font-mono text-white/20 uppercase leading-relaxed tracking-wider">
                   Sensor resolution: 1000Hz // Buffer: Non-blocking // Kernel: PROXIMAL-FLOW v2.
                 </p>
              </div>
           </div>

           <div className="border border-yellow-500/20 bg-yellow-500/5 p-4 font-mono text-[10px] text-yellow-500/60 flex gap-3">
              <AlertTriangle className="shrink-0" size={14} />
              <p>PRE-ALPHA: This tool offers cognitive estimations based on motor kinetics. It is not a clinical medical device.</p>
           </div>

           {/* Session History & Trends */}
           <div className="data-grid-item bg-white/[0.02] border-white/5 h-[420px] flex flex-col overflow-hidden rounded-md relative">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-mono text-[10px] tracking-widest uppercase text-white/40 flex items-center gap-2">
                   <Activity size={12} /> Longitudinal Trend (7-Day)
                 </h3>
                 <div className="flex gap-4">
                  {sessionHistory.length === 0 && (
                    <button 
                      onClick={seedSampleHistory}
                      className="text-[9px] font-mono text-blue-400 hover:text-blue-300 uppercase cursor-pointer flex items-center gap-1"
                    >
                      <Zap size={10} /> Seed Demo Data
                    </button>
                  )}
                  {sessionHistory.length > 0 && (
                    <button 
                      onClick={() => {
                        localStorage.removeItem('kinetic_scan_history');
                        setSessionHistory([]);
                      }}
                      className="text-[9px] font-mono text-red-400/40 hover:text-red-400 uppercase cursor-pointer"
                    >
                      Purge
                    </button>
                  )}
                 </div>
              </div>

              {sessionHistory.length > 0 ? (
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                   <div className="h-44 w-full shrink-0 relative">
                      <div className="absolute top-0 right-0 text-[8px] font-mono opacity-20 flex flex-col items-end gap-1 pointer-events-none">
                        <span className="text-red-500">FATIGUE ZONE</span>
                        <span className="text-yellow-500">TRANSITORY</span>
                        <span className="text-emerald-500">RECOVERY</span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={[...sessionHistory].reverse()}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="timestamp" hide />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                               contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', borderRadius: '4px' }}
                               itemStyle={{ color: '#fff' }}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="score" 
                              stroke="#3b82f6" 
                              fillOpacity={1} 
                              fill="url(#colorScore)" 
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0a0a0c' }} 
                            />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>

                   <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                      {sessionHistory.map((item) => (
                         <div key={item.id} className="flex items-center justify-between p-2 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors rounded-sm">
                            <div className="flex flex-col">
                               <span className="text-[10px] font-bold text-white/80">{item.indicator}</span>
                               <span className="text-[9px] font-mono opacity-30 uppercase">{item.timestamp} // {item.profile}</span>
                            </div>
                            <div className={cn(
                               "text-sm font-black font-mono",
                               getScoreColor(item.score).split(' ')[0]
                            )}>
                              {item.score}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center p-8">
                   <Binary size={32} className="mb-4" />
                   <p className="text-[10px] font-mono uppercase tracking-widest">No historical metrics cached on this node</p>
                </div>
              )}
           </div>
        </div>
      </main>

      {/* Footer Meta */}
      <footer className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between gap-4 opacity-40">
        <div className="text-[10px] font-mono uppercase tracking-[0.3em]">
          Local Node IP: 127.0.0.1 // Scan Active
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.3em]">
          CogniTrack Neural Kernel v.2.0.4 - Hackathon Edition
        </div>
      </footer>
    </div>
  );
}

function MetricBox({ label, value, icon, subtext }: { label: string, value: string, icon: React.ReactNode, subtext: string }) {
  return (
    <div className="data-grid-item group">
      <div className="flex items-center justify-between mb-4">
        {icon}
        <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-bold tracking-tighter group-hover:translate-x-1 transition-transform">
        {value}
      </div>
      <p className="text-[10px] font-mono text-white/20 mt-2 uppercase">{subtext}</p>
    </div>
  );
}

function ComparisonProgress({ label, baseline, current, inverse = false }: { label: string, baseline?: number, current: number, inverse?: boolean }) {
  // Use absolute delta to prevent "negative" feelings in the UI as requested
  const rawDelta = baseline ? ((current - baseline) / baseline) * 100 : 0;
  const delta = Math.abs(rawDelta);
  const isWorse = inverse ? rawDelta < 0 : rawDelta > 15;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
        <span className={cn(
          "font-mono text-xs",
          !baseline ? "opacity-20" : isWorse ? "text-amber-400" : "text-blue-400"
        )}>
          {baseline ? `${delta.toFixed(1)}% SHIFT` : 'WAITING'}
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          className={cn("h-full", isWorse ? "bg-amber-500" : "bg-blue-500")}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(delta + 5, 100)}%` }}
        />
      </div>
    </div>
  );
}
