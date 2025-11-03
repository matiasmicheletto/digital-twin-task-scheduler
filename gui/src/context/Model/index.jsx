import { createContext, useContext } from "react";
import useSchedule from "../../hooks/useSchedule";
import useNetwork from "../../hooks/useNetwork";

const ModelContext = createContext(null);

export const ModelProvider = ({ children }) => {
    const schedule = useSchedule();
    const network = useNetwork();

    const value = {
        schedule,
        network
    };

    return (
        <ModelContext.Provider value={value}>
            {children}
        </ModelContext.Provider>
    );
};

export const useModel = () => {
    const context = useContext(ModelContext);
    if (!context) {
        throw new Error("useModel must be used within a ModelProvider");
    }
    return context;
};

export const useScheduleContext = () => useModel().schedule;
export const useNetworkContext = () => useModel().network;

export const useModelContext = () => useContext(ModelContext);