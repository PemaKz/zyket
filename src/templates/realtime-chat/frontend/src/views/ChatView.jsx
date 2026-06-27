import { useState, useRef, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import useChatSocket from "../hooks/useChatSocket";

export default function ChatView() {
  const { user, logout } = useAuth();
  const { messages, connected, send } = useChatSocket();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    await send(value);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="font-bold">#general</span>
          <span className={`text-xs ${connected ? "text-green-400" : "text-zinc-500"}`}>
            {connected ? "● online" : "○ connecting…"}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">{user?.name || user?.email}</span>
          <button onClick={logout} className="text-zinc-400 hover:text-white">Logout</button>
        </div>
      </header>

      <main className="flex-1 overflow-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-zinc-600 text-sm">No messages yet. Say hi 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.user?.id === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-md px-4 py-2 rounded-2xl ${mine ? "bg-orange-500 text-black" : "bg-zinc-800"}`}>
                {!mine && <p className="text-xs text-zinc-400 mb-0.5">{m.user?.name}</p>}
                <p className="text-sm break-words">{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </main>

      <form onSubmit={onSend} className="flex gap-2 px-6 py-4 border-t border-zinc-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 outline-none focus:border-orange-500"
        />
        <button type="submit" className="px-5 py-2 rounded-lg bg-orange-500 text-black font-semibold">
          Send
        </button>
      </form>
    </div>
  );
}
