import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { makeChatApp } from "./components/chat-app.js";
import { ChatRoomConnection } from "./mock-chat-room-connection.js";

import "./main.scss";

function useMultipleConnectionsNaive(
  roomIds: readonly string[]
): readonly (ChatRoomConnection | null)[] {
  const [connections, setConnections] = useState<{
    readonly roomIds: readonly string[];
    readonly connections: readonly ChatRoomConnection[];
  }>(() => ({ roomIds, connections: [] }));

  useEffect(() => {
    const connections = roomIds.map((roomId) => new ChatRoomConnection(roomId));
    setConnections({ roomIds, connections });
    return () => {
      connections.forEach((connection) => connection.close());
    };
  }, [roomIds]);

  return useMemo(
    () =>
      connections.roomIds === roomIds
        ? connections.connections
        : roomIds.map(() => null),
    [roomIds, connections]
  );
}

const ChatApp = makeChatApp(useMultipleConnectionsNaive);

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <ChatApp />
  </StrictMode>
);
