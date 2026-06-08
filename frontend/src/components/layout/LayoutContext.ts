import { createContext, useContext } from 'react';

interface LayoutContextValue {
  onMenuClick: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const LayoutContext = createContext<LayoutContextValue>({
  onMenuClick: () => {},
  collapsed: false,
  onToggleCollapse: () => {},
});

export const useLayout = () => useContext(LayoutContext);
