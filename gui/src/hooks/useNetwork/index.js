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

    const connectNodes = useCallback((fromNodeId, toNodeId, delay) => {
        networkRef.current.connectNodes(fromNodeId, toNodeId, delay);
        forceUpdate();
    }, []);

    const disconnectNodes = useCallback((fromNodeId, toNodeId) => {
        networkRef.current.disconnectNodes(fromNodeId, toNodeId);
        forceUpdate();
    }, []);

    const getNode = useCallback(nodeId => {
        return networkRef.current.getNode(nodeId);
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
        connectNodes,
        disconnectNodes,
        getNode,
        networkToGraph,
        networkFromGraph
    };
};

export default useNetwork;
