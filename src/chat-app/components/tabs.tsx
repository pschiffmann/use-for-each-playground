import {
  useEffect,
  useId,
  useRef,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { bemClasses } from "./bem-classes.js";
import { CloseIcon, DragIndicatorIcon } from "./icons.js";

import "./tabs.scss";

const cls = bemClasses("tabs");

export interface TabsProps {
  className?: string;

  tabs: readonly {
    /**
     * Identifies this tab across renders if `tabs` changes. Must be unique
     * within this array.
     */
    readonly key: string;

    /** Human-readable tab label. */
    readonly label: string;

    /** Displays a counter on the tab if not 0. */
    readonly badge?: number;

    /** Tab panel content. */
    readonly content: ReactNode;
  }[];

  /** The `tabs.key` of the active tab. */
  active: string;

  /** Called with the new active tab key when the user changes the tab. */
  onChange(key: string): void;

  /** Called with the closed tab key when the user closes a tab. */
  onClose?(key: string): void;

  /** Called when the user moves a tab. */
  onMove(movedKey: string, to: "before" | "after", referenceKey: string): void;

  /** These elements are rendered visually aligned with the tab list. */
  headerActions?: ReactNode;
}

export function Tabs({
  className,
  tabs,
  active,
  onChange,
  onClose,
  onMove,
  headerActions,
}: TabsProps) {
  const idPrefix = useId();

  // The tab `onDrop` handler gives a preference for the before/after position
  // based on whether the drop gesture was on the left or right side of the
  // dropzone. But if `movedKey` is already a direct neighbour of `referenceKey`
  // on the `to` side, we ignore the drop gesture preference and move the tab
  // to the other side anyways.
  function onMoveWrapped(
    movedKey: string,
    to: "before" | "after",
    referenceKey: string
  ) {
    const movedIndex = tabs.findIndex(({ key }) => key === movedKey);
    const referenceIndex = tabs.findIndex(({ key }) => key === referenceKey);
    switch (true) {
      case to === "before" && movedIndex === referenceIndex - 1:
        onMove(movedKey, "after", referenceKey);
        break;
      case to === "after" && movedIndex === referenceIndex + 1:
        onMove(movedKey, "before", referenceKey);
        break;
      default:
        onMove(movedKey, to, referenceKey);
        break;
    }
  }

  return (
    <div className={cls.block(className)}>
      <TabList>
        {tabs.map(({ key, label, badge }, i) => (
          <Tab
            key={key}
            idPrefix={idPrefix}
            tabKey={key}
            label={label}
            badge={badge}
            active={key === active}
            onActivate={() => onChange(key)}
            onClose={onClose && (() => onClose(key))}
            onMove={onMoveWrapped}
          />
        ))}
      </TabList>

      {headerActions && (
        <div className={cls.element("header-actions")}>{headerActions}</div>
      )}

      {tabs.map(({ key, content }, i) => (
        <div
          key={key}
          className={cls.element("panel", null, key === active && "active")}
          role="tabpanel"
          id={makeTabPanelId(idPrefix, key)}
          aria-labelledby={makeTabId(idPrefix, key)}
        >
          {key === active && content}
        </div>
      ))}
    </div>
  );
}

interface TabListProps {
  children: ReactNode;
}

function TabList({ children }: TabListProps) {
  return (
    <div className={cls.element("list")} role="tablist">
      {children}
    </div>
  );
}

interface TabProps {
  idPrefix: string;
  tabKey: string;
  label: string;
  badge?: number;
  active: boolean;
  onActivate(): void;
  onClose?(): void;
  onMove(movedKey: string, to: "before" | "after", referenceKey: string): void;
}

function Tab({
  idPrefix,
  tabKey,
  label,
  badge,
  active,
  onActivate,
  onClose,
  onMove,
}: TabProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { onDragStart, onDragOver, onDrop } = useDragAndDrop(
    containerRef,
    idPrefix,
    tabKey,
    onMove
  );

  return (
    <div
      ref={containerRef}
      className={cls.element("tab-container", null, active && "active")}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <button
        className={cls.element("tab", null, active && "active")}
        role="tab"
        id={makeTabId(idPrefix, tabKey)}
        aria-controls={makeTabPanelId(idPrefix, tabKey)}
        title={label}
        onClick={onActivate}
      >
        <div
          className={cls.element("drag-handle")}
          draggable
          onDragStart={onDragStart}
        >
          <DragIndicatorIcon className={cls.element("drag-icon")} />
        </div>
        <span className={cls.element("tab-label")}>{label}</span>
        <Badge count={badge ?? 0} />
      </button>
      <button className={cls.element("close-button")} onClick={onClose}>
        <CloseIcon className={cls.element("close-icon")} />
      </button>
    </div>
  );
}

function useDragAndDrop(
  tabContainerRef: RefObject<HTMLDivElement | null>,
  idPrefix: string,
  tabKey: string,
  onMove: (
    movedKey: string,
    to: "before" | "after",
    referenceKey: string
  ) => void
) {
  const format = `${idPrefix}-tab-dnd`;

  return {
    onDragStart(e: DragEvent<HTMLDivElement>) {
      e.dataTransfer.setData(format, tabKey);
      e.dataTransfer.setDragImage(tabContainerRef.current!, 0, 0);
    },
    onDragOver(e: DragEvent<HTMLDivElement>) {
      if (!e.dataTransfer.types.includes(format)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    onDrop(e: DragEvent<HTMLDivElement>) {
      const draggedTab = e.dataTransfer.getData(format);
      if (!draggedTab || draggedTab === tabKey) return;
      e.preventDefault();

      const { width, x } = e.currentTarget.getBoundingClientRect();
      const to = e.clientX - x < width / 2 ? "before" : "after";
      onMove(draggedTab, to, tabKey);
    },
  };
}

interface BadgeProps {
  count: number;
}

function Badge({ count }: BadgeProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevCountRef = useRef(0);
  useEffect(() => {
    if (count > prevCountRef.current) {
      ref.current!.animate(
        [
          { translate: "0 0 0" },
          { translate: "0 -4px 0" },
          { translate: "0 0 0" },
        ],
        200
      );
    }
    prevCountRef.current = count;
  }, [count]);

  return (
    <span
      ref={ref}
      className={cls.element("tab-badge", null, count > 0 && "visible")}
    >
      {count === 0 ? "" : count <= 9 ? count : "9+"}
    </span>
  );
}

function makeTabId(idPrefix: string, tabKey: string) {
  return `${idPrefix}-tab-${tabKey}`;
}

function makeTabPanelId(idPrefix: string, tabKey: string) {
  return `${idPrefix}-panel-${tabKey}`;
}
