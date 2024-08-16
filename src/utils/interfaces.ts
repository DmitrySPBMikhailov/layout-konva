import { Tool, ShapeType } from "./enums";
import { ReactNode } from "react";

export interface GlobalContextType {
  tool: Tool;
  setTool: React.Dispatch<React.SetStateAction<Tool>>;
  selectedShape: ShapeType | null;
  setSelectedShape: React.Dispatch<React.SetStateAction<ShapeType | null>>;
}

export interface AppContextProps {
  children: ReactNode;
}
