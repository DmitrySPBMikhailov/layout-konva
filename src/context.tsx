import React, { createContext, useContext, useState } from "react";
// enums
import { Tool, ShapeType } from "./utils/enums";
// interface
import { GlobalContextType, AppContextProps } from "./utils/interfaces";

// Create context with tyoe or undefined
export const GlobalContext = createContext<GlobalContextType | undefined>(
  undefined
);

// Custom hook for using context
export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error(
      "useGlobalContext must be used within a GlobalContextProvider"
    );
  }
  return context;
};

// Component for App Context
const AppContext: React.FC<AppContextProps> = ({ children }) => {
  const [tool, setTool] = useState<Tool>(Tool.Cursor);
  const [selectedShape, setSelectedShape] = useState<ShapeType | null>(null);

  return (
    <GlobalContext.Provider
      value={{ tool, setTool, selectedShape, setSelectedShape }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default AppContext;
