import { useScheduleContext } from "../../context/Model";
import { useNetworkContext } from "../../context/Model";
import { Task } from "../../../../shared/schedule";
import { Node } from "../../../../shared/network";

export const GRAPH_MODES = {
    SCHEDULE: "SCHEDULE", // Graph of tasks
    NETWORK: "NETWORK" // Graph of network nodes
};

const useGraph = mode => {
    const schedule = useScheduleContext();
    const network = useNetworkContext();

    const wrappers = {
        [GRAPH_MODES.SCHEDULE]: {
            object: schedule,
            addVertex: schedule.addTask,
            removeVertex: schedule.removeTask,
            deleteGraph: schedule.deleteSchedule,
            connectVertices: schedule.connectTasks,
            disconnectVertices: schedule.disconnectTasks,
            getVertex: schedule.getTask,
            getVertices: schedule.getTasks,
            getEdges: schedule.getPrecedences,
            fromObject: Task.fromObject,
            graphToModel: schedule.scheduleFromGraph,
            modelToGraph: schedule.scheduleToGraph
        },
        [GRAPH_MODES.NETWORK]: {
            object: network,
            addVertex: network.addNode,
            removeVertex: network.removeNode,
            deleteGraph: network.deleteNetwork,
            connectVertices: network.connectNodes,
            disconnectVertices: network.disconnectNodes,
            getVertex: network.getNode,
            getVertices: network.getNodes,
            getEdges: network.getConnections,
            fromObject: Node.fromObject,
            graphToModel: network.networkFromGraph,
            modelToGraph: network.networkToGraph
        }
    };

    return wrappers[mode];
};

export default useGraph;