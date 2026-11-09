"use client";

import { useEffect, useRef, useState } from "react";
import {
  type ChatMessage,
  fetchChat,
  postChatMessage,
  postReaction,
} from "@/lib/api";
import { MessageSquare, Send, Users, Sparkles, Smile, Flame } from "lucide-react";

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
      const data = await fetchChat(matchId);
      if (mounted) {
        setMessages(data.messages);
        setReactions(data.reactions);
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

  return (
    <div className="relative flex flex-col h-[520px] bg-[#0c1220] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
      {/* Floating Emojis Container */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {floatingEmojis.map((emoji) => (
          <span
            key={emoji.id}
            style={{ left: `${emoji.left}%`, bottom: "60px" }}
            className="absolute text-2xl animate-float"
          >
            {emoji.icon}
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="px-4 py-3 bg-[#111827] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-white text-xs tracking-wider uppercase">Live Match Chat</h3>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <Users className="w-3 h-3 text-red-400" />
          <span>{viewersCount.toLocaleString()} watching</span>
        </div>
      </div>

      {/* Nickname pill */}
      <div className="px-4 py-1.5 bg-[#090d17] border-b border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span>Chatting as:</span>
          {isSettingNickname ? (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onBlur={() => {
                setIsSettingNickname(false);
                localStorage.setItem("sckoll_fan_nickname", nickname);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSettingNickname(false);
                  localStorage.setItem("sckoll_fan_nickname", nickname);
                }
              }}
              autoFocus
              className="bg-black/50 border border-emerald-500 rounded px-1.5 py-0.5 text-white font-semibold text-[11px]"
            />
          ) : (
            <button
              onClick={() => setIsSettingNickname(true)}
              className="text-emerald-400 font-bold hover:underline"
            >
              {nickname}
            </button>
          )}
        </div>
        <button
          onClick={() => setIsSettingNickname(!isSettingNickname)}
          className="text-zinc-500 hover:text-zinc-300 text-[10px]"
        >
          change
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatScrollRef} className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-4">
            <Sparkles className="w-8 h-8 text-zinc-600 mb-2" />
            <p className="text-xs">Match chat is open!</p>
            <p className="text-[11px] text-zinc-600">Cheer for your team or react with live emojis.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="leading-relaxed break-words">
              <span
                className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-black mr-1.5 ${
                  msg.userBadge === "VIP"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : msg.userBadge === "MOD"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}
              >
                {msg.userBadge}
              </span>
              <span className="font-bold text-zinc-300 hover:text-white mr-1.5">
                {msg.username}:
              </span>
              <span className="text-zinc-200">{msg.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Live Reactions Floating Bar */}
      <div className="px-3 py-2 bg-[#0a0f1d] border-t border-white/5 flex items-center justify-between gap-1">
        {REACTIONS.map((r) => {
          const count = reactions[r.key] || 0;
          return (
            <button
              key={r.key}
              onClick={() => handleReactionClick(r)}
              className="flex items-center gap-1 px-2 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-transform active:scale-125"
              title={r.label}
            >
              <span>{r.icon}</span>
              {count > 0 && (
                <span className="text-[10px] font-bold text-zinc-400">
                  {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-2.5 bg-[#0e1424] border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send match reaction..."
          maxLength={280}
          className="flex-1 bg-[#141b2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-3 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-500/20"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
