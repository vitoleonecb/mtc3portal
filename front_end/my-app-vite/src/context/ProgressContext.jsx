import { createContext, useState } from "react";

export const ProgressContext = createContext({
  state: { current: 0, max: 0 },
  setState: () => {},
  moduleStatus: null,
  setModuleStatus: () => {},
});

export function ProgressProvider({ children }) {
  const [state, setState] = useState({ current: 0, max: 0 });
  const [moduleStatus, setModuleStatus] = useState(null);

  return (
    <ProgressContext.Provider value={{ state, setState, moduleStatus, setModuleStatus }}>
      {children}
    </ProgressContext.Provider>
  );
}