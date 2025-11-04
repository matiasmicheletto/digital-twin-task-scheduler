import { Task } from "./schedule.js";
import { generateUUID8 } from "./utils.js";

export class Link {
    constructor(id, sourceId, targetId, delay = 1) {
        this.id = id;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.delay = delay; // Optional delay for the edge
        this.bidirectional = false; // By default, links are unidirectional
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
    constructor(label, type = NODE_TYPES.UNDEFINED, position) {
        this.id = generateUUID8(); // Unique task identifier
        this.type = type
        this.label = label || id;
        this.tasks = new Map();
        this.memory = 1; // Default memory capacity
        this.u = 0; // Utilization
        this.links = []; // Outgoing links
        this.position = position || { // For visualization
            x: 400 + Math.random() * 200,
            y: 300 + Math.random() * 200
        };
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

    static fromObject(obj) {
        const node = new Node(obj.label, obj.type);
        if(obj.id) // If object has id, use it to preserve identity
            node.id = obj.id;
        if(obj.links) // Same for links
            node.links = obj.links.map(l => new Link(l.id, l.sourceId, l.targetId, l.delay));
        return node;
    }

    setPosition(x, y) {
        this.position = { x, y };
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
        
        if(!Object.values(NODE_TYPES).includes(node.type)) {
            throw new Error(`Invalid node type: ${node.type}`);
        }

        if(node.type === NODE_TYPES.CLOUD) {
            // Ensure only one cloud node exists
            for(let n of this.nodes.values()) {
                if(n.type === NODE_TYPES.CLOUD) {
                    throw new Error("Only one Cloud node is allowed in the network");
                }
            }
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

        if(!sourceNode || !targetNode) {
            throw new Error("Source or target node does not exist");
        }

        // Edge cannot connect to Mist
        if(sourceNode?.type === NODE_TYPES.EDGE && targetNode?.type === NODE_TYPES.MIST) {
            throw new Error("Edge nodes cannot connect to Mist nodes");
        }

        // If both nodes are edge or cloud, make link bidirectional
        const bidirectional = 
            (sourceNode.type === NODE_TYPES.EDGE || sourceNode.type === NODE_TYPES.CLOUD) &&
            (targetNode.type === NODE_TYPES.EDGE || targetNode.type === NODE_TYPES.CLOUD);
        
        const linkId = `${sourceId}${bidirectional ? "<->" : "->"}${targetId}`;
        const link = new Link(linkId, sourceId, targetId, delay, bidirectional);
        sourceNode.addLink(link);
        if(bidirectional) {
            const reverseLink = new Link(linkId, targetId, sourceId, delay, bidirectional);
            targetNode.addLink(reverseLink);
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

    getNodes() {
        return Array.from(this.nodes.values());
    }

    getConnections() {
        const connections = [];
        for (let node of this.nodes.values()) {
            for (let link of node.links) {
                connections.push(link);
            }
        }
        return connections;
    }

    toGraph() {
        const nodesArray = Array.from(this.nodes.values());
        const linksArray = [];
        for(let node of nodesArray) {
            node.links.forEach(link => {
                linksArray.push({
                    id: link.id,
                    from: link.sourceId,
                    to: link.targetId,
                    delay: link.delay,
                    bidirectional: link.bidirectional
                });
            });
        }
        
        return { vertices: nodesArray, edges: linksArray };
    }

    fromGraph(graph) {
        this.nodes.clear();
        graph.vertices.forEach(v => {
            const node = new Node(v.id, v.type);
            node.memory = v.memory || 1;
            node.u = v.u || 0;
            this.nodes.set(v.id, node);
        });
        graph.edges.forEach(e => {
            const link = new Link(e.id, e.source, e.target, e.delay || 1);
            const sourceNode = this.nodes.get(e.source);
            if (sourceNode) {
                sourceNode.addLink(link);
            }
        });
    }
};