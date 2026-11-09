"use client";

import { useEffect, useRef, useState } from "react";
import type { StreamSource } from "@/lib/api";
import {
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Server,
  Sparkles,
  AlertTriangle,
  Moon,
  Sun,
  Tv,
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
  const [isMuted, setIsMuted] = useState(false);
  const [lightsOff, setLightsOff] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<any>(null);

  const activeStream = streams[selectedStreamIndex] || streams[0];

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
      // Dynamic import of Hls.js to avoid SSR issues
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

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
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
      {/* Lights-Off Cinema Dimmer Overlay */}
      {lightsOff && (
        <div
          onClick={() => setLightsOff(false)}
          className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm transition-opacity"
        />
      )}

      <div
        ref={containerRef}
        className={`relative bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl transition-all ${
          lightsOff ? "z-50 ring-2 ring-emerald-500/50" : ""
        }`}
      >
        {/* Stream Status Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isLive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600/90 text-white font-black text-[11px] rounded uppercase tracking-wider shadow-lg shadow-red-600/30">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-zinc-800 text-zinc-300 font-bold text-[11px] rounded uppercase tracking-wider">
                VOD REPLAY
              </span>
            )}
            <span className="font-semibold text-white drop-shadow truncate max-w-[200px] sm:max-w-md">
              {matchTitle}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-bold text-[11px]">
              {activeStream?.quality || "1080p HD"}
            </span>
            <span className="px-2 py-0.5 bg-white/10 text-zinc-300 rounded font-medium text-[11px]">
              {activeStream?.language || "EN"}
            </span>
          </div>
        </div>

        {/* Video Player Display */}
        <div className="relative aspect-video w-full bg-[#050811] flex items-center justify-center">
          {hasError ? (
            <div className="text-center p-8 max-w-md">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-white font-bold text-lg mb-1">Stream Signal Interrupted</h3>
              <p className="text-zinc-400 text-xs mb-4">
                The current stream source timed out or hit bandwidth restrictions. Click below to switch to our backup high-speed server.
              </p>
              <button
                onClick={handleNextServer}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-4 h-4" /> Switch to Backup Server
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
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-xs">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                    <span className="text-xs font-semibold text-emerald-400 tracking-wider">
                      Connecting Ultra HD Stream...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="bg-[#0b101d] border-t border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Play/Pause, Mute, Server Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Server Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#141d33] px-2.5 py-1.5 rounded-lg border border-white/10">
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedStreamIndex}
                onChange={(e) => {
                  setSelectedStreamIndex(Number(e.target.value));
                  setHasError(false);
                }}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {streams.map((s, idx) => (
                  <option key={s.id || idx} value={idx} className="bg-[#0e1628] text-white">
                    {s.serverName} ({s.quality})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right: Theater Mode, Lights Off, Fullscreen */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLightsOff(!lightsOff)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium ${
                lightsOff
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title="Lights Off (Cinema Mode)"
            >
              {lightsOff ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline">Cinema</span>
            </button>

            {onTheaterToggle && (
              <button
                onClick={() => onTheaterToggle(!isTheaterMode)}
                className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium ${
                  isTheaterMode
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
                title="Theater Mode"
              >
                <Tv className="w-4 h-4" />
                <span className="hidden sm:inline">Theater</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
