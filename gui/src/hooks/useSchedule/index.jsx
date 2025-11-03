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

    const removeTask = useCallback(taskId => {
        scheduleRef.current.removeTask(taskId);
        forceUpdate();
    }, []);

    const deleteSchedule = useCallback(() => {
        scheduleRef.current = new Schedule();
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

    const getTasks = useCallback(() => {
        return scheduleRef.current.getTasks();
    }, []);

    const getPrecedences = useCallback(() => {
        return scheduleRef.current.getPrecedences();
    }, []);

    const scheduleToGraph = useCallback(() => {
        return scheduleRef.current.toGraph();
    }, []);

    const scheduleFromGraph = useCallback(graph => {
        scheduleRef.current.fromGraph(graph);
        forceUpdate();
    }, []);

    return {
        schedule: scheduleRef.current,
        addTask,
        removeTask,
        deleteSchedule,
        connectTasks,
        disconnectTasks,
        getTask,
        getTasks,
        getPrecedences,
        scheduleToGraph,
        scheduleFromGraph
    };
};

export default useSchedule;
