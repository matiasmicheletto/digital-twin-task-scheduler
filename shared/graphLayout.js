/**
 * Graph Layout Algorithms for Visualization
 * Provides automatic positioning for graphs
 */

export default class GraphLayout {
    constructor(config = {}) {
        this.config = {
            width: 1200,
            height: 800,
            nodeRadius: 40, // For circular vertices (if using rectangles, add nodeWidth/nodeHeight)
            horizontalSpacing: 150,
            verticalSpacing: 100,
            marginX: 100,
            marginY: 80,
            ...config
        };
    }

    /**
     * Apply layout to a graph
     */
    applyLayout(graph, algorithm = 'hierarchical') {
        const { vertices, edges } = graph;
        
        let positions;
        switch (algorithm) {
            case 'hierarchical':
                positions = this.hierarchicalLayout(vertices, edges);
                break;
            case 'force':
                positions = this.forceDirectedLayout(vertices, edges);
                break;
            case 'circular':
                positions = this.circularLayout(vertices, edges);
                break;
            case 'grid':
                positions = this.gridLayout(vertices);
                break;
            default:
                positions = this.hierarchicalLayout(vertices, edges);
        }
        
        // Apply positions to vertices
        vertices.forEach(vertex => {
            const pos = positions.get(vertex.id);
            if (pos) {
                vertex.position = pos;
            }
        });
        
        return positions;
    }

    /**
     * Hierarchical (Layered) Layout - Best for DAGs
     * Places vertices in layers based on their topological order
     */
    hierarchicalLayout(vertices, edges) {
        const positions = new Map();
        
        // Build adjacency lists
        const successors = new Map();
        const predecessors = new Map();
        
        vertices.forEach(vertex => {
            successors.set(vertex.id, []);
            predecessors.set(vertex.id, []);
        });
        
        edges.forEach(edge => {
            successors.get(edge.from).push(edge.to);
            predecessors.get(edge.to).push(edge.from);
        });
        
        // Assign layers using longest path algorithm
        const layers = this.assignLayers(vertices, successors, predecessors);
        
        // Position vertices within layers
        const { width, height, horizontalSpacing, verticalSpacing, marginX, marginY } = this.config;
        
        const numLayers = Math.max(...layers.values()) + 1;
        const layerHeight = (height - 2 * marginY) / Math.max(numLayers - 1, 1);
        
        // Group vertices by layer
        const tasksByLayer = new Map();
        for (let i = 0; i < numLayers; i++) {
            tasksByLayer.set(i, []);
        }
        
        vertices.forEach(vertex => {
            const layer = layers.get(vertex.id);
            tasksByLayer.get(layer).push(vertex);
        });
        
        // Apply barycenter heuristic for crossing reduction
        this.reduceCrossings(tasksByLayer, successors, predecessors, numLayers);
        
        // Position vertices
        tasksByLayer.forEach((layerTasks, layerIndex) => {
            const numInLayer = layerTasks.length;
            const layerWidth = (width - 2 * marginX) / Math.max(numInLayer - 1, 1);
            
            layerTasks.forEach((vertex, indexInLayer) => {
                const x = numInLayer === 1 
                    ? width / 2 
                    : marginX + indexInLayer * layerWidth;
                const y = marginY + layerIndex * layerHeight;
                
                positions.set(vertex.id, { x, y });
            });
        });
        
        return positions;
    }

    /**
     * Assign vertices to layers based on longest path from sources
     */
    assignLayers(vertices, successors, predecessors) {
        const layers = new Map();
        const visited = new Set();
        
        // Initialize all vertices to layer 0
        vertices.forEach(vertex => layers.set(vertex.id, 0));
        
        // Find source vertices (no predecessors)
        const sources = vertices.filter(vertex => 
            predecessors.get(vertex.id).length === 0
        );
        
        // BFS to assign layers
        const queue = [...sources.map(t => t.id)];
        visited.clear();
        
        while (queue.length > 0) {
            const taskId = queue.shift();
            if (visited.has(taskId)) continue;
            visited.add(taskId);
            
            const currentLayer = layers.get(taskId);
            
            successors.get(taskId).forEach(succId => {
                const newLayer = currentLayer + 1;
                if (newLayer > layers.get(succId)) {
                    layers.set(succId, newLayer);
                }
                queue.push(succId);
            });
        }
        
        return layers;
    }

    /**
     * Reduce edge crossings using barycenter heuristic
     */
    reduceCrossings(tasksByLayer, successors, predecessors, numLayers) {
        const iterations = 3;
        
        for (let iter = 0; iter < iterations; iter++) {
            // Forward pass (top to bottom)
            for (let layer = 1; layer < numLayers; layer++) {
                const layerTasks = tasksByLayer.get(layer);
                
                layerTasks.forEach(vertex => {
                    const preds = predecessors.get(vertex.id);
                    if (preds.length > 0) {
                        const prevLayer = tasksByLayer.get(layer - 1);
                        const positions = preds.map(predId => 
                            prevLayer.findIndex(t => t.id === predId)
                        );
                        vertex._barycenter = positions.reduce((a, b) => a + b, 0) / positions.length;
                    } else {
                        vertex._barycenter = layerTasks.indexOf(vertex);
                    }
                });
                
                layerTasks.sort((a, b) => (a._barycenter || 0) - (b._barycenter || 0));
            }
            
            // Backward pass (bottom to top)
            for (let layer = numLayers - 2; layer >= 0; layer--) {
                const layerTasks = tasksByLayer.get(layer);
                
                layerTasks.forEach(vertex => {
                    const succs = successors.get(vertex.id);
                    if (succs.length > 0) {
                        const nextLayer = tasksByLayer.get(layer + 1);
                        const positions = succs.map(succId => 
                            nextLayer.findIndex(t => t.id === succId)
                        );
                        vertex._barycenter = positions.reduce((a, b) => a + b, 0) / positions.length;
                    } else {
                        vertex._barycenter = layerTasks.indexOf(vertex);
                    }
                });
                
                layerTasks.sort((a, b) => (a._barycenter || 0) - (b._barycenter || 0));
            }
        }
    }

    /**
     * Force-Directed Layout - Good for general graphs
     * Uses a physics simulation to position vertices
     */
    forceDirectedLayout(vertices, edges, iterations = 100) {
        const positions = new Map();
        const velocities = new Map();
        
        const { width, height } = this.config;
        
        // Initialize random positions
        vertices.forEach(vertex => {
            positions.set(vertex.id, {
                x: width / 2 + (Math.random() - 0.5) * width * 0.5,
                y: height / 2 + (Math.random() - 0.5) * height * 0.5
            });
            velocities.set(vertex.id, { x: 0, y: 0 });
        });
        
        // Build edge map
        const eds = new Set();
        edges.forEach(edge => {
            eds.add(`${edge.from}-${edge.to}`);
        });
        
        // Simulation parameters
        const k = Math.sqrt((width * height) / vertices.length); // Optimal distance
        const repulsionStrength = k * k;
        const attractionStrength = 0.1;
        const damping = 0.9;
        
        // Run simulation
        for (let iter = 0; iter < iterations; iter++) {
            const forces = new Map();
            vertices.forEach(vertex => forces.set(vertex.id, { x: 0, y: 0 }));
            
            // Repulsive forces between all pairs
            for (let i = 0; i < vertices.length; i++) {
                for (let j = i + 1; j < vertices.length; j++) {
                    const task1 = vertices[i];
                    const task2 = vertices[j];
                    
                    const pos1 = positions.get(task1.id);
                    const pos2 = positions.get(task2.id);
                    
                    const dx = pos2.x - pos1.x;
                    const dy = pos2.y - pos1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    const force = repulsionStrength / (distance * distance);
                    const fx = (dx / distance) * force;
                    const fy = (dy / distance) * force;
                    
                    const f1 = forces.get(task1.id);
                    const f2 = forces.get(task2.id);
                    
                    f1.x -= fx;
                    f1.y -= fy;
                    f2.x += fx;
                    f2.y += fy;
                }
            }
            
            // Attractive forces for edges
            edges.forEach(edge => {
                const pos1 = positions.get(edge.from);
                const pos2 = positions.get(edge.to);
                
                const dx = pos2.x - pos1.x;
                const dy = pos2.y - pos1.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                
                const force = attractionStrength * (distance - k);
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;
                
                const f1 = forces.get(edge.from);
                const f2 = forces.get(edge.to);
                
                f1.x += fx;
                f1.y += fy;
                f2.x -= fx;
                f2.y -= fy;
            });
            
            // Update positions
            const temperature = 1 - (iter / iterations);
            vertices.forEach(vertex => {
                const pos = positions.get(vertex.id);
                const vel = velocities.get(vertex.id);
                const force = forces.get(vertex.id);
                
                vel.x = (vel.x + force.x) * damping;
                vel.y = (vel.y + force.y) * damping;
                
                pos.x += vel.x * temperature;
                pos.y += vel.y * temperature;
                
                // Keep within bounds
                pos.x = Math.max(50, Math.min(width - 50, pos.x));
                pos.y = Math.max(50, Math.min(height - 50, pos.y));
            });
        }
        
        return positions;
    }

    /**
     * Circular Layout - Places vertices in a circle
     */
    circularLayout(vertices, edges) {
        const positions = new Map();
        const { width, height } = this.config;
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.4;
        
        vertices.forEach((vertex, index) => {
            const angle = (2 * Math.PI * index) / vertices.length - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            positions.set(vertex.id, { x, y });
        });
        
        return positions;
    }

    /**
     * Grid Layout - Simple grid arrangement
     */
    gridLayout(vertices) {
        const positions = new Map();
        const { width, height, marginX, marginY } = this.config;
        
        const cols = Math.ceil(Math.sqrt(vertices.length));
        const rows = Math.ceil(vertices.length / cols);
        
        const cellWidth = (width - 2 * marginX) / cols;
        const cellHeight = (height - 2 * marginY) / rows;
        
        vertices.forEach((vertex, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            
            const x = marginX + col * cellWidth + cellWidth / 2;
            const y = marginY + row * cellHeight + cellHeight / 2;
            
            positions.set(vertex.id, { x, y });
        });
        
        return positions;
    }
}

/**
 * Example usage:
 * 
 * // Create layout engine
 * const layout = new GraphLayout({
 *     width: 1200,
 *     height: 800,
 *     horizontalSpacing: 150,
 *     verticalSpacing: 100
 * });
 * 
 * // Apply hierarchical layout (best for DAGs)
 * layout.applyLayout(graph, 'hierarchical');
 * 
 * // Or try other layouts
 * layout.applyLayout(graph, 'force');
 * layout.applyLayout(graph, 'circular');
 * layout.applyLayout(graph, 'grid');
 * 
 * // The vertex positions are now automatically set
 * const { vertices } = graph;
 * vertices.forEach(vertex => {
 *     console.log(`${vertex.id}: (${vertex.position.x}, ${vertex.position.y})`);
 * });
 */