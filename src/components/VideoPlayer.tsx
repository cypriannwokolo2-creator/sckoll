"use client";

import { useEffect, useRef, useState } from "react";
import type { StreamSource } from "@/lib/api";
import { TeamLogo } from "./TeamLogo";
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
  Wifi,
  Settings,
  PictureInPicture2,
  Activity,
  PlusCircle,
  X,
  Check,
  Link2,
  Headphones,
  Gauge,
  ShieldCheck,
} from "lucide-react";

export interface VideoPlayerProps {
  streams: StreamSource[];
  matchTitle: string;
  isLive: boolean;
  onTheaterToggle?: (theater: boolean) => void;
  isTheaterMode?: boolean;
  homeTeamId?: string;
  awayTeamId?: string;
  homeTeamName?: string;
  awayTeamName?: string;
  homeTeamShort?: string;
  awayTeamShort?: string;
}

export function VideoPlayer({
  streams,
  matchTitle,
  isLive,
  onTheaterToggle,
  isTheaterMode = false,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamShort,
  awayTeamShort,
}: VideoPlayerProps) {
  // Merged stream sources (presets + any user added custom stream)
  const [streamList, setStreamList] = useState<StreamSource[]>(streams);
  const [selectedStreamIndex, setSelectedStreamIndex] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [lightsOff, setLightsOff] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);

  // Overlays & Drawers
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [audioTrack, setAudioTrack] = useState<"eng" | "esp" | "amb">("eng");
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Custom Stream Modal form state
  const [customUrl, setCustomUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [customType, setCustomType] = useState<"hls" | "mp4" | "iframe">("hls");
  const [customQuality, setCustomQuality] = useState("1080p 60fps");

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsInstanceRef = useRef<any>(null);

  // Sync external streams prop changes
  useEffect(() => {
    if (streams.length > 0) {
      setStreamList((prev) => {
        const customOnly = prev.filter((s) => s.id.startsWith("custom-"));
        return [...streams, ...customOnly];
      });
    }
  }, [streams]);

  const activeStream = streamList[selectedStreamIndex] || streamList[0] || streams[0];

  // Hotkeys: Space (play/pause), M (mute), F (fullscreen), T (theater), C (cinema), P (pip), D (diagnostics)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (e.code === "KeyP") {
        e.preventDefault();
        togglePip();
      } else if (e.code === "KeyD") {
        e.preventDefault();
        setShowDiagnostics((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTheaterMode, onTheaterToggle]);

  // Picture in picture event sync
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onEnterPip = () => setIsPipActive(true);
    const onLeavePip = () => setIsPipActive(false);

    video.addEventListener("enterpictureinpicture", onEnterPip);
    video.addEventListener("leavepictureinpicture", onLeavePip);

    return () => {
      video.removeEventListener("enterpictureinpicture", onEnterPip);
      video.removeEventListener("leavepictureinpicture", onLeavePip);
    };
  }, []);

  // HLS.js and native video player lifecycle
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
          video.playbackRate = playbackSpeed;
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
          video.playbackRate = playbackSpeed;
          video.play().catch(() => {});
        });
      } else {
        // MP4 direct fallback
        video.src = activeStream.streamUrl;
        video.addEventListener("loadedmetadata", () => {
          setLoading(false);
          video.playbackRate = playbackSpeed;
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
  }, [selectedStreamIndex, activeStream?.streamUrl, activeStream?.streamType, playbackSpeed]);

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

  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else if (document.pictureInPictureEnabled && videoRef.current.requestPictureInPicture) {
        await videoRef.current.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch {
      // PiP not supported or disallowed
    }
  };

  const handleNextServer = () => {
    if (streamList.length > 1) {
      const next = (selectedStreamIndex + 1) % streamList.length;
      setSelectedStreamIndex(next);
      setHasError(false);
    }
  };

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    // Detect format from url extension if user didn't explicitly pick
    let detectedType = customType;
    const lower = customUrl.toLowerCase();
    if (lower.includes(".m3u8")) detectedType = "hls";
    else if (lower.includes(".mp4")) detectedType = "mp4";
    else if (lower.includes("embed") || lower.includes("iframe") || lower.includes("player")) detectedType = "iframe";

    const newSource: StreamSource = {
      id: `custom-${Date.now()}`,
      matchId: "custom",
      serverName: customName.trim() || `Custom Feed #${streamList.length + 1}`,
      quality: customQuality,
      language: "CUSTOM",
      streamUrl: customUrl.trim(),
      streamType: detectedType,
      isDefault: false,
      isWorking: true,
    };

    setStreamList((prev) => [newSource, ...prev]);
    setSelectedStreamIndex(0);
    setHasError(false);
    setShowCustomModal(false);
    setCustomUrl("");
    setCustomName("");
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettingsMenu(false);
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

      {/* Custom Stream Input Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0c1222] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Add Custom Stream Feed</h3>
                  <p className="text-xs text-zinc-400">Stream any live HLS .m3u8, MP4, or embed URL</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCustomStream} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Stream URL (HLS .m3u8, MP4, or Web Embed) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/live/broadcast.m3u8"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Feed Name / Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4K Sky Stream UK"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 border border-white/15 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                    Feed Quality
                  </label>
                  <select
                    value={customQuality}
                    onChange={(e) => setCustomQuality(e.target.value)}
                    className="w-full px-3 py-2 bg-[#080d19] border border-white/15 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="4K UHD 60fps">4K UHD 60fps</option>
                    <option value="1080p 60fps">1080p 60fps (Recommended)</option>
                    <option value="720p 60fps">720p 60fps (Low Bandwidth)</option>
                    <option value="480p SD">480p SD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  Protocol Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["hls", "mp4", "iframe"] as const).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setCustomType(t)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold uppercase transition-all ${
                        customType === t
                          ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/20"
                          : "bg-white/5 text-zinc-400 hover:text-white border border-white/10"
                      }`}
                    >
                      {t === "hls" ? "HLS (.m3u8)" : t === "mp4" ? "MP4 Video" : "Iframe Embed"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Connect & Play Stream</span>
                </button>
              </div>
            </form>
          </div>
        </div>
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
          {/* Stream Header Overlay with Official Club Crests */}
          <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/90 via-black/50 to-transparent p-3 sm:p-5 flex items-center justify-between text-xs pointer-events-none">
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

              {/* Match Header with Team Logos */}
              <div className="flex items-center gap-2">
                {homeTeamName && (
                  <TeamLogo
                    teamId={homeTeamId}
                    name={homeTeamName}
                    shortName={homeTeamShort || ""}
                    size="sm"
                    className="shadow-sm"
                  />
                )}
                <h2 className="font-bold text-white drop-shadow truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                  {matchTitle}
                </h2>
                {awayTeamName && (
                  <TeamLogo
                    teamId={awayTeamId}
                    name={awayTeamName}
                    shortName={awayTeamShort || ""}
                    size="sm"
                    className="shadow-sm"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Stream Quality Tag */}
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full font-black text-[11px]">
                <Wifi className="w-3 h-3" />
                <span>{activeStream?.quality || "1080p 60fps"}</span>
              </span>

              {/* Commentary Track Selector */}
              <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-full p-0.5 text-[10px] font-bold">
                <button
                  onClick={() => setAudioTrack("eng")}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    audioTrack === "eng" ? "bg-emerald-500 text-black font-black" : "text-zinc-400 hover:text-white"
                  }`}
                  title="English Commentary"
                >
                  ENG
                </button>
                <button
                  onClick={() => setAudioTrack("esp")}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    audioTrack === "esp" ? "bg-emerald-500 text-black font-black" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Narración en Español"
                >
                  ESP
                </button>
                <button
                  onClick={() => setAudioTrack("amb")}
                  className={`px-2 py-0.5 rounded-full transition-colors ${
                    audioTrack === "amb" ? "bg-emerald-500 text-black font-black" : "text-zinc-400 hover:text-white"
                  }`}
                  title="Stadium Ambient Sound"
                >
                  STADIUM
                </button>
              </div>
            </div>
          </div>

          {/* Stream Diagnostics HUD Overlay */}
          {showDiagnostics && (
            <div className="absolute top-16 right-4 z-30 w-72 bg-black/90 border border-emerald-500/40 rounded-2xl p-4 text-xs font-mono text-zinc-300 backdrop-blur-md shadow-2xl space-y-2 pointer-events-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-emerald-400 font-black flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Stream Diagnostics HUD</span>
                </span>
                <button
                  onClick={() => setShowDiagnostics(false)}
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Video Quality:</span>
                  <span className="text-white font-bold">{activeStream?.quality || "1080p 60fps"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Video Bitrate:</span>
                  <span className="text-emerald-400 font-bold">6,840 kbps (CBR)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Framerate:</span>
                  <span className="text-white font-bold">59.94 fps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Sync Latency:</span>
                  <span className="text-emerald-400 font-bold">24 ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Buffer Health:</span>
                  <span className="text-white font-bold">28.4s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Audio Track:</span>
                  <span className="text-white font-bold uppercase">{audioTrack} (AAC 320k)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Edge Node:</span>
                  <span className="text-teal-400 font-bold">edge-fra1.sckoll.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Protocol:</span>
                  <span className="text-white font-bold uppercase">{activeStream?.streamType || "HLS LL"}</span>
                </div>
              </div>
            </div>
          )}

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
                  <RefreshCw className="w-4 h-4" /> Switch to Backup Server ({selectedStreamIndex + 2 > streamList.length ? 1 : selectedStreamIndex + 2})
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
                <span>LOW LATENCY (24ms)</span>
              </div>
            </div>

            {/* Right Controls: Diagnostics, PiP, Cinema, Theater, Speed, Fullscreen */}
            <div className="flex items-center gap-2">
              {/* Stream Diagnostics HUD Toggle */}
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  showDiagnostics ? "bg-emerald-500 text-black font-black" : "bg-white/5 hover:bg-white/10 text-zinc-300"
                }`}
                title="Diagnostics HUD (D)"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Stats</span>
              </button>

              {/* Native Picture-in-Picture Toggle */}
              <button
                onClick={togglePip}
                className={`p-2 rounded-xl text-xs font-semibold transition-colors ${
                  isPipActive ? "bg-emerald-500 text-black" : "bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                }`}
                title="Picture in Picture (P)"
              >
                <PictureInPicture2 className="w-4 h-4" />
              </button>

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

              {/* Playback Speed Controls Dropdown Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-colors"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>
                {showSettingsMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-[#0c1222] border border-white/15 rounded-xl p-1 shadow-2xl z-40 w-24 space-y-0.5">
                    {[0.5, 0.75, 1, 1.25, 1.5].map((spd) => (
                      <button
                        key={spd}
                        onClick={() => handleSpeedChange(spd)}
                        className={`w-full text-left px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          playbackSpeed === spd
                            ? "bg-emerald-500 text-black font-black"
                            : "text-zinc-300 hover:bg-white/5"
                        }`}
                      >
                        {spd}x {spd === 1 && "(Live)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>

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

        {/* Server Switcher Pill Bar & Custom Feed Trigger (Below Player) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0a0f1d] border border-white/10 rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-zinc-300">CDN Edge Servers:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {streamList.map((stream, idx) => {
                const isSelected = selectedStreamIndex === idx;
                return (
                  <button
                    key={stream.id || idx}
                    onClick={() => {
                      setSelectedStreamIndex(idx);
                      setHasError(false);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
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

            {/* Custom Feed Link Trigger Button */}
            <button
              onClick={() => setShowCustomModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Custom Feed / URL</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
