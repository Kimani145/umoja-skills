import { createContext, useContext } from 'react';

interface LayoutContextValue {
  onMenuClick: () => void;
}

export const LayoutContext = createContext<LayoutContextValue>({
  onMenuClick: () => {},
});

export const useLayout = () => useContext(LayoutContext);
