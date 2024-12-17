import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { makeChatApp } from "./components/chat-app.js";
import { ChatRoomConnection } from "./mock-chat-room-connection.js";

import "./main.scss";

function useMultipleConnectionsNonIdiomatic(
  roomIds: readonly string[]
): readonly (ChatRoomConnection | null)[] {
  const [connections, setConnections] = useState<
    Record<string, ChatRoomConnection>
  >({});

  // Open new connections
  useEffect(() => {
    for (const roomId of roomIds) {
      if (Object.hasOwn(connections, roomId)) continue;
      setConnections((prev) => ({
        ...prev,
        [roomId]: new ChatRoomConnection(roomId),
      }));
    }
  }, [roomIds, connections]);

  // Close no longer used connections on updates
  useEffect(
    () => () => {
      for (const [roomId, connection] of Object.entries(connections)) {
        if (roomIds.includes(roomId)) continue;
        connection.close();
        setConnections(({ [roomId]: _, ...rest }) => rest);
      }
    },
    [roomIds, connections]
  );

  // Close all connections on unmount
  useEffect(
    () => () => {
      Object.values(connections).forEach((connection) => connection.close());
    },
    []
  );

  return useMemo(
    () => roomIds.map((roomId) => connections[roomId] ?? null),
    [roomIds, connections]
  );
}

const ChatApp = makeChatApp(useMultipleConnectionsNonIdiomatic);

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <ChatApp />
  </StrictMode>
);
