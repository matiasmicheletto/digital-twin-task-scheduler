import { createContext, useContext } from "react";
import useTasks from "../../hooks/useTasks";

const TasksContext = createContext(null);

export const TasksProvider = ({ children }) => {
    const tasks = useTasks();
    return (
        <TasksContext.Provider value={tasks}>
            {children}
        </TasksContext.Provider>
    );
};

export const useTasksContext = () => useContext(TasksContext);