import { createContext, useContext } from "react";
import useModel from "../../hooks/useModel";

const ModelContext = createContext(null);

export const ModelProvider = ({ children }) => {
    const fileOps = useModel();
    return (
        <ModelContext.Provider value={fileOps}>
            {children}
        </ModelContext.Provider>
    );
};

export const useModelContext = () => useContext(ModelContext);