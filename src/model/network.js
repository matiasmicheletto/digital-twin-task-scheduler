import { Task } from "./schedule.js";

export class Link {
    constructor(id, sourceId, targetId, delay = 1) {
        this.id = id;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.delay = delay; // Optional delay for the edge
    }
}

export const NODE_TYPES = {
    UNDEFINED: "UNDEFINED",
    MIST: "MIST",
    EDGE: "EDGE",
    CLOUD: "CLOUD"
};
export const NODE_TYPE_LABELS = {
    UNDEFINED: "-",
    MIST: "Mist",
    EDGE: "Edge",
    CLOUD: "Cloud"
};

export class Node {
    constructor(id, label, type = NODE_TYPES.UNDEFINED) {
        this.id = id;
        this.type = type
        this.label = label || id;
        this.tasks = new Map();
        this.memory = 1; // Default memory capacity
        this.u = 0; // Utilization
        this.links = []; // Outgoing links
    }

    addTask(task) {
        if(!(task instanceof Task)) {
            throw new Error("Invalid task object");
        }
        this.tasks.set(task.id, task);
    }

    removeTask(taskId) {
        this.tasks.delete(taskId);
    }

    addLink(link) {
        if(!(link instanceof Link)) {
            throw new Error("Invalid link object");
        }
        this.links.push(link);
    }

    removeLink(targetId) {
        this.links = this.links.filter(link => link.targetId !== targetId);
    }
}

export default class Network {
    constructor() {
        this.nodes = new Map(); // Map of nodeId to Node objects
    }

    addNode(node) {
        if(!(node instanceof Node)) {
            throw new Error("Invalid node object");
        }
        this.nodes.set(node.id, node);
    }

    static toNodeObject(obj) {
        return new Node(obj.id, obj.type);
    }

    removeNode(nodeId) {
        if(this.nodes.has(nodeId)) {
            this.nodes.delete(nodeId);
            // Remove links to this node from other nodes
            for(let node of this.nodes.values()) {
                node.removeLink(nodeId);
            }
        }
    }

    connectNodes(sourceId, targetId, delay = 1) {
        const sourceNode = this.nodes.get(sourceId);
        const targetNode = this.nodes.get(targetId);
        if(sourceNode && targetNode) {
            const linkId = `${sourceId}->${targetId}`;
            const link = new Link(linkId, sourceId, targetId, delay);
            sourceNode.addLink(link);
        }
    }

    disconnectNodes(sourceId, targetId) {
        const sourceNode = this.nodes.get(sourceId);
        if(sourceNode) {
            sourceNode.removeLink(targetId);
        }
    }

    getNode(nodeId) {
        return this.nodes.get(nodeId);
    }

    toGraph() {
        const nodesArray = Array.from(this.nodes.values());
        const linksArray = [];
        nodesArray.forEach(node => {
            node.links.forEach(link => {
                linksArray.push({
                    id: link.id,
                    source: link.sourceId,
                    target: link.targetId,
                    delay: link.delay
                });
            });
        });
        return { nodes: nodesArray, links: linksArray };
    }

    fromGraph(graph) {
        this.nodes.clear();
        graph.nodes.forEach(n => {
            const node = new Node(n.id, n.type);
            node.memory = n.memory || 1;
            node.u = n.u || 0;
            this.nodes.set(n.id, node);
        });
        graph.links.forEach(l => {
            const link = new Link(l.id, l.source, l.target, l.delay || 1);
            const sourceNode = this.nodes.get(l.source);
            if (sourceNode) {
                sourceNode.addLink(link);
            }
        });
    }
};