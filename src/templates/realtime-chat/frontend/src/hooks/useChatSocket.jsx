import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useStoreAuth } from "../store/storeAuth";

// Connects to the Socket.IO server with the session cookie (withCredentials).
export default function useChatSocket() {
  const { apiBase } = useStoreAuth();
  const socketRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(apiBase, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("message", (m) => setMessages((prev) => [...prev, m]));

    return () => socket.disconnect();
  }, [apiBase]);

  const send = (text) =>
    new Promise((resolve) => {
      socketRef.current?.emit("message", { text }, resolve);
    });

  return { messages, connected, send };
}
