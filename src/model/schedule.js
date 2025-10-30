const TASK_ATTRIBUTES = ['id', 'mist', 'label', 'C', 'T', 'D', 'a', 'M', 'successors'];

export class Task {
    constructor(id, label, mist, C, T, D, a, M) {
        this.id = id;
        this.mist = mist; // If the allocation of this task is fixed to a node
        this.label = label; // Task name
        this.C = C; // Worst-case execution time
        this.T = T; // Period
        this.D = D; // Deadline
        this.a = a; // Activation time
        this.M = M; // Memory requirement
        this.successors = []; // List of successor task IDs
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

    static toTaskObject(obj) {
        return new Task(obj.id, obj.label, obj.mist, obj.C, obj.T, obj.D, obj.a, obj.M);
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

    disconnectTasks(fromTaskId, toTaskId) {
        const fromTask = this.tasks.get(fromTaskId);
        if(fromTask) {
            fromTask.removeSuccessor(toTaskId);
        }
    }

    getTask(taskId) {
        return this.tasks.get(taskId);
    }

    toGraph() { // Returns tasks and their precedences as arrays
        const tasksArray = Array.from(this.tasks.values());
        const precedences = [];
        for(let task of tasksArray) {
            for(let succId of task.successors) {
                precedences.push({ id: `${task.id}_${succId}`, from: task.id, to: succId });
            }
        }
        
        return { tasks: tasksArray, precedences };
    }

    fromGraph({tasks, precedences}) { // Rebuild schedule from tasks and precedences arrays
        this.tasks.clear();
        const attributeNames = Task.getAttributeNames();
        for(let t of tasks) {
            Object.keys(t).some(key => { // Validate attributes
                if(!attributeNames.includes(key) && key !== 'x' && key !== 'y') {
                    throw new Error(`Unknown attribute in task: ${key}`);
                }
            });

            // Parameters validation
            Object.values(Task.getAttributeNames()).forEach(attr => {
                if(t[attr] === undefined) {
                    throw new Error(`Missing attribute ${attr} in task ${t.id}`);
                }
                if((attr === 'C' || attr === 'T' || attr === 'D' || attr === 'a' || attr === 'M') && isNaN(t[attr])) {
                    throw new Error(`Attribute ${attr} in task ${t.id} must be a number`);
                }
            });

            const task = new Task(t.id, t.label, t.mist, t.C, t.T, t.D, t.a, t.M);
            this.addTask(task);
        }
        
        for(let e of precedences) {
            if(this.tasks.has(e.from) && this.tasks.has(e.to)) {
                this.connectTasks(e.from, e.to);    
            } else {
                throw new Error(`Invalid precedence from ${e.from} to ${e.to}`);
            }
        }
    }
};


