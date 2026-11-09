"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ChatMessage,
  fetchChat,
  postChatMessage,
  postReaction,
} from "@/lib/api";
import { MessageSquare, Send, Users, Sparkles, Smile, Flame, Shield, User, Heart } from "lucide-react";

interface LiveChatProps {
  matchId: string;
  viewersCount: number;
}

const REACTIONS: { key: "goal" | "fire" | "clap" | "goat" | "shock" | "heart"; label: string; icon: string }[] = [
  { key: "goal", label: "Goal", icon: "⚽" },
  { key: "fire", label: "Fire", icon: "🔥" },
  { key: "clap", label: "Bravo", icon: "👏" },
  { key: "goat", label: "GOAT", icon: "🐐" },
  { key: "shock", label: "OMG", icon: "😱" },
  { key: "heart", label: "Love", icon: "❤️" },
];

export function LiveChat({ matchId, viewersCount }: LiveChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const [nickname, setNickname] = useState("");
  const [isSettingNickname, setIsSettingNickname] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; icon: string; left: number }[]>([]);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Initialize random guest nickname if none in localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sckoll_fan_nickname");
    if (saved) {
      setNickname(saved);
    } else {
      const generated = `Fan_${Math.floor(1000 + Math.random() * 9000)}`;
      setNickname(generated);
      localStorage.setItem("sckoll_fan_nickname", generated);
    }
  }, []);

  // Poll for messages and reactions every 3 seconds
  useEffect(() => {
    let mounted = true;

    const loadChat = async () => {
      try {
        const data = await fetchChat(matchId);
        if (mounted) {
          setMessages(data.messages);
          setReactions(data.reactions);
        }
      } catch {
        // silent failover
      }
    };

    loadChat();
    const interval = setInterval(loadChat, 3500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [matchId]);

  // Auto scroll down when new message arrives
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const messageText = text.trim();
    setText("");

    const newMsg = await postChatMessage(matchId, {
      username: nickname || "SportsFan",
      message: messageText,
      userBadge: "FAN",
    });

    if (newMsg) {
      setMessages((prev) => [...prev, newMsg]);
    }
  };

  const handleReactionClick = async (reaction: typeof REACTIONS[number]) => {
    // Add floating visual animation
    const id = Date.now() + Math.random();
    const left = Math.floor(Math.random() * 70) + 15; // 15% - 85%
    setFloatingEmojis((prev) => [...prev, { id, icon: reaction.icon, left }]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 1800);

    // Optimistic tally update
    setReactions((prev) => ({
      ...prev,
      [reaction.key]: (prev[reaction.key] || 0) + 1,
    }));

    await postReaction(matchId, reaction.key);
  };

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      localStorage.setItem("sckoll_fan_nickname", nickname.trim());
      setIsSettingNickname(false);
    }
  };

  return (
    <div className="relative flex flex-col h-[540px] bg-gradient-to-b from-[#0c1220] to-[#080d19] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
      {/* Floating Emojis Container */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {floatingEmojis.map((emoji) => (
          <span
            key={emoji.id}
            style={{ left: `${emoji.left}%`, bottom: "70px" }}
            className="absolute text-3xl animate-float drop-shadow-lg"
          >
            {emoji.icon}
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="px-4 py-3 bg-[#0f172a] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="font-black text-white text-xs tracking-wider uppercase">Live Fan Chat</h3>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-black text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <Users className="w-3 h-3 text-red-400" />
          <span>{viewersCount.toLocaleString()} in room</span>
        </div>
      </div>

      {/* Pinned Welcome Note */}
      <div className="px-3.5 py-2 bg-emerald-500/10 border-b border-emerald-500/15 flex items-center justify-between text-[11px]">
        <span className="text-emerald-300 font-medium truncate">
          💬 Keep banter friendly & respect all fans!
        </span>
        <button
          onClick={() => setIsSettingNickname(!isSettingNickname)}
          className="text-emerald-400 hover:underline font-bold ml-2 whitespace-nowrap"
        >
          {nickname}
        </button>
      </div>

      {/* Nickname Editor Drawer */}
      {isSettingNickname && (
        <form onSubmit={handleSaveNickname} className="p-3 bg-[#111c33] border-b border-white/10 flex gap-2 text-xs">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Choose your fan nickname..."
            maxLength={20}
            className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-500 text-black font-black rounded-lg hover:bg-emerald-400"
          >
            Save
          </button>
        </form>
      )}

      {/* Message Feed */}
      <div
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 text-xs scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-zinc-600" />
            <p>Welcome to the stadium fan room! Say hello and cheer for your team.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.username === nickname;
            return (
              <div
                key={m.id}
                className={`flex flex-col p-2.5 rounded-xl border transition-colors ${
                  isMe
                    ? "bg-emerald-500/10 border-emerald-500/25 ml-4"
                    : "bg-white/5 border-white/5 hover:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-black text-[11px] ${
                        isMe
                          ? "text-emerald-400"
                          : m.userBadge === "VIP"
                          ? "text-amber-400"
                          : "text-zinc-200"
                      }`}
                    >
                      {m.username}
                    </span>
                    {m.userBadge && (
                      <span
                        className={`px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${
                          m.userBadge === "VIP"
                            ? "bg-amber-400 text-black"
                            : "bg-white/10 text-zinc-300"
                        }`}
                      >
                        {m.userBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-zinc-200 break-words leading-relaxed">{m.message}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Reaction Quick Bar */}
      <div className="px-3 py-2 bg-[#0a0f1c] border-t border-white/5 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        {REACTIONS.map((r) => {
          const count = reactions[r.key] || 0;
          return (
            <button
              key={r.key}
              onClick={() => handleReactionClick(r)}
              className="flex items-center gap-1 px-2.5 py-1 bg-white/5 hover:bg-white/10 hover:scale-110 active:scale-95 transition-all rounded-lg text-xs font-bold text-zinc-300 group"
              title={r.label}
            >
              <span className="text-sm">{r.icon}</span>
              {count > 0 && <span className="text-[10px] text-zinc-400 font-mono">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Chat Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-[#0d1424] border-t border-white/10 flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Comment as ${nickname}...`}
          maxLength={140}
          className="flex-1 bg-[#060a14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black hover:from-emerald-400 hover:to-teal-300 disabled:opacity-40 disabled:hover:from-emerald-500 transition-all shadow-md shadow-emerald-500/20"
          title="Send message"
        >
          <Send className="w-4 h-4 fill-black" />
        </button>
      </form>
    </div>
  );
}
