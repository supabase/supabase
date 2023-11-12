import React, { createContext, useContext, ReactNode, useState } from 'react';

export interface GraphiQLQueryEditorFocusContextType {
    isGraphiQLEditorOnFocus: boolean;
    setIsGraphiQLEditorOnFocus: React.Dispatch<React.SetStateAction<boolean>>;
  }
const GraphiQLQueryEditorFocusContext = createContext<GraphiQLQueryEditorFocusContextType>({
    isGraphiQLEditorOnFocus: false,
    setIsGraphiQLEditorOnFocus: () => {},
});
export function GraphiQLQueryEditorFocusProvider({ children }: { children: ReactNode }){
const [isGraphiQLEditorOnFocus, setIsGraphiQLEditorOnFocus] = useState(false);

return (
    <GraphiQLQueryEditorFocusContext.Provider value={{ isGraphiQLEditorOnFocus, setIsGraphiQLEditorOnFocus }}>
    {children}
    </GraphiQLQueryEditorFocusContext.Provider>
);
}
export default GraphiQLQueryEditorFocusContext
export const useGraphiQLQueryEditorFocus = () => useContext(GraphiQLQueryEditorFocusContext);