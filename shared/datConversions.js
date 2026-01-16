import { generateUUID8 } from "./utils.js";

/*
    Model format:
    {
        nodes: [
            {
                id: uuid,
                memory: number,
                cost: number,
                u: number
            },
            ...
        ],
        tasks: [
            {
                id: uuid,
                C: number,
                T: number,
                D: number,
                a: number,
                M: number,
                processorId: uuid | null
            },
            ...
        ],
        precedences: [
            {
                from: taskUuid,
                to: taskUuid
            },
            ...
        ],
        connections: [
            {
                from: nodeUuid,
                to: nodeUuid,
                delay: number
            },
            ...
        ]
    }

    Dat format:
    N
    nodeId (from 1)    memory    u    cost
    ...
    M
    taskId (from 0)   C    T    D    a    M    allocatedNode
    ...
    P (M x M)
    fromTaskId    toTaskId    exists (1/0)
    ...
    S (N x N)
    fromNodeId    toNodeId    delay
    ...
*/

export const modelToDat = model => {

    const lines = [];

    // Create reverse maps for IDs
    const nodeUuidToId = {};
    const taskUuidToId = {};

    // Write nodes
    lines.push(model.nodes.length.toString());
    model.nodes.forEach((node, index) => {
        const numericId = index + 1;
        nodeUuidToId[node.id] = numericId;
        lines.push(`${numericId}\t${node.memory}\t${node.u}\t${node.cost}`);
    });

    // Write tasks
    lines.push(model.tasks.length.toString()-1); // Starts from 0
    model.tasks.forEach((task, index) => {
        const numericId = index;
        taskUuidToId[task.id] = numericId; // Note that taskId starts from 0
        const allocatedNode = task.processorId ? nodeUuidToId[task.processorId] : '0';
        lines.push(`${numericId}\t${task.C}\t${task.T}\t${task.D}\t${task.a}\t${task.M}\t${allocatedNode}`);
    });

    // Write precedences (N x N matrix)
    const numTasks = model.tasks.length;
    lines.push((numTasks * numTasks).toString());

    for (let i = 0; i < numTasks; i++) {
        for (let j = 0; j < numTasks; j++) {
            const fromUuid = Object.keys(taskUuidToId).find(key => taskUuidToId[key] === i);
            const toUuid = Object.keys(taskUuidToId).find(key => taskUuidToId[key] === j);

            const hasPrecedence = model.precedences.some(
                p => p.from === fromUuid && p.to === toUuid
            );

            lines.push(`${i}\t${j}\t${hasPrecedence ? '1' : '0'}`);
        }
    }

    // Write connections (S x S matrix)
    const numNodes = model.nodes.length;
    lines.push((numNodes * numNodes).toString());

    // Build delay matrix with direct connections
    const delayMatrix = Array.from({ length: numNodes }, () => Array(numNodes).fill(1000)); // Use 1000 as infinity

    // Set diagonal to 0 (self-connection has no delay)
    for (let i = 0; i < numNodes; i++) {
        delayMatrix[i][i] = 0;
    }

    // Populate matrix with direct connection delays
    model.connections.forEach(conn => {
        const fromId = nodeUuidToId[conn.from];
        const toId = nodeUuidToId[conn.to];
        
        if (fromId === undefined || toId === undefined) {
            console.warn(`Invalid connection: node from "${conn.from}" or node to "${conn.to}" not found`);
            return;
        }
        
        delayMatrix[fromId - 1][toId - 1] = conn.delay;
    });

    // Floyd-Warshall algorithm for all-pairs shortest paths
    for (let k = 0; k < numNodes; k++) {
        for (let i = 0; i < numNodes; i++) {
            for (let j = 0; j < numNodes; j++) {
                if (delayMatrix[i][k] !== -1 && delayMatrix[k][j] !== -1) {
                    const newDelay = delayMatrix[i][k] + delayMatrix[k][j];
                    if (delayMatrix[i][j] === -1 || newDelay < delayMatrix[i][j]) {
                        delayMatrix[i][j] = newDelay;
                    }
                }
            }
        }
    }

    for (let i = 0; i < numNodes; i++) {
        for (let j = 0; j < numNodes; j++) {
            const fromId = i + 1;
            const toId = j + 1;
            const delay = delayMatrix[i][j];
            lines.push(`${fromId}\t${toId}\t${delay}`);
        }
    }

    const text = lines.join('\n');

    //console.log("Generated DAT:");
    //console.log(text);

    return text;
};

export const datToModel = (datString) => {

    const lines = datString.trim().split('\n');
    let lineIndex = 0;

    // Parse nodes
    console.log("Parsing nodes...");
    const numNodes = parseInt(lines[lineIndex++]);
    const nodes = [];
    const nodeIdMap = {}; // Map numeric IDs to generated UUIDs

    for (let i = 0; i < numNodes; i++) {
        const [id, memory, u, cost] = lines[lineIndex++].split('\t').map(val => val.trim());
        const nodeId = generateUUID8();
        nodeIdMap[id] = nodeId;

        nodes.push({
            id: nodeId,
            type: "EDGE",
            label: `Node ${id}`,
            tasks: {},
            memory: parseFloat(memory),
            u: parseFloat(u),
            cost: parseFloat(cost ? cost:1),
            links: [],
            position: {
                x: 100 + i * 100,
                y: 100 + i * 50
            }
        });
    }
    console.log(`Parsed ${nodes.length} nodes.\n`);

    // Parse tasks
    console.log("Parsing tasks...");
    const numTasks = parseInt(lines[lineIndex++])+1; // Tasks start from 0
    const tasks = [];
    const taskIdMap = {}; // Map numeric IDs to generated UUIDs

    for (let i = 0; i < numTasks; i++) {
        const [id, C, T, D, a, M, allocatedNode] = lines[lineIndex++].split('\t').map(val => val.trim());
        const taskId = generateUUID8();
        taskIdMap[id] = taskId;

        const isMist = allocatedNode !== '0' && allocatedNode !== '';

        tasks.push({
            id: taskId,
            type: "TASK",
            label: `Task ${id}`,
            mist: isMist,
            C: parseFloat(C),
            T: parseFloat(T),
            D: parseFloat(D),
            a: parseFloat(a),
            M: parseFloat(M),
            processorId: isMist ? nodeIdMap[allocatedNode] : null,
            successors: [],
            position: {
                x: 200 + i * 80,
                y: 200 + i * 60
            }
        });
    }
    console.log(`Parsed ${tasks.length} tasks.\n`);

    // Parse precedences
    console.log("Parsing precedences...");
    const numPrecedences = parseInt(lines[lineIndex++]); // Should be M x M
    const precedences = [];

    for (let i = 0; i < numPrecedences; i++) {
        const [fromId, toId, exists] = lines[lineIndex++].split('\t').map(val => val.trim());

        if (exists === '1') {
            const fromUuid = taskIdMap[fromId];
            const toUuid = taskIdMap[toId];

            precedences.push({
                id: `${fromUuid}_${toUuid}`,
                from: fromUuid,
                to: toUuid,
                bidirectional: false
            });

            // Add to successors list of from task
            const fromTask = tasks.find(t => t.id === fromUuid);
            if (fromTask && !fromTask.successors.includes(toUuid)) {
                fromTask.successors.push(toUuid);
            }
        }
    }
    console.log(`Parsed ${precedences.length} precedences.\n`);

    // Parse connections
    console.log("Parsing connections...");

    const numConnections = parseInt(lines[lineIndex++]);
    const connections = [];

    for (let i = 0; i < numConnections; i++) {

        const [fromId, toId, delay] = lines[lineIndex++].split('\t').map(val => val.trim());

        if (delay !== '0' && delay !== '' && delay !== '1000') { // Ignore self-connections and infinite delays
            const fromUuid = nodeIdMap[fromId];
            const toUuid = nodeIdMap[toId];
            const fromNode = nodes.find(n => n.id === fromUuid);

            const connection = {
                id: `${fromUuid}_${toUuid}`,
                label: `Node ${fromId} -> Node ${toId}`,
                from: fromUuid,
                to: toUuid,
                delay: parseFloat(delay),
                bidirectional: false
            };

            // Check if there is already a connection between fromId and toId in the opposite direction
            /*
            const existingConnection = connections.findIndex(conn => conn.from === toUuid && conn.to === fromUuid);
            if(existingConnection !== -1) {
                connections[existingConnection].delay = Math.min(connections[existingConnection].delay, parseFloat(delay));
                connections[existingConnection].label = `Node ${fromId} <--> Node ${toId}`;
                connections[existingConnection].bidirectional = true;

                // Update link in fromNode and toNode
                const connectionId = connections[existingConnection].id;
                const toNode = nodes.find(n => n.id === toUuid);
                if (fromNode && toNode) {
                    const linkFromIndex = fromNode.links.findIndex(l => l.id === connectionId);
                    const linkToIndex = toNode.links.findIndex(l => l.id === connectionId);
                    if(linkFromIndex !== -1) {
                        fromNode.links[linkFromIndex].delay = Math.min(fromNode.links[linkFromIndex].delay, parseFloat(delay));
                        fromNode.links[linkFromIndex].label = `Node ${fromId} <--> Node ${toId}`;
                        fromNode.links[linkFromIndex].bidirectional = true;
                    }
                    if(linkToIndex !== -1) {
                        toNode.links[linkToIndex].delay = Math.min(toNode.links[linkToIndex].delay, parseFloat(delay));
                        toNode.links[linkToIndex].label = `Node ${fromId} <--> Node ${toId}`;
                        toNode.links[linkToIndex].bidirectional = true;
                    }
                }
                continue; // Skip adding a new connection
            }
            */

            connections.push(connection);

            // Add link to source node
            if (fromNode) {
                fromNode.links.push({
                    id: connection.id,
                    label: connection.label,
                    sourceId: fromUuid,
                    targetId: toUuid,
                    delay: parseFloat(delay),
                    bidirectional: false
                });
            }
        }
    }

    // MIST task usually are preallocated to MIST nodes.
    // Therefore, we set the node type to MIST if a task is allocated to it and a task's mist flag to true if it is preallocated to a node.

    console.log(`Parsed ${connections.length} connections.\n`);

    // If a task is allocated to a node, set that node to MIST
    nodes.forEach(node => {
        const isMistNode = tasks.some(task => task.processorId === node.id);
        if(isMistNode) {
            node.type = "MIST";
        }
    });

    tasks.forEach(task => {
        if(task.processorId) {
            task.mist = true;
        }
    });

    /*
    // ---OLD --- If a task has no precedences, set mist to true
    tasks.forEach(task => {
        const hasPrecedence = precedences.some(p => p.to === task.id);
        task.mist = !hasPrecedence;
        // If is preallocated, set that node to mist
        if(task.processorId) {
            const node = nodes.find(n => n.id === task.processorId);
            if(node) {
                node.type = "MIST";
            }
        }
    });
    */

    const model = {
        nodes,
        connections,
        tasks,
        precedences
    };

    return model;
};