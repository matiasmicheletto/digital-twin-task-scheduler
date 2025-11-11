import { generateUUID8 } from "./utils.js";

export const modelToDat = (model) => {
    const lines = [];

    // Create reverse maps for IDs
    const nodeUuidToId = {};
    const taskUuidToId = {};

    // Write nodes
    lines.push(model.nodes.length.toString());
    model.nodes.forEach((node, index) => {
        const numericId = index + 1;
        nodeUuidToId[node.id] = numericId;
        lines.push(`${numericId}\t${node.memory}\t${node.u}`);
    });

    // Write tasks
    lines.push(model.tasks.length.toString());
    model.tasks.forEach((task, index) => {
        const numericId = index + 1;
        taskUuidToId[task.id] = numericId;
        const allocatedNode = task.mist ? '1' : '0'; // Simplified allocation
        lines.push(`${numericId}\t${task.C}\t${task.T}\t${task.D}\t${task.a}\t${task.M}\t${allocatedNode}`);
    });

    // Write precedences (N x N matrix)
    const numTasks = model.tasks.length;
    lines.push((numTasks * numTasks).toString());

    for (let i = 1; i <= numTasks; i++) {
        for (let j = 1; j <= numTasks; j++) {
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

    for (let i = 1; i <= numNodes; i++) {
        for (let j = 1; j <= numNodes; j++) {
            const fromUuid = Object.keys(nodeUuidToId).find(key => nodeUuidToId[key] === i);
            const toUuid = Object.keys(nodeUuidToId).find(key => nodeUuidToId[key] === j);

            const connection = model.connections.find(
                c => c.from === fromUuid && c.to === toUuid
            );

            const delay = connection ? connection.delay : 0;
            lines.push(`${i}\t${j}\t${delay}`);
        }
    }

    const text = lines.join('\n');

    console.log("Generated DAT:");
    console.log(text);

    return "";
};

export const datToModel = (datString) => {

    console.log("Parsing DAT:");
    console.log(datString);

    const lines = datString.trim().split('\n');
    let lineIndex = 0;

    // Parse nodes
    const numNodes = parseInt(lines[lineIndex++]);
    const nodes = [];
    const nodeIdMap = {}; // Map numeric IDs to generated UUIDs

    for (let i = 0; i < numNodes; i++) {
        const [id, memory, u] = lines[lineIndex++].split('\t').map(val => val.trim());
        const nodeId = generateUUID8();
        nodeIdMap[id] = nodeId;

        nodes.push({
            id: nodeId,
            type: "EDGE",
            label: `Node ${id}`,
            tasks: {},
            memory: parseFloat(memory),
            u: parseFloat(u),
            links: [],
            position: {
                x: 100 + i * 100,
                y: 100 + i * 50
            }
        });
    }

    // Parse tasks
    const numTasks = parseInt(lines[lineIndex++]);
    const tasks = [];
    const taskIdMap = {}; // Map numeric IDs to generated UUIDs

    for (let i = 0; i < numTasks; i++) {
        const [id, C, T, D, a, M, allocatedNode] = lines[lineIndex++].split('\t').map(val => val.trim());
        const taskId = generateUUID8();
        taskIdMap[id] = taskId;

        const isMist = allocatedNode !== '0' && allocatedNode !== '';

        tasks.push({
            id: taskId,
            type: isMist ? "MIST" : "TASK",
            label: `Task ${id}`,
            mist: isMist,
            C: parseFloat(C),
            T: parseFloat(T),
            D: parseFloat(D),
            a: parseFloat(a),
            M: parseFloat(M),
            successors: [],
            position: {
                x: 200 + i * 80,
                y: 200 + i * 60
            }
        });
    }

    // Parse precedences
    const numPrecedences = parseInt(lines[lineIndex++]);
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

            // Add to successors list
            const fromTask = tasks.find(t => t.id === fromUuid);
            if (fromTask && !fromTask.successors.includes(toUuid)) {
                fromTask.successors.push(toUuid);
            }
        }
    }

    // Parse connections
    const numConnections = parseInt(lines[lineIndex++]);
    const connections = [];

    for (let i = 0; i < numConnections; i++) {
        const [fromId, toId, delay] = lines[lineIndex++].split('\t').map(val => val.trim());

        if (delay !== '0' && delay !== '') {
            const fromUuid = nodeIdMap[fromId];
            const toUuid = nodeIdMap[toId];
            const fromNode = nodes.find(n => n.id === fromUuid);

            const connection = {
                id: `${fromUuid}_${toUuid}`,
                label: `Node ${fromId} → Node ${toId}`,
                from: fromUuid,
                to: toUuid,
                delay: parseFloat(delay),
                bidirectional: false
            };

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

    const model = {
        nodes,
        connections,
        tasks,
        precedences
    };

    // return model;

    console.log(model);

    return {
        nodes: [],
        connections: [],
        tasks: [],
        precedences: []
    };
};