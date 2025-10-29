import { useRef, useReducer, useCallback } from "react";
import Schedule from "../../model/schedule.js";

const schedule = new Schedule();

const useSchedule = () => {
    const scheduleRef = useRef(schedule);
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    const addTask = useCallback(task => {
        scheduleRef.current.addTask(task);
        forceUpdate();
    }, []);

    const toTaskObject = useCallback(obj => {
        return Schedule.toTaskObject(obj);
    }, []);

    const removeTask = useCallback(taskId => {
        scheduleRef.current.removeTask(taskId);
        forceUpdate();
    }, []);

    const connectTasks = useCallback((fromTaskId, toTaskId) => {
        try{
            scheduleRef.current.connectTasks(fromTaskId, toTaskId);
            forceUpdate();
        } catch (error) {
            throw error;
        }
    }, []);

    const disconnectTasks = useCallback((fromTaskId, toTaskId) => {
        scheduleRef.current.disconnectTasks(fromTaskId, toTaskId);
        forceUpdate();
    }, []);

    const getTask = useCallback(taskId => {
        return scheduleRef.current.getTask(taskId);
    }, []);

    const toGraph = useCallback(() => {
        return scheduleRef.current.toGraph();
    }, []);

    const fromGraph = useCallback(graph => {
        scheduleRef.current.fromGraph(graph);
        forceUpdate();
    }, []);

    return {
        schedule: scheduleRef.current,
        addTask,
        toTaskObject,
        removeTask,
        connectTasks,
        disconnectTasks,
        getTask,
        toGraph,
        fromGraph
    };
};

export default useSchedule;
