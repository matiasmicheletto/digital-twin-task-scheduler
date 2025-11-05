import { Task } from "./schedule.js";
import { generateUUID8 } from "./utils.js";
const LINK_ATTRIBUTES = ['id', 'sourceId', 'targetId', 'delay', 'bidirectional'];
const NODE_ATTRIBUTES = ['id', 'label', 'type', 'memory', 'u', 'links', 'position'];

export class Link {
    constructor(id, label, sourceId, targetId, delay = 1, bidirectional = false) {
        this.id = id;
        this.label = label;
        this.sourceId = sourceId;
        this.targetId = targetId;
        this.delay = delay; // Optional delay for the edge
        this.bidirectional = bidirectional;
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

    setLinkProp(linkId, attr, value) {
        const link = this.links.find(l => l.id === linkId);
        if(link && LINK_ATTRIBUTES.includes(attr)) {
            link[attr] = value;
        }else{
            throw new Error(`Invalid link attribute: ${attr}`);
        }
    }

    static fromObject(obj) {
        const node = new Node(obj.label, obj.type);
        if(obj.id) // If object has id, use it to preserve identity
            node.id = obj.id;
        if(obj.links) // Same for links
            node.links = obj.links.map(l => new Link(l.id, l.label, l.sourceId, l.targetId, l.delay));
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

    removeNode(nodeId) {
        if(this.nodes.has(nodeId)) {
            this.nodes.delete(nodeId);
            // Remove links to or from this node
            for(let node of this.nodes.values()) {
                node.links = node.links.filter(link => link.targetId !== nodeId);
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

        // Unique links
        if(sourceNode.links.find(link => link.targetId === targetId)) {
            throw new Error("A link between these nodes already exists");
        }

        // If both nodes are edge or cloud, make link bidirectional
        const bidirectional = 
            (sourceNode.type === NODE_TYPES.EDGE || sourceNode.type === NODE_TYPES.CLOUD) &&
            (targetNode.type === NODE_TYPES.EDGE || targetNode.type === NODE_TYPES.CLOUD);
        
        const linkId = `${sourceId}_${targetId}`;
        const label = `${sourceNode.label} → ${targetNode.label}`;
        const link = new Link(linkId, label, sourceId, targetId, delay, bidirectional);
        sourceNode.addLink(link);
        if(bidirectional) {
            const revLabel = `${targetNode.label} → ${sourceNode.label}`;
            const reverseLink = new Link(linkId, revLabel, targetId, sourceId, delay, bidirectional);
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
                connections.push({
                    id: link.id,
                    label: link.label,
                    from: node,
                    to: this.nodes.get(link.targetId),
                    delay: link.delay,
                    bidirectional: link.bidirectional
                });
            }
        }
        return connections;
    }

    setConnectionProp(linkId, attr, value) {
        console.log("3.- calling setEdgeProp");
        for(let node of this.nodes.values()) {
            const link = node.links.find(l => l.id === linkId);
            if(link) {
                node.setLinkProp(linkId, attr, value);
                // If bidirectional, update the reverse link as well
                if(link.bidirectional) {
                    const targetNode = this.nodes.get(link.targetId);
                    if(targetNode) {
                        targetNode.setLinkProp(linkId, attr, value);
                    }
                }
                return;
            }
        }
        throw new Error(`Link with id ${linkId} not found`);
    }

    toGraph() {
        const nodesArray = Array.from(this.nodes.values());
        const linksArray = [];
        for(let node of nodesArray) {
            node.links.forEach(link => {
                if(!linksArray.find(l => l.id === link.id))
                    linksArray.push({
                        id: link.id,
                        label: link.label,
                        from: link.sourceId,
                        to: link.targetId,
                        delay: link.delay,
                        bidirectional: link.bidirectional
                    });
            });
        }

        return { vertices: nodesArray, edges: linksArray };
    }

    fromGraph({vertices, edges}) {
        this.nodes.clear();
        for(let v of vertices) {
            // Parameters validation
            Object.values(NODE_ATTRIBUTES).forEach(attr => {
                if(!(attr in v)) {
                    throw new Error(`Missing node attribute: ${attr}`);
                }
            });

            const node = Node.fromObject(v);
            this.addNode(node);
        }
        
        for(let e of edges){
            if(this.nodes.has(e.from) && this.nodes.has(e.to)) {
                this.connectNodes(e.from, e.to, e.delay);
            } else {
                throw new Error(`Invalid connection from ${e.from} to ${e.to}`);
            }
        }
    }
};