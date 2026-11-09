"use client";

import { useEffect, useRef, useState } from "react";
import type { StreamSource } from "@/lib/api";
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  RefreshCw,
  Server,
  Sparkles,
  AlertTriangle,
  Moon,
  Sun,
  Tv,
  Radio,
  Wifi,
  Settings,
} from "lucide-react";

interface VideoPlayerProps {
  streams: StreamSource[];
  matchTitle: string;
  isLive: boolean;
  onTheaterToggle?: (theater: boolean) => void;
  isTheaterMode?: boolean;
}

export function VideoPlayer({
  streams,
  matchTitle,
  isLive,
  onTheaterToggle,
  isTheaterMode = false,
}: VideoPlayerProps) {
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<any>(null);

  const activeStream = streams[selectedStreamIndex] || streams[0];

  // Hotkeys: Space (play/pause), M (mute), F (fullscreen), T (theater), C (cinema)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in chat or search input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "KeyM") {
        e.preventDefault();
        toggleMute();
      } else if (e.code === "KeyF") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === "KeyT" && onTheaterToggle) {
        e.preventDefault();
        onTheaterToggle(!isTheaterMode);
      } else if (e.code === "KeyC") {
        e.preventDefault();
        setLightsOff((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTheaterMode, onTheaterToggle]);

  useEffect(() => {
    if (!activeStream || activeStream.streamType === "iframe") {
      setLoading(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    setLoading(true);
    setHasError(false);

    let hls: any = null;

    const setupHls = async () => {
      const Hls = (await import("hls.js")).default;

      if (activeStream.streamType === "hls" && Hls.isSupported()) {
        if (hlsInstanceRef.current) {
          hlsInstanceRef.current.destroy();
        }

        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
        });

        hls.loadSource(activeStream.streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch(() => {
            // Autoplay with sound may be blocked by browser policy; mute and retry
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
          });
        });

        hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setHasError(true);
                hls.destroy();
                break;
            }
          }
        });

        hlsInstanceRef.current = hls;
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native Safari HLS
        video.src = activeStream.streamUrl;
        video.addEventListener("loadedmetadata", () => {
          setLoading(false);
          video.play().catch(() => {});
        });
      } else {
        // MP4 direct fallback
        video.src = activeStream.streamUrl;
        video.addEventListener("loadedmetadata", () => {
          setLoading(false);
          video.play().catch(() => {});
        });
      }
    };

    setupHls();

    return () => {
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [selectedStreamIndex, activeStream?.streamUrl, activeStream?.streamType]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleNextServer = () => {
    if (streams.length > 1) {
      const next = (selectedStreamIndex + 1) % streams.length;
      setSelectedStreamIndex(next);
      setHasError(false);
    }
  };

  return (
    <>
      {/* Lights-Off Cinema Dimmer Backdrop */}
      {lightsOff && (
        <div
          onClick={() => setLightsOff(false)}
          className="fixed inset-0 z-40 bg-black/95 backdrop-blur-md transition-opacity duration-300"
        />
      )}

      <div className="relative group">
        {/* Ambient Backlight Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-cyan-500/20 rounded-3xl blur-xl opacity-60 group-hover:opacity-100 transition duration-700 pointer-events-none" />

        <div
          ref={containerRef}
          className={`relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all ${
            lightsOff ? "z-50 ring-2 ring-emerald-500/60 shadow-emerald-500/20" : ""
          }`}
        >
          {/* Stream Header Overlay */}
          <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-4 sm:p-5 flex items-center justify-between text-xs pointer-events-none">
            <div className="flex items-center gap-2.5 pointer-events-auto">
              {isLive ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[11px] rounded-full uppercase tracking-wider shadow-lg shadow-red-600/40">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE STREAM
                </span>
              ) : (
                <span className="px-3 py-1 bg-zinc-800 text-zinc-300 font-bold text-[11px] rounded-full uppercase tracking-wider">
                  VOD REPLAY
                </span>
              )}
              <h2 className="font-bold text-white drop-shadow truncate max-w-[200px] sm:max-w-md">
                {matchTitle}
              </h2>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-black text-[11px]">
                <Wifi className="w-3 h-3" />
                <span>{activeStream?.quality || "1080p 60fps"}</span>
              </span>
              <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md text-zinc-200 border border-white/10 rounded-full font-bold text-[11px]">
                {activeStream?.language || "ENG"}
              </span>
            </div>
          </div>

          {/* Video Viewport */}
          <div className="relative aspect-video w-full bg-[#050811] flex items-center justify-center">
            {hasError ? (
              <div className="text-center p-8 max-w-md z-20">
                <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg mb-1">Stream Signal Interrupted</h3>
                <p className="text-zinc-400 text-xs mb-4">
                  The current stream source timed out or hit bandwidth restrictions. Click below to immediately switch to our secondary backup CDN edge.
                </p>
                <button
                  onClick={handleNextServer}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-black font-black text-xs rounded-xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25"
                >
                  <RefreshCw className="w-4 h-4" /> Switch to Backup Server ({selectedStreamIndex + 2 > streams.length ? 1 : selectedStreamIndex + 2})
                </button>
              </div>
            ) : activeStream?.streamType === "iframe" ? (
              <iframe
                src={activeStream.streamUrl}
                className="w-full h-full border-0"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-presentation"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={togglePlay}
                />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs z-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                      <span className="text-xs font-bold text-emerald-400 tracking-wider">
                        Connecting Ultra HD Broadcast...
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Custom Stream Control Bar */}
          <div className="bg-[#080d1a] border-t border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Left Controls: Play/Pause, Volume, Low Latency Indicator */}
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              {/* Volume Slider with Mute Toggle */}
              <div className="flex items-center gap-2 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                  title="Mute / Unmute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : volume < 0.5 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 accent-emerald-500 cursor-pointer hidden sm:block"
                />
              </div>

              {/* Low-Latency Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LOW LATENCY (32ms)</span>
              </div>
            </div>

            {/* Right Controls: Cinema Mode, Theater Mode, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Cinema Mode Toggle */}
              <button
                onClick={() => setLightsOff(!lightsOff)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  lightsOff ? "bg-emerald-500 text-black font-black" : "bg-white/5 hover:bg-white/10 text-zinc-300"
                }`}
                title="Cinema Lights Out (C)"
              >
                {lightsOff ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{lightsOff ? "Lights On" : "Cinema"}</span>
              </button>

              {/* Theater Mode Toggle */}
              {onTheaterToggle && (
                <button
                  onClick={() => onTheaterToggle(!isTheaterMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    isTheaterMode ? "bg-cyan-500 text-black font-black" : "bg-white/5 hover:bg-white/10 text-zinc-300"
                  }`}
                  title="Theater Mode (T)"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Theater</span>
                </button>
              )}

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                title="Fullscreen (F)"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Server Switcher Pill Bar (Below Player) */}
        {streams.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0a0f1d] border border-white/10 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-300">Fast CDN Edge:</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {streams.map((stream, idx) => {
                const isSelected = selectedStreamIndex === idx;
                return (
                  <button
                    key={stream.id || idx}
                    onClick={() => {
                      setSelectedStreamIndex(idx);
                      setHasError(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black"
                        : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-black" : "bg-emerald-400"}`} />
                    <span>{stream.serverName || `Server ${idx + 1}`}</span>
                    <span className="text-[10px] opacity-75">({stream.quality})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
