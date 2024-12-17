import { StrictMode, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { makeChatApp } from "./components/chat-app.js";
import { ChatRoomConnection } from "./mock-chat-room-connection.js";

import "./main.scss";

function useMultipleConnectionsNonIdiomatic(
  roomIds: readonly string[]
): readonly (ChatRoomConnection | null)[] {
  const connectionsRef = useRef(new Map<string, ChatRoomConnection>());
  const [connections, setConnections] = useState<
    ReadonlyMap<string, ChatRoomConnection>
  >(() => new Map());

  useEffect(() => {
    let hasChanges = false;

    const connections = connectionsRef.current;
    // Open new connections.
    for (const roomId of roomIds) {
      if (connections.has(roomId)) continue;
      hasChanges = true;
      connections.set(roomId, new ChatRoomConnection(roomId));
    }

    // Close no longer used connections on updates.
    for (const [roomId, connection] of connections) {
      if (roomIds.includes(roomId)) continue;
      hasChanges = true;
      connections.delete(roomId);
      connection.close();
    }

    // Trigger a re-render by writing to the `connections` state.
    // Note: It's possible that the effect runs but no connections were actually
    // opened/closed, because `roomIds` was only re-ordered but no room ids were
    // added/removed.
    if (hasChanges) setConnections(new Map(connections));
  }, [roomIds]);

  // Close all connections on unmount with a effect cleanup.
  useEffect(
    () => () => {
      connectionsRef.current.forEach((connection) => connection.close());
      connectionsRef.current.clear();
    },
    []
  );

  return useMemo(
    () => roomIds.map((roomId) => connections.get(roomId) ?? null),
    [roomIds, connections]
  );
}

const ChatApp = makeChatApp(useMultipleConnectionsNonIdiomatic);

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <ChatApp />
  </StrictMode>
);
