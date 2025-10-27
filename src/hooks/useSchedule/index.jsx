import { useRef, useReducer, useCallback } from "react";
import Schedule from "../../model/schedule";

const schedule = new Schedule();

const useSchedule = () => {
    const scheduleRef = useRef(schedule);
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    const addTask = useCallback((task) => {
        scheduleRef.current.addTask(task);
        forceUpdate();
    }, []);

    const removeTask = useCallback((taskId) => {
        try{
            scheduleRef.current.removeTask(taskId);
            forceUpdate();
        } catch (error) {
            console.error(error);
        }
    }, []);

    const connectTasks = useCallback((fromTaskId, toTaskId) => {
        try{
            scheduleRef.current.connectTasks(fromTaskId, toTaskId);
            forceUpdate();
        } catch (error) {
            console.error(error);
        }
    }, []);

    const getTasks = useCallback(() => {
        return scheduleRef.current.getTasks();
    }, []);

    const toGraph = useCallback(() => {
        return scheduleRef.current.toGraph();
    }, []);

    const fromGraph = useCallback((graph) => {
        scheduleRef.current = Schedule.fromGraph(graph);
        forceUpdate();
    }, []);

    return {
        schedule: scheduleRef.current,
        addTask,
        removeTask,
        connectTasks,
        getTasks,
        toGraph,
        fromGraph
    };
};

export default useSchedule;
