import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ChatRoomConnection } from "../mock-chat-room-connection.js";
import { bemClasses } from "./bem-classes.js";
import { ChatRoom } from "./chat-room.js";
import { AddIcon } from "./icons.js";
import { Tabs } from "./tabs.js";

import "./chat-app.scss";

const cls = bemClasses("chat-app");

export function makeChatApp(
  useMultipleConnections: (
    roomIds: readonly string[]
  ) => readonly (ChatRoomConnection | null)[]
) {
  return function ChatApp() {
    const [roomIds, setRoomIds] = useState([
      allRoomIds[6]!,
      allRoomIds[0]!,
      allRoomIds[8]!,
    ]);

    const connections = useMultipleConnections(roomIds);
    const unreadCounts = useMultipleUnreadCounts(connections);

    //
    // Tabs state management
    //
    const [activeTab, setActiveTab] = useState(roomIds[0]!);
    function addTab(roomId: string) {
      setRoomIds([...roomIds, roomId]);
      setActiveTab(roomId);
    }
    function closeTab(closedRoomId: string) {
      setRoomIds(roomIds.filter((roomId) => roomId !== closedRoomId));
      if (activeTab !== closedRoomId) return;
      const i = roomIds.indexOf(closedRoomId);
      setActiveTab(i === 0 ? roomIds[1]! : roomIds[i - 1]!);
    }
    function moveTab(
      movedRoomId: string,
      to: "before" | "after",
      referenceRoomId: string
    ) {
      const newRoomIds = roomIds.filter((id) => id !== movedRoomId);
      const referenceIndex = newRoomIds.indexOf(referenceRoomId);
      const insertIndex = to === "before" ? referenceIndex : referenceIndex + 1;
      newRoomIds.splice(insertIndex, 0, movedRoomId);
      setRoomIds(newRoomIds);
    }

    return (
      <div className={cls.block()}>
        <Tabs
          className={cls.element("tabs")}
          tabs={roomIds.map((roomId, i) => ({
            key: roomId,
            label: roomId,
            badge: unreadCounts[i]!,
            content: <ChatRoom connection={connections[i]!} />,
          }))}
          active={activeTab}
          onChange={setActiveTab}
          onClose={roomIds.length > 1 ? closeTab : undefined}
          onMove={moveTab}
          headerActions={
            <AddChatRoomButton connectedRoomIds={roomIds} onSelect={addTab} />
          }
        />
      </div>
    );
  };
}

interface AddChatRoomButtonProps {
  connectedRoomIds: readonly string[];
  onSelect(roomId: string): void;
}

function AddChatRoomButton({
  connectedRoomIds,
  onSelect,
}: AddChatRoomButtonProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <>
      <button
        className={cls.element("add-button")}
        title="Add chat room"
        popoverTarget={id}
      >
        <AddIcon />
      </button>
      <div ref={ref} className={cls.element("popover")} id={id} popover="auto">
        {allRoomIds.map(
          (roomId) =>
            !connectedRoomIds.includes(roomId) && (
              <button
                key={roomId}
                className={cls.element("popover-item")}
                onClick={() => {
                  onSelect(roomId);
                  ref.current!.hidePopover();
                }}
              >
                {roomId}
              </button>
            )
        )}
      </div>
    </>
  );
}

const allRoomIds = [
  "Animals",
  "Art",
  "Books",
  "Comedy",
  "Comics",
  "Culture",
  "Software Dev",
  "Education",
  "Food",
  "Video Games",
];

function useMultipleConnectionsComposed(roomIds: readonly string[]) {
  return roomIds.map((roomId) => {
    const [conn, setConn] = useState<ChatRoomConnection | null>(null);
    useEffect(() => {
      const connection = new ChatRoomConnection(roomId);
      setConn(connection);
      return () => {
        connection.close();
        setConn(null);
      };
    }, [roomId]);
    return conn;
  });
}

function useMultipleUnreadCounts(
  connections: readonly (ChatRoomConnection | null)[]
) {
  const [_, forceRender] = useState(0);
  useEffect(() => {
    const unsubscribe = connections.map((conn, i) =>
      conn?.subscribe("unreadCount", () => forceRender((n) => n + 1))
    );
    return () => {
      unsubscribe.forEach((cb) => cb?.());
    };
  }, [connections]);

  return connections.map((conn) => conn?.unreadCount ?? 0);
}

function useMultipleUnreadCounts2(
  connections: readonly (ChatRoomConnection | null)[]
) {
  const [unreadCounts, setUnreadCounts] = useState([]);
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = connections.map((conn) =>
        conn?.subscribe("unreadCount", onStoreChange)
      );
      return () => unsubscribe.forEach((cb) => cb?.());
    },
    [connections]
  );
  const getSnapshot = useCallback(
    // PROBLEM: `getSnapshot()` mustn't return a new array on each call, this
    // triggers infinite re-renders.
    () => connections.map((conn) => conn?.unreadCount ?? 0),
    [connections]
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}
