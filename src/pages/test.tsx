import { ReactNode, createContext, useContext, useState } from "react";

export default function TestPage() {
  return (
    <>
      <Test1>
        <Test2></Test2>
        <Test3></Test3>
      </Test1>
    </>
  );
}

const Context = createContext(0);

function Test1({ children }: { children: ReactNode }) {
  const [state, setter] = useState(0);
  return (
    <>
      <div
        onClick={() => {
          setter(state + 1);
        }}
      >
        Test{state}
      </div>
      <Context.Provider value={state}>{children}</Context.Provider>
    </>
  );
}

function Test2() {
  const value = useContext(Context);
  console.log("repaint test2");
  return <button>Test2</button>;
}

function Test3() {
  console.log("repaint test3");
  return <button>Test3</button>;
}
