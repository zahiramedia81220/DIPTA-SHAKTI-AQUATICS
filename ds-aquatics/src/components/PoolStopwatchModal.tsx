import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Flag,
  X,
  Volume2,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LaneTimer {
  laneNumber: number;
  swimmerName: string;
  timeMs: number;
  isRunning: boolean;
  laps: { lapNumber: number; splitTime: string; totalTime: string }[];
}

interface PoolStopwatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTimeToMember?: (swimmerName: string, formattedTime: string) => void;
}

export const PoolStopwatchModal: React.FC<PoolStopwatchModalProps> = ({
  isOpen,
  onClose,
  onApplyTimeToMember,
}) => {
  const { members } = useApp();

  const [lanes, setLanes] = useState<LaneTimer[]>([
    { laneNumber: 1, swimmerName: 'Raffi Pratama Putra', timeMs: 0, isRunning: false, laps: [] },
    { laneNumber: 2, swimmerName: 'Nayla Zahra Putri', timeMs: 0, isRunning: false, laps: [] },
    { laneNumber: 3, swimmerName: 'Dimas Aditya Nugraha', timeMs: 0, isRunning: false, laps: [] },
    { laneNumber: 4, swimmerName: 'Alena Keisha Ramadhani', timeMs: 0, isRunning: false, laps: [] },
    { laneNumber: 5, swimmerName: 'Kenzo Alvaro Setiawan', timeMs: 0, isRunning: false, laps: [] },
    { laneNumber: 6, swimmerName: 'Fatih Al-Ghifari', timeMs: 0, isRunning: false, laps: [] },
  ]);

  const [globalRunning, setGlobalRunning] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // High precision timer loop
  useEffect(() => {
    if (!isOpen) return;

    const tick = () => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setLanes((prevLanes) =>
        prevLanes.map((lane) => {
          if (lane.isRunning) {
            return { ...lane, timeMs: lane.timeMs + delta };
          }
          return lane;
        })
      );

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
      hundredths
    ).padStart(2, '0')}`;
  };

  const handleStartAll = () => {
    lastTickRef.current = Date.now();
    setLanes((prev) => prev.map((l) => ({ ...l, isRunning: true })));
    setGlobalRunning(true);
  };

  const handlePauseAll = () => {
    setLanes((prev) => prev.map((l) => ({ ...l, isRunning: false })));
    setGlobalRunning(false);
  };

  const handleResetAll = () => {
    setLanes((prev) => prev.map((l) => ({ ...l, timeMs: 0, isRunning: false, laps: [] })));
    setGlobalRunning(false);
  };

  const toggleLane = (laneNum: number) => {
    lastTickRef.current = Date.now();
    setLanes((prev) =>
      prev.map((l) => (l.laneNumber === laneNum ? { ...l, isRunning: !l.isRunning } : l))
    );
  };

  const resetLane = (laneNum: number) => {
    setLanes((prev) =>
      prev.map((l) =>
        l.laneNumber === laneNum ? { ...l, timeMs: 0, isRunning: false, laps: [] } : l
      )
    );
  };

  const lapLane = (laneNum: number) => {
    setLanes((prev) =>
      prev.map((l) => {
        if (l.laneNumber === laneNum) {
          const currentFormatted = formatTime(l.timeMs);
          const lapNum = l.laps.length + 1;
          return {
            ...l,
            laps: [
              ...l.laps,
              {
                lapNumber: lapNum,
                splitTime: currentFormatted,
                totalTime: currentFormatted,
              },
            ],
          };
        }
        return l;
      })
    );
  };

  const handleApply = (swimmerName: string, timeMs: number) => {
    const formatted = formatTime(timeMs);
    if (onApplyTimeToMember) {
      onApplyTimeToMember(swimmerName, formatted);
    }
    setSyncToast(`Waktu ${formatted} untuk ${swimmerName} siap disinkronkan ke evaluasi teknik & rapor!`);
    setTimeout(() => setSyncToast(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center-safe justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 text-white shadow-2xl space-y-6 animate-in fade-in zoom-in-95 my-auto">
        {syncToast && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs font-bold text-emerald-300 animate-in fade-in flex items-center justify-between">
            <span>✓ {syncToast}</span>
            <button onClick={() => setSyncToast(null)} className="text-emerald-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-400/30">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-white flex items-center gap-2">
                <span>Multi-Lane Pool Stopwatch DS Aquatics</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold border border-cyan-500/30">
                  Akurasi 1/100 Detik
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Pencatatan waktu latihan lintasan, interval repetisi, dan pengambilan waktu personal best (PB).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Controls */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Kontrol Massal (Semua Lintasan):
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!globalRunning ? (
              <button
                onClick={handleStartAll}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Semua Lintasan</span>
              </button>
            ) : (
              <button
                onClick={handlePauseAll}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-slate-950" />
                <span>Pause Semua</span>
              </button>
            )}

            <button
              onClick={handleResetAll}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua</span>
            </button>
          </div>
        </div>

        {/* 6 Lanes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {lanes.map((lane) => {
            const formatted = formatTime(lane.timeMs);
            return (
              <div
                key={lane.laneNumber}
                className={`p-4 rounded-2xl border transition-all ${
                  lane.isRunning
                    ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Lane Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center">
                      {lane.laneNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      Lane {lane.laneNumber}
                    </span>
                  </div>

                  <select
                    value={lane.swimmerName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLanes((prev) =>
                        prev.map((l) =>
                          l.laneNumber === lane.laneNumber ? { ...l, swimmerName: val } : l
                        )
                      );
                    }}
                    className="bg-slate-800 text-[11px] font-bold text-cyan-300 rounded-lg px-2 py-1 border border-slate-700 focus:outline-hidden max-w-[140px] truncate"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.fullName}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Big Digital Timer Display */}
                <div className="py-3 text-center">
                  <span className="font-mono text-3xl font-black text-cyan-400 tracking-wider">
                    {formatted}
                  </span>
                </div>

                {/* Lap Splits Count */}
                {lane.laps.length > 0 && (
                  <div className="text-[10px] text-slate-400 flex items-center justify-between px-1 mb-2">
                    <span>Split Lap #{lane.laps.length}:</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {lane.laps[lane.laps.length - 1].splitTime}
                    </span>
                  </div>
                )}

                {/* Lane Controls */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => toggleLane(lane.laneNumber)}
                    className={`flex-1 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      lane.isRunning
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500'
                    }`}
                  >
                    {lane.isRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Stop</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => lapLane(lane.laneNumber)}
                    disabled={!lane.isRunning}
                    title="Catat Split Lap"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => resetLane(lane.laneNumber)}
                    title="Reset Lintasan"
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleApply(lane.swimmerName, lane.timeMs)}
                    disabled={lane.timeMs === 0}
                    title="Terapkan Waktu"
                    className="px-2 py-1.5 rounded-xl bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600 hover:text-white text-[11px] font-bold disabled:opacity-30 transition-all cursor-pointer"
                  >
                    Gunakan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
