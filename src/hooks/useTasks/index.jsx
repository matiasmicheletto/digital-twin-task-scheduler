import { useState, useEffect } from "react";
import Tasks from "../../model/tasks";

const tasks = new Tasks();

const useTasks = () => {
    
    const [taskData, setTaskData] = useState({ tasks: [], precedences: [] });

    useEffect(() => {
        setTaskData(tasks.getTasks());
    }, []);

    const addTask = (task) => {
        tasks.addTask(task);
        setTaskData(tasks.getTasks());
    };

    const removeTask = (taskId) => {
        tasks.removeTask(taskId);
        setTaskData(tasks.getTasks());
    };

    const connectTasks = (fromTaskId, toTaskId) => {
        tasks.connectTasks(fromTaskId, toTaskId);
        setTaskData(tasks.getTasks());
    };

    return {
        taskData,
        addTask,
        removeTask,
        connectTasks
    };
};

export default useTasks;
