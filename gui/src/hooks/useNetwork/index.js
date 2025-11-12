import { useRef, useReducer, useCallback } from "react";
import Network from "../../../../shared/network.js";

const network = new Network();

const useNetwork = () => {
    const networkRef = useRef(network);
    const [, forceUpdate] = useReducer(x => x + 1, 0);

    const addNode = useCallback(node => {
        networkRef.current.addNode(node);
        forceUpdate();
    }, []);

    const removeNode = useCallback(nodeId => {
        networkRef.current.removeNode(nodeId);
        forceUpdate();
    }, []);

    const deleteNetwork = useCallback(() => {
        networkRef.current = new Network();
        forceUpdate();
    }, []);

    const connectNodes = useCallback((fromNodeId, toNodeId, delay) => {
        try{
            networkRef.current.connectNodes(fromNodeId, toNodeId, delay);
            forceUpdate();
        } catch (error) {
            throw error;
        }
    }, []);

    const disconnectNodes = useCallback((fromNodeId, toNodeId) => {
        networkRef.current.disconnectNodes(fromNodeId, toNodeId);
        forceUpdate();
    }, []);

    const getNode = useCallback(nodeId => {
        return networkRef.current.getNode(nodeId);
    }, []);

    const getNodes = useCallback(() => {
        return networkRef.current.getNodes();
    }, []);

    const getConnections = useCallback(() => {
        return networkRef.current.getConnections();
    }, []);

    const setConnectionProp = useCallback((linkId, attr, value) => {
        networkRef.current.setConnectionProp(linkId, attr, value);
        forceUpdate();
    }, []);

    const allocateTaskToNode = useCallback((taskId, nodeId) => {
        networkRef.current.allocateTaskToNode(taskId, nodeId);
        forceUpdate();
    }, []);

    const deallocateTaskFromNode = useCallback((taskId, nodeId) => {
        networkRef.current.deallocateTaskFromNode(taskId, nodeId);
        forceUpdate();
    }, []);

    const clearAllAllocatedTasks = useCallback(() => {
        networkRef.current.clearAllAllocatedTasks();
        forceUpdate();
    }, []);

    const networkToGraph = useCallback(() => {
        return networkRef.current.toGraph();
    }, []);

    const networkFromGraph = useCallback(graph => {
        networkRef.current.fromGraph(graph);
        forceUpdate();
    }, []);

    return {
        network: networkRef.current,
        addNode,
        removeNode,
        deleteNetwork,
        connectNodes,
        disconnectNodes,
        getNode,
        getNodes,
        getConnections,
        setConnectionProp,
        allocateTaskToNode,
        deallocateTaskFromNode,
        clearAllAllocatedTasks,
        networkToGraph,
        networkFromGraph
    };
};

export default useNetwork;
