export default class Tasks {
    constructor(tasks = [], precedences = []) {
        this.tasks = tasks; // Nodes
        this.precedences = precedences; // Edges
    }

    import(data) {
        if(!Array.isArray(data.tasks) || !Array.isArray(data.precedences)) {
            throw new Error("Invalid data format");
        }
        this.tasks = data.tasks.map(t => ({...t}));
        this.precedences = data.precedences.map(p => ({...p}));
    }

    addTask(task) {
        this.tasks.push(task);
    }

    removeTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.precedences = this.precedences.filter(edge => edge.from !== taskId && edge.to !== taskId);
    }

    getTasks() {
        return {
            tasks: this.tasks,
            precedences: this.precedences
        };
    }

    connectTasks(fromTaskId, toTaskId) {
        if(fromTaskId === toTaskId) {
            throw new Error("Cannot connect a task to itself");
        }

        if(this.precedences.some(edge => edge.from === fromTaskId && edge.to === toTaskId)) {
            throw new Error("Tasks are already connected");
        }

        if(this.precedences.some(edge => edge.from === toTaskId && edge.to === fromTaskId)) {
            throw new Error("Cannot create circular dependency");
        }

        this.precedences.push({ from: fromTaskId, to: toTaskId });
    }
};