import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

const effectsRun = { Z: 0, A: 0, B: 0, C: 0 };
const cleanupsRun = { Z: 0, A: 0, B: 0, C: 0 };

function App() {
  const [hidden, setHidden] = useState(true);
  const [n, setN] = useState(0);
  useEffect(() => {
    console.table({ effectsRun, cleanupsRun });
  });

  return (
    <>
      <button onClick={() => setHidden(!hidden)}>
        {hidden ? "show" : "hide"}
      </button>{" "}
      <button onClick={() => setN((n + 1) % 4)}>{"Z >> 1"}</button>
      {!hidden &&
        [
          <Child key="A" value="A" />,
          <Child key="B" value="B" />,
          <Child key="C" value="C" />,
        ].toSpliced(n, 0, <Child key="Z" value="Z" />)}
    </>
  );
}

interface ChildProps {
  value: keyof typeof effectsRun;
}

function Child({ value }: ChildProps) {
  useEffect(() => {
    effectsRun[value]++;
    return () => {
      cleanupsRun[value]++;
    };
  });
  return <div>{value}</div>;
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
