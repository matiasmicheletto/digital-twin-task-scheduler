/**
 * NetworkGenerator
 * =============================
 * Generates a network topology consisting of Mist, Edge, and Cloud nodes
 * with configurable parameters and topologies.
 * 
 * Configuration Options:
 * - mistCount: Number of Mist nodes to generate (default: 2)
 * - edgeCount: Number of Edge nodes to generate (default: 1)
 * - includeCloud: Whether to include a Cloud node (default: true)
 * - topology: Topology strategy ('star', 'random', 'hierarchical', 'cluster') (default: 'random')
 * - connectionDensity: Density of connections between nodes (0 to 1) (default: 0.5)
 * - clusterCount: Number of clusters for 'cluster' topology (default: 2)
 * - viewport: Object with width and height for positioning nodes (default: { width: 800, height: 600 })
 * - seed: Optional seed for random number generation (not implemented)
 * 
 * Public Methods:
 * - generate(): Generates and returns the network topology as a structured object.
 * ============================
 * Example Usage:
 * const generator = new NetworkGenerator({ mistCount: 5, edgeCount: 3, topology: 'hierarchical' });
 * const network = generator.generate();
 * ============================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Network, { Node, NODE_TYPES } from './network.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PRESET_DIR = path.join(__dirname, 'presets/network-presets');

export default class NetworkGenerator {

    constructor(config = {}) {
        this.config = {
            mistCount: 2,
            edgeCount: 1,
            includeCloud: true,
            topology: 'random',
            connectionDensity: 0.5,
            clusterCount: 2,
            viewport: { width: 800, height: 600 },
            seed: null,
            ...config
        };

        this.validate();
    }


    /* ============================
        Public API
    ============================= */

    generate() {
        const network = new Network();

        const mist = this.createNodes(NODE_TYPES.MIST, this.config.mistCount, 0.2);
        const edge = this.createNodes(NODE_TYPES.EDGE, this.config.edgeCount, 0.5);
        const cloud = this.config.includeCloud ? this.createCloud() : null;

        [...mist, ...edge, cloud].filter(Boolean).forEach(n => network.addNode(n));

        this.applyTopology(network, mist, edge, cloud);

        return this.format(network);
    }


    /* ============================
        Validation
    ============================= */

    validate() {
        const c = this.config;

        number('mistCount', c.mistCount, 0);
        number('edgeCount', c.edgeCount, 0);
        number('clusterCount', c.clusterCount, 1);
        ratio('connectionDensity', c.connectionDensity);

        if (!['star', 'random', 'hierarchical', 'cluster'].includes(c.topology))
            throw new Error(`Invalid topology: ${c.topology}`);

        if (c.mistCount > 0 && c.edgeCount === 0)
            throw new Error("Mist nodes require at least one Edge node");

        if (c.topology === 'cluster' && c.clusterCount < 1)
            throw new Error("clusterCount must be >= 1");
    }


    /* ============================
        Generation
    ============================= */

    createNodes(type, count, xRatio) {
        const nodes = [];
        const { width, height } = this.config.viewport;

        for (let i = 0; i < count; i++) {
            const node = new Node(`${type} ${i + 1}`, type);
            node.position = this.position(i, count, xRatio, width, height);
            node.u = Math.random();
            node.memory = rand(1, 10);
            nodes.push(node);
        }

        return nodes;
    }

    createCloud() {
        const { width, height } = this.config.viewport;
        const node = new Node('Cloud', NODE_TYPES.CLOUD);
        node.position = { x: width * 0.8, y: height * 0.5 };
        node.u = Math.random();
        node.memory = rand(5, 20);
        return node;
    }

    applyTopology(net, mist, edge, cloud) {
        const strategies = {
            star: () => star(net, mist, edge, cloud),
            random: () => random(net, mist, edge, cloud, this.config),
            hierarchical: () => hierarchical(net, mist, edge, cloud, this.config),
            cluster: () => cluster(net, mist, edge, cloud, this.config),
        };

        strategies[this.config.topology]();
    }

    format(network) {
        return {
            metadata: {
                type: 'network',
                generator: 'NetworkGenerator',
                generatedAt: new Date().toISOString(),
                config: this.config
            },
            nodes: network.getNodes(),
            connections: network.getConnections()
        };
    }

    position(i, total, xRatio, w, h) {
        return {
            x: Math.floor(xRatio * w + rand(-30, 30)),
            y: Math.floor((i + 1) * h / (total + 1))
        };
    }
}


/* =============================
   Topology Strategies
============================== */

function star(net, mist, edge, cloud) {
    mist.forEach(m => edge.forEach(e => connect(net, m, e)));
    edge.forEach(e => cloud && connect(net, e, cloud));
}

function random(net, mist, edge, cloud, cfg) {
    mist.forEach(m => connect(net, m, pick(edge)));
    densePairs(edge, cfg.connectionDensity, (a, b) => connectSafe(net, a, b));
    cloud && ensureOne(edge, e => connect(net, e, cloud));
}

function hierarchical(net, mist, edge, cloud, cfg) {
    const perEdge = Math.ceil(mist.length / edge.length);
    mist.forEach((m, i) => connect(net, m, edge[Math.floor(i / perEdge)]));
    chain(edge, (a, b) => connect(net, a, b));
    cloud && ensureOne(edge.slice(0, Math.ceil(edge.length * cfg.connectionDensity)), e => connect(net, e, cloud));
}

function cluster(net, mist, edge, cloud, cfg) {
    const E = split(edge, cfg.clusterCount);
    const M = split(mist, cfg.clusterCount);

    M.forEach((group, i) => group.forEach(m => connect(net, m, pick(E[i]))));
    E.forEach(c => densePairs(c, 0.7, (a, b) => connect(net, a, b)));
    sparsePairs(E, cfg.connectionDensity, (a, b) => connectSafe(net, pick(a), pick(b)));
    cloud && E.forEach(c => connect(net, c[0], cloud));
}


/* =============================
   Utility
============================== */

function connect(net, a, b) {
    net.connectNodes(a.id, b.id, rand(1, 10));
}

function connectSafe(net, a, b) {
    try { connect(net, a, b); } catch {}
}

function pick(a) {
    return a[Math.floor(Math.random() * a.length)];
}

function densePairs(a, p, fn) {
    for (let i = 0; i < a.length; i++)
        for (let j = i + 1; j < a.length; j++)
            Math.random() < p && fn(a[i], a[j]);
}

function sparsePairs(a, p, fn) {
    for (let i = 0; i < a.length; i++)
        for (let j = i + 1; j < a.length; j++)
            Math.random() < p && fn(a[i], a[j]);
}

function chain(a, fn) {
    for (let i = 0; i < a.length - 1; i++)
        fn(a[i], a[i + 1]);
}

function split(a, n) {
    const size = Math.ceil(a.length / n);
    return Array.from({ length: n }, (_, i) => a.slice(i * size, (i + 1) * size));
}

function ensureOne(a, fn) {
    a.length && fn(pick(a));
}

function rand(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

function number(name, val, min) {
    if (!Number.isInteger(val) || val < min)
        throw new Error(`${name} must be integer >= ${min}`);
}

function ratio(name, val) {
    if (typeof val !== 'number' || val < 0 || val > 1)
        throw new Error(`${name} must be in range [0,1]`);
}


/* =============================
    Preset Loader
============================== */

export function loadPresets() {
    const files = fs.readdirSync(PRESET_DIR).filter(f => f.endsWith('.json'));

    return files.map(file => {
        const preset = JSON.parse(
            fs.readFileSync(path.join(PRESET_DIR, file), 'utf8')
        );
        return {
            id: path.basename(file, '.json'),
            ...preset
        };
    });
}
