import { useScheduleContext } from "../../context/Model";
import { useNetworkContext } from "../../context/Model";
import { Task } from "../../../../shared/schedule";
import { Node } from "../../../../shared/network";
import modelToDat from "../../../../shared/modelToDat.js";

export const GRAPH_MODES = {
    SCHEDULE: "SCHEDULE", // Graph of tasks
    NETWORK: "NETWORK" // Graph of network nodes
};

const useGraph = mode => {
    const schedule = useScheduleContext();
    const network = useNetworkContext();

    const toDat = () => {
        return modelToDat({
            ...schedule.scheduleToGraph(),
            ...network.networkToGraph()
        });
    }

    const wrappers = {
        [GRAPH_MODES.SCHEDULE]: {
            model: schedule,
            addVertex: schedule.addTask,
            removeVertex: schedule.removeTask,
            deleteGraph: schedule.deleteSchedule,
            connectVertices: schedule.connectTasks,
            disconnectVertices: schedule.disconnectTasks,
            getVertex: schedule.getTask,
            getVertices: schedule.getTasks,
            getEdges: schedule.getPrecedences,
            setEdgeProp: (edgeId, attr, value) => {},
            fromObject: Task.fromObject,
            graphToModel: schedule.scheduleFromGraph,
            modelToGraph: schedule.scheduleToGraph,
            modelsToDat: toDat
        },
        [GRAPH_MODES.NETWORK]: {
            model: network,
            addVertex: network.addNode,
            removeVertex: network.removeNode,
            deleteGraph: network.deleteNetwork,
            connectVertices: network.connectNodes,
            disconnectVertices: network.disconnectNodes,
            getVertex: network.getNode,
            getVertices: network.getNodes,
            getEdges: network.getConnections,
            setEdgeProp: network.setConnectionProp,
            fromObject: Node.fromObject,
            graphToModel: network.networkFromGraph,
            modelToGraph: network.networkToGraph,
            modelsToDat: toDat
        }
    };

    return wrappers[mode];
};

export default useGraph;