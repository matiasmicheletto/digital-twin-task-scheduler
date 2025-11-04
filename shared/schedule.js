import { generateUUID8 } from './utils.js';
const TASK_ATTRIBUTES = ['id', 'mist', 'label', 'C', 'T', 'D', 'a', 'M', 'successors', 'position'];

export class Task {
    constructor(label, mist, C, T, D, a, M, position) {
        this.id = generateUUID8(); // Unique task identifier
        this.type = "TASK"; // For visualization purposes
        this.label = label; // Task name
        this.mist = mist; // If the allocation of this task is fixed to a node
        this.C = C; // Worst-case execution time
        this.T = T; // Period
        this.D = D; // Deadline
        this.a = a; // Activation time
        this.M = M; // Memory requirement
        this.successors = []; // List of successor task IDs
        this.position = position || { // For visualization
            x: 400 + Math.random() * 200,
            y: 300 + Math.random() * 200
        };
    }

    static getAttributeNames() {
        return TASK_ATTRIBUTES;
    }

    addSuccessor(taskId) {
        if(taskId === this.id) {
            throw new Error("A task cannot be a successor to itself");
        }
        if(this.successors.includes(taskId)) {
            throw new Error("This successor relationship already exists");   
        }
        this.successors.push(taskId);
    }

    removeSuccessor(taskId) {
        this.successors = this.successors.filter(id => id !== taskId);  
    }

    static fromObject(obj) {
        const task = new Task(obj.label, obj.mist, obj.C, obj.T, obj.D, obj.a, obj.M, obj.position);
        if(obj.id) // If object has id, use it to preserve identity
            task.id = obj.id;
        if(obj.successors) // Same for successors
            task.successors = obj.successors;
        return task;
    }

    setPosition(x, y) {
        this.position = { x, y };
    }

    setAttributes(attrs) {
        for (const [key, value] of Object.entries(attrs)) {
            if (this.hasOwnProperty(key)) 
                this[key] = value;
            else 
                throw new Error(`Attribute ${key} does not exist on Task`);
        }
    }
};

export default class Schedule {
    constructor() {
        this.tasks = new Map(); // Map of taskId to Task objects
    }

    addTask(task) { // Create or update task (Update if id is already present)

        if(!(task instanceof Task)) {
            throw new Error("Invalid task object");
        }

        if(task.mist) {
            // If the new task is a mist task, ensure no other task has it as successor
            for(let t of this.tasks.values()) {
                t.removeSuccessor(task.id);
            }
        }

        this.tasks.set(task.id, task);
    }

    removeTask(taskId) {
        if(this.tasks.has(taskId)) {
            this.tasks.delete(taskId);
            // Remove this task from successors of other tasks
            for(let task of this.tasks.values()) {
                task.removeSuccessor(taskId);
            }
        }
    }

    connectTasks(fromTaskId, toTaskId) {
        const fromTask = this.tasks.get(fromTaskId);
        const toTask = this.tasks.get(toTaskId);
        if(toTask.mist) {
            throw new Error("Cannot add precedence to a mist task");
        }

        if(fromTask && toTask) {
            if(fromTask.successors.includes(toTaskId)) {
                throw new Error(`Precedence from task ${fromTask.label} to task ${toTask.label} already exists`);
            }
            // Prevent circular dependencies
            let visited = new Set();
            const hasCycle = (currentId) => {
                if(visited.has(currentId)) 
                    return true;
                visited.add(currentId);
                const currentTask = this.tasks.get(currentId);
                for(let succId of currentTask.successors) {
                    if(succId === fromTaskId || hasCycle(succId)) {
                        return true;
                    }
                }
                visited.delete(currentId);
                return false;
            };
            if(hasCycle(toTaskId)) {
                throw new Error("Connecting these tasks would create a circular dependency");
            }
            fromTask.addSuccessor(toTaskId);
        } else {
            throw new Error("One or both task IDs do not exist");
        }
    }

    disconnectTasks(fromTaskId, toTaskId) {
        const fromTask = this.tasks.get(fromTaskId);
        if(fromTask) {
            fromTask.removeSuccessor(toTaskId);
        }
    }

    getTask(taskId) {
        return this.tasks.get(taskId);
    }

    getTasks() {
        return this.tasks.values();
    }

    getPrecedences() {
        const precedences = [];
        for(let task of this.tasks.values()) {
            for(let succId of task.successors) {
                precedences.push({ id: `${task.id}_${succId}`, from: task, to: this.tasks.get(succId) });
            }
        }
        return precedences;
    }

    toGraph() { // Returns tasks and their precedences as arrays
        const tasksArray = Array.from(this.tasks.values());
        const precedences = [];
        for(let task of tasksArray) {
            for(let succId of task.successors) {
                precedences.push({ id: `${task.id}_${succId}`, from: task.id, to: succId });
            }
        }
        
        return { vertices: tasksArray, edges: precedences };
    }

    fromGraph({vertices, edges}) { // Rebuild schedule from tasks and precedences arrays
        this.tasks.clear();
        for(let v of vertices) {
            // Parameters validation
            Object.values(TASK_ATTRIBUTES).forEach(attr => {
                if(v[attr] === undefined) {
                    throw new Error(`Missing attribute ${attr} in task ${v.id}`);
                }
                if((attr === 'C' || attr === 'T' || attr === 'D' || attr === 'a' || attr === 'M') && isNaN(v[attr])) {
                    throw new Error(`Attribute ${attr} in task ${t.id} must be a number`);
                }
            });

            const task = new Task(v.label, v.mist, v.C, v.T, v.D, v.a, v.M, v.position);
            task.setAttributes({ id: v.id });
            this.addTask(task);
        }
        
        for(let e of edges) {
            if(this.tasks.has(e.from) && this.tasks.has(e.to)) {
                this.connectTasks(e.from, e.to);
            } else {
                throw new Error(`Invalid precedence from ${e.from} to ${e.to}`);
            }
        }
    }
};


