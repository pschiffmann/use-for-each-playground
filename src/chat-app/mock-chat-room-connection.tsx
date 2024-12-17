import { useCallback, useSyncExternalStore } from "react";

const counters = {
  ctor: {} as Record<string, number>,
  close: {} as Record<string, number>,
};

export class ChatRoomConnection {
  constructor(readonly roomId: string) {
    counters.ctor[roomId] ??= 0;
    counters.close[roomId] ??= 0;
    console.log(`ctor ${roomId} called: ` + ++counters.ctor[roomId]!);
    this.#initialize();
  }

  #abortController = new AbortController();

  #readyState: "connecting" | "open" | "closed" = "connecting";
  get readyState() {
    return this.#readyState;
  }

  #setReadyState(readyState: "connecting" | "open" | "closed") {
    this.#readyState = readyState;
    this.#notify("readyState");
    if (this.messages.length !== 0) this.#notify("messages");
    if (this.unreadCount !== 0) this.#notify("unreadCount");
  }

  close() {
    if (this.#readyState === "closed") return;
    console.log(
      `close ${this.roomId} called: ` + ++counters.close[this.roomId]!
    );
    this.#abortController.abort();
    this.#setReadyState("closed");
  }

  get messages() {
    return this.#readyState === "open"
      ? SERVER_DATA.messages[this.roomId]!
      : NO_MESSAGES;
  }

  get unreadCount() {
    return this.#readyState === "open"
      ? SERVER_DATA.unreadCount[this.roomId]!
      : 0;
  }

  send(message: string) {
    this.#addMessage("you", message);
  }

  #addMessage(from: string, message: string) {
    SERVER_DATA.messages[this.roomId] = [
      ...SERVER_DATA.messages[this.roomId]!,
      `${now()} [${from}]: ${message}`,
    ];
    SERVER_DATA.unreadCount[this.roomId]!++;
    this.#notify("messages");
    this.#notify("unreadCount");
  }

  clearUnreadCount() {
    if (this.unreadCount === 0) return;
    SERVER_DATA.unreadCount[this.roomId]! = 0;
    this.#notify("unreadCount");
  }

  /** Generates a random message every 1-10 seconds. */
  async #initialize() {
    if (!Object.hasOwn(SERVER_DATA.messages, this.roomId)) {
      const messages = new Array(randomInt(0, 3)).fill(null).map(() => {
        const from = mockUsers[randomInt(0, mockUsers.length)]!;
        const message = mockMessages[randomInt(0, mockMessages.length)]!;
        return `${now()} [${from}]: ${message}`;
      });
      SERVER_DATA.messages[this.roomId] = messages;
      SERVER_DATA.unreadCount[this.roomId] = randomInt(0, messages.length);
    }

    await wait(1000);
    if (this.#abortController.signal.aborted) return;
    this.#setReadyState("open");

    while (true) {
      await wait(randomInt(500, 3000));
      if (this.#abortController.signal.aborted) break;
      this.#addMessage(
        mockUsers[randomInt(0, mockUsers.length)]!,
        mockMessages[randomInt(0, mockMessages.length)]!
      );
    }
  }

  #subscriptions = {
    readyState: new Set<() => void>(),
    messages: new Set<() => void>(),
    unreadCount: new Set<() => void>(),
  };

  #notify(prop: "readyState" | "messages" | "unreadCount") {
    for (const onStoreChange of this.#subscriptions[prop]) {
      onStoreChange();
    }
  }

  subscribe(
    prop: "readyState" | "messages" | "unreadCount",
    onChange: () => void
  ) {
    this.#subscriptions[prop].add(onChange);
    return () => {
      this.#subscriptions[prop].delete(onChange);
    };
  }
}

const NO_MESSAGES: readonly string[] = [];

/**
 * Save this data in a global variable so we can recover it if a connection is
 * closed and re-opened.
 */
const SERVER_DATA = {
  messages: {} as Record<string, readonly string[]>,
  unreadCount: {} as Record<string, number>,
};

/** Returns the `ChatRoomConnection.readyState` of `chatRoom`. */
export function useChatRoomReadyState(chatRoom: ChatRoomConnection | null) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = chatRoom?.subscribe("readyState", onStoreChange);
      return () => unsubscribe?.();
    },
    [chatRoom]
  );
  const getSnapshot = useCallback(
    () => chatRoom?.readyState ?? "closed",
    [chatRoom]
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Returns the `ChatRoomConnection.messages` of `chatRoom`. */
export function useChatRoomMessages(chatRoom: ChatRoomConnection | null) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = chatRoom?.subscribe("messages", onStoreChange);
      return () => unsubscribe?.();
    },
    [chatRoom]
  );
  const getSnapshot = useCallback(
    () => chatRoom?.messages ?? NO_MESSAGES,
    [chatRoom]
  );
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** Return the formatted current time. */
function now() {
  return new Intl.DateTimeFormat("en", {
    timeStyle: "short",
    hour12: false,
  }).format(new Date());
}

/** Returns a promise that resolves after `ms` milliseconds. */
function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Returns a random integer between `min` (inclusive) and `max` (exclusive). */
function randomInt(min: number, max: number) {
  return min + Math.trunc(Math.random() * (max - min));
}

// Taken from https://github.com/danielmiessler/SecLists/blob/master/Usernames/Names/familynames-usa-top1000.txt
const mockUsers = [
  "SMITH",
  "JOHNSON",
  "WILLIAMS",
  "JONES",
  "BROWN",
  "DAVIS",
  "MILLER",
  "WILSON",
  "MOORE",
  "TAYLOR",
  "ANDERSON",
  "THOMAS",
  "JACKSON",
  "WHITE",
  "HARRIS",
  "MARTIN",
  "THOMPSON",
  "GARCIA",
  "MARTINEZ",
  "ROBINSON",
];

// Taken from https://en.wikipedia.org/wiki/React_(software)
const mockMessages = [
  `React (also known as React.js or ReactJS) is a free and open-source front-end JavaScript library that aims to make building user interfaces based on components more "seamless".`,
  `It is maintained by Meta (formerly Facebook) and a community of individual developers and companies.`,
  `React can be used to develop single-page, mobile, or server-rendered applications with frameworks like Next.js.`,
  `Because React is only concerned with the user interface and rendering components to the DOM, React applications often rely on libraries for routing and other client-side functionality.`,
  `A key advantage of React is that it only re-renders those parts of the page that have changed, avoiding unnecessary re-rendering of unchanged DOM elements.`,
  `React adheres to the declarative programming paradigm.`,
  `Developers design views for each state of an application, and React updates and renders components when data changes.`,
  `This is in contrast with imperative programming.`,
  `React code is made of entities called components.`,
  `These components are modular and reusable.`,
  `React applications typically consist of many layers of components.`,
  `The components are rendered to a root element in the DOM using the React DOM library.`,
  `When rendering a component, values are passed between components through props (short for "properties").`,
  `Values internal to a component are called its state.`,
  `The two primary ways of declaring components in React are through function components and class components.`,
  `Function components are declared with a function (using JavaScript function syntax or an arrow function expression) that accepts a single "props" argument and returns JSX.`,
  `From React v16.8 onwards, function components can use state with the useState Hook.`,
  `On February 16, 2019, React 16.8 was released to the public, introducing React Hooks.`,
  `Hooks are functions that let developers "hook into" React state and lifecycle features from function components.`,
  `Notably, Hooks do not work inside classes — they let developers use more features of React without classes.`,
  `React provides several built-in hooks such as useState, useContext, useReducer, useMemo and useEffect.`,
  `Others are documented in the Hooks API Reference.`,
  `useState and useEffect, which are the most commonly used, are for controlling state and side effects, respectively.`,
];
