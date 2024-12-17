import { useEffect, useRef } from "react";
import {
  ChatRoomConnection,
  useChatRoomMessages,
  useChatRoomReadyState,
} from "../mock-chat-room-connection.js";
import { bemClasses } from "./bem-classes.js";

import "./chat-room.scss";

const cls = bemClasses("chat-room");

export interface ChatRoomProps {
  className?: string;
  connection: ChatRoomConnection | null;
}

export function ChatRoom({ className, connection }: ChatRoomProps) {
  const readyState = useChatRoomReadyState(connection);
  const messages = useChatRoomMessages(connection);

  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    (messagesRef.current!.lastChild as HTMLDivElement)?.scrollIntoView();
    connection?.clearUnreadCount();
  });

  return (
    <div className={cls.block(className)}>
      {readyState !== "open" && (
        <div className={cls.element("banner")}>
          {readyState === "connecting" ? "Connecting ..." : "Disconnected."}
        </div>
      )}

      <div ref={messagesRef} className={cls.element("messages")}>
        {messages.map((message, i) => (
          <div key={i} className={cls.element("message")}>
            {message}
          </div>
        ))}
      </div>

      <form
        className={cls.element("message-form")}
        action={(e) => {
          connection!.send(e.get("message") as string);
        }}
      >
        <input
          type="text"
          name="message"
          className={cls.element("textfield")}
          autoFocus
          autoComplete="off"
          placeholder="Enter message"
        />
        <button
          type="submit"
          className={cls.element("send-button")}
          disabled={readyState !== "open"}
        >
          Send
        </button>
      </form>
    </div>
  );
}
