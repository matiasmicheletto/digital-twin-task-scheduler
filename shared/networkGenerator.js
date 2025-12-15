import Network, { Node, NODE_TYPES } from './network.js';
import { twoDecimals } from './utils.js';
import tiny from './presets/network-presets/tiny.json' with {type: 'json'};
import small from './presets/network-presets/small.json' with {type: 'json'};
import medium from './presets/network-presets/medium.json' with {type: 'json'};
import large from './presets/network-presets/large.json' with {type: 'json'};
import sparse from './presets/network-presets/sparse.json' with {type: 'json'};
import dense from './presets/network-presets/dense.json' with {type: 'json'};
import starSmall from './presets/network-presets/star-small.json' with {type: 'json'};
import hierarchicalLarge from './presets/network-presets/hierarchical-large.json' with {type: 'json'};
import clusterMedium from './presets/network-presets/cluster-medium.json' with {type: 'json'};
import noCloud from './presets/network-presets/no-cloud.json' with {type: 'json'};

/**
 * Network Generator for IoT/Mist/Edge/Cloud Topologies
 * Creates network graphs with configurable parameters and topologies
 */
export default class NetworkGenerator { // Base Network Generator Class
    constructor(config = {}) {
        this.config = {
            mistCount: 2,
            edgeCount: 1,
            includeCloud: true,
            connectionDensity: 0.5, // 0-1, affects edge-to-edge connections
            viewportWidth: 800,
            viewportHeight: 600,
            ...config
        };
        this.validateConfig();
    }

    validateConfig() {
        const { mistCount, edgeCount, connectionDensity } = this.config;
        
        if (mistCount < 0 || edgeCount < 0) {
            throw new Error("Node counts must be non-negative");
        }
        if (connectionDensity < 0 || connectionDensity > 1) {
            throw new Error("Connection density must be between 0 and 1");
        }
        if (mistCount > 0 && edgeCount === 0) {
            throw new Error("Mist nodes require at least one Edge node to connect to");
        }
    }

    generate() {
        const network = new Network();
        
        // Generate nodes
        const mistNodes = this.generateMistNodes();
        const edgeNodes = this.generateEdgeNodes();
        const cloudNode = this.config.includeCloud ? this.generateCloudNode() : null;
        
        // Add nodes to network
        mistNodes.forEach(node => network.addNode(node));
        edgeNodes.forEach(node => network.addNode(node));
        if (cloudNode) network.addNode(cloudNode);
        
        // Generate connections
        this.connectMistToEdge(network, mistNodes, edgeNodes);
        this.connectEdgeToEdge(network, edgeNodes);
        if (cloudNode) this.connectEdgeToCloud(network, edgeNodes, cloudNode);
        
        return this.formatOutput(network);
    }

    generateMistNodes() {
        const nodes = [];
        const { mistCount, viewportWidth, viewportHeight } = this.config;
        
        for (let i = 0; i < mistCount; i++) {
            const node = new Node(`Mist ${i + 1}`, NODE_TYPES.MIST);
            node.position = this.calculatePosition(i, mistCount, 0.2, viewportWidth, viewportHeight);
            node.u = this.randomUtilization2();
            node.memory = this.randomMemory();
            nodes.push(node);
        }
        return nodes;
    }

    generateEdgeNodes() {
        const nodes = [];
        const { edgeCount, viewportWidth, viewportHeight } = this.config;
        
        for (let i = 0; i < edgeCount; i++) {
            const node = new Node(`Edge ${i + 1}`, NODE_TYPES.EDGE);
            node.position = this.calculatePosition(i, edgeCount, 0.5, viewportWidth, viewportHeight);
            node.u = this.randomUtilization2();
            node.memory = this.randomMemory();
            nodes.push(node);
        }
        return nodes;
    }

    generateCloudNode() {
        const { viewportWidth, viewportHeight } = this.config;
        const node = new Node('Cloud', NODE_TYPES.CLOUD);
        node.position = { x: Math.floor(viewportWidth * 0.8), y: Math.floor(viewportHeight * 0.5) };
        node.u = this.randomUtilization2();
        node.memory = this.randomMemory();
        return node;
    }

    calculatePosition(index, total, xRatio, width, height) {
        // Distribute nodes vertically with some horizontal offset
        const y = Math.floor((index + 1) * height / (total + 1));
        const x = Math.floor(xRatio * width + (Math.random() - 0.5) * 50);
        return { x, y };
    }

    randomDelay() {
        // Generate random delay between 1 and 10
        return Math.floor(Math.random() * 10) + 1;
    }

    /*
    randomUtilization() {
        // Generate random utilization between 0 and 1
        const u = Math.random();
        return twoDecimals(u); 
    }
    */

    randomUtilization2() {
        const values = [0.2, 0.4, 0.6, 0.8, 1.0];
        return values[Math.floor(Math.random() * values.length)];
    }

    randomMemory() {
        // Generate random memory capacity between 1 and 10
        return Math.floor(Math.random() * 10) + 1;
    }

    connectMistToEdge(network, mistNodes, edgeNodes) {
        // Override in subclasses
        throw new Error("connectMistToEdge must be implemented");
    }

    connectEdgeToEdge(network, edgeNodes) {
        // Override in subclasses
        throw new Error("connectEdgeToEdge must be implemented");
    }

    connectEdgeToCloud(network, edgeNodes, cloudNode) {
        // Override in subclasses
        throw new Error("connectEdgeToCloud must be implemented");
    }

    formatOutput(network) {
        const vertices = network.getNodes().map(node => ({
            id: node.id,
            label: node.label,
            type: node.type,
            memory: node.memory,
            u: node.u,
            position: node.position,
            links: node.links.map(l => ({
                id: l.id,
                label: l.label,
                sourceId: l.sourceId,
                targetId: l.targetId,
                delay: l.delay,
                bidirectional: l.bidirectional
            }))
        }));

        const edges = [];
        network.getNodes().forEach(node => {
            node.links.forEach(link => {
                edges.push({
                    id: link.id,
                    label: link.label,
                    from: link.sourceId,
                    to: link.targetId,
                    delay: link.delay,
                    bidirectional: link.bidirectional
                });
            });
        });

        return { nodes: vertices, connections: edges };
    }
}

// Star Topology: All Mist connect to all Edge, all Edge connect to Cloud
class StarTopologyGenerator extends NetworkGenerator {
    connectMistToEdge(network, mistNodes, edgeNodes) {
        mistNodes.forEach(mist => {
            edgeNodes.forEach(edge => {
                network.connectNodes(mist.id, edge.id, this.randomDelay());
            });
        });
    }

    connectEdgeToEdge(network, edgeNodes) {
        // No edge-to-edge connections in star topology
    }

    connectEdgeToCloud(network, edgeNodes, cloudNode) {
        edgeNodes.forEach(edge => {
            network.connectNodes(edge.id, cloudNode.id, this.randomDelay());
        });
    }
}

// Random Topology: Random connections respecting density
class RandomTopologyGenerator extends NetworkGenerator {
    connectMistToEdge(network, mistNodes, edgeNodes) {
        // Each Mist connects to at least one Edge
        mistNodes.forEach(mist => {
            const targetEdge = edgeNodes[Math.floor(Math.random() * edgeNodes.length)];
            network.connectNodes(mist.id, targetEdge.id, this.randomDelay());
            
            // Additional random connections based on density
            edgeNodes.forEach(edge => {
                if (edge.id !== targetEdge.id && Math.random() < this.config.connectionDensity) {
                    try {
                        network.connectNodes(mist.id, edge.id, this.randomDelay());
                    } catch (e) {
                        // Connection already exists
                    }
                }
            });
        });
    }

    connectEdgeToEdge(network, edgeNodes) {
        // Random edge-to-edge connections based on density
        for (let i = 0; i < edgeNodes.length; i++) {
            for (let j = i + 1; j < edgeNodes.length; j++) {
                if (Math.random() < this.config.connectionDensity) {
                    network.connectNodes(edgeNodes[i].id, edgeNodes[j].id, this.randomDelay());
                }
            }
        }
    }

    connectEdgeToCloud(network, edgeNodes, cloudNode) {
        // Each Edge has a chance to connect to Cloud based on density
        // But ensure at least one connection exists
        let hasConnection = false;
        const connections = [];
        
        edgeNodes.forEach((edge, idx) => {
            if (Math.random() < this.config.connectionDensity || idx === 0) {
                connections.push(edge);
                hasConnection = true;
            }
        });
        
        connections.forEach(edge => {
            network.connectNodes(edge.id, cloudNode.id, this.randomDelay());
        });
    }
}

// Hierarchical Topology: Mist connect to nearby Edge, Edge form layers
class HierarchicalTopologyGenerator extends NetworkGenerator {
    connectMistToEdge(network, mistNodes, edgeNodes) {
        // Distribute Mist nodes evenly among Edge nodes
        const mistPerEdge = Math.ceil(mistNodes.length / edgeNodes.length);
        
        mistNodes.forEach((mist, idx) => {
            const edgeIdx = Math.floor(idx / mistPerEdge) % edgeNodes.length;
            network.connectNodes(mist.id, edgeNodes[edgeIdx].id, this.randomDelay());
        });
    }

    connectEdgeToEdge(network, edgeNodes) {
        // Connect Edge nodes in a chain/ring based on density
        if (edgeNodes.length < 2) return;
        
        // Always create a chain
        for (let i = 0; i < edgeNodes.length - 1; i++) {
            network.connectNodes(edgeNodes[i].id, edgeNodes[i + 1].id, this.randomDelay());
        }
        
        // Add additional connections based on density
        if (this.config.connectionDensity > 0.5 && edgeNodes.length > 2) {
            // Close the ring
            network.connectNodes(edgeNodes[edgeNodes.length - 1].id, edgeNodes[0].id, this.randomDelay());
        }
        
        // Add skip connections for high density
        if (this.config.connectionDensity > 0.7) {
            for (let i = 0; i < edgeNodes.length - 2; i++) {
                if (Math.random() < (this.config.connectionDensity - 0.5) * 2) {
                    try {
                        network.connectNodes(edgeNodes[i].id, edgeNodes[i + 2].id, this.randomDelay());
                    } catch (e) {
                        // Skip if connection fails
                    }
                }
            }
        }
    }

    connectEdgeToCloud(network, edgeNodes, cloudNode) {
        // Only a subset of Edge nodes connect to Cloud (gateway pattern)
        const gatewayCount = Math.max(1, Math.ceil(edgeNodes.length * this.config.connectionDensity));
        
        for (let i = 0; i < gatewayCount; i++) {
            const idx = Math.floor((i * edgeNodes.length) / gatewayCount);
            network.connectNodes(edgeNodes[idx].id, cloudNode.id, this.randomDelay());
        }
    }
}

// Cluster Topology: Edge nodes form clusters, Mist connect to cluster
class ClusterTopologyGenerator extends NetworkGenerator {
    constructor(config = {}) {
        super({
            clusterCount: 2,
            ...config
        });
    }

    connectMistToEdge(network, mistNodes, edgeNodes) {
        const clusterSize = Math.ceil(edgeNodes.length / this.config.clusterCount);
        const mistPerCluster = Math.ceil(mistNodes.length / this.config.clusterCount);
        
        mistNodes.forEach((mist, idx) => {
            const clusterIdx = Math.floor(idx / mistPerCluster);
            const clusterStart = clusterIdx * clusterSize;
            const clusterEnd = Math.min(clusterStart + clusterSize, edgeNodes.length);
            
            // Connect to at least one Edge in the cluster
            const targetEdge = edgeNodes[clusterStart + (idx % clusterSize)];
            if (targetEdge) {
                network.connectNodes(mist.id, targetEdge.id, this.randomDelay());
            }
        });
    }

    connectEdgeToEdge(network, edgeNodes) {
        const clusterSize = Math.ceil(edgeNodes.length / this.config.clusterCount);
        
        // Intra-cluster connections (dense)
        for (let c = 0; c < this.config.clusterCount; c++) {
            const start = c * clusterSize;
            const end = Math.min(start + clusterSize, edgeNodes.length);
            
            for (let i = start; i < end; i++) {
                for (let j = i + 1; j < end; j++) {
                    if (Math.random() < 0.7) { // Dense within cluster
                        network.connectNodes(edgeNodes[i].id, edgeNodes[j].id, this.randomDelay());
                    }
                }
            }
        }
        
        // Inter-cluster connections (sparse)
        for (let c1 = 0; c1 < this.config.clusterCount; c1++) {
            for (let c2 = c1 + 1; c2 < this.config.clusterCount; c2++) {
                if (Math.random() < this.config.connectionDensity) {
                    const idx1 = c1 * clusterSize + Math.floor(Math.random() * Math.min(clusterSize, edgeNodes.length - c1 * clusterSize));
                    const idx2 = c2 * clusterSize + Math.floor(Math.random() * Math.min(clusterSize, edgeNodes.length - c2 * clusterSize));
                    
                    if (idx1 < edgeNodes.length && idx2 < edgeNodes.length) {
                        try {
                            network.connectNodes(edgeNodes[idx1].id, edgeNodes[idx2].id, this.randomDelay());
                        } catch (e) {
                            // Connection might already exist
                        }
                    }
                }
            }
        }
    }

    connectEdgeToCloud(network, edgeNodes, cloudNode) {
        // One gateway per cluster
        const clusterSize = Math.ceil(edgeNodes.length / this.config.clusterCount);
        
        for (let c = 0; c < this.config.clusterCount; c++) {
            const gatewayIdx = c * clusterSize;
            if (gatewayIdx < edgeNodes.length) {
                network.connectNodes(edgeNodes[gatewayIdx].id, cloudNode.id, this.randomDelay());
            }
        }
    }
}

// Export preset configurations
export const PRESETS = {
    tiny: tiny,
    small: small,
    medium: medium,
    large: large,
    sparse: sparse,
    dense: dense,
    starSmall: starSmall,
    hierarchicalLarge: hierarchicalLarge,
    clusterMedium: clusterMedium,
    noCloud: noCloud
};

// Export generators
export const GENERATORS = {
    STAR: StarTopologyGenerator,
    RANDOM: RandomTopologyGenerator,
    HIERARCHICAL: HierarchicalTopologyGenerator,
    CLUSTER: ClusterTopologyGenerator
};

// Usage example:
/*
const generator = new RandomTopologyGenerator({
    mistCount: 5,
    edgeCount: 3,
    includeCloud: true,
    connectionDensity: 0.6,
    viewportWidth: 800,
    viewportHeight: 600
});

const networkData = generator.generate();
console.log(JSON.stringify(networkData, null, 2));
*/