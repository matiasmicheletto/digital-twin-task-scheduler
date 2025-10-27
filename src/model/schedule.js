export class Task {
    constructor(id, label, C, T, D, a, M) {
        this.id = id;
        this.label = label; // Task name
        this.C = C; // Worst-case execution time
        this.T = T; // Period
        this.D = D; // Deadline
        this.a = a; // Activation time
        this.M = M; // Memory requirement
        this.successors = []; // List of successor task IDs
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

    addTask(task) {
        if(!(task instanceof Task)) {
            throw new Error("Invalid task object");
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
        if(fromTask && toTask) {
            if(fromTask.successors.includes(toTaskId)) {
                throw new Error("This precedence already exists");
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

    getTasks() {
        return Array.from(this.tasks.values());
    }

    toGraph() { // Returns tasks and their precedences
        const tasksArray = Array.from(this.tasks.values());
        const precedences = [];
        for(let task of tasksArray) {
            for(let succId of task.successors) {
                precedences.push({ from: task.id, to: succId });
            }
        }
        return { tasks: tasksArray, precedences };
    }

    static fromGraph(graph) {
        const schedule = new Schedule();
        for(let taskData of graph.tasks) {
            const task = new Task(
                taskData.id,
                taskData.label,
                taskData.C,
                taskData.T,
                taskData.D,
                taskData.a,
                taskData.M
            );
            schedule.addTask(task);
        }
        for(const {from, to} of graph.precedences) {
            schedule.connectTasks(from, to);
        }
        return schedule;
    }
};