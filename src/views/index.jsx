import TasksEditor from "./TasksEditor";
import NetworkEditor from "./NetworkEditor";
import About from "./About";
//import Help from "./Help";
import Error from "./Error";

const views = [
    {
        path: "/task-editor",
        name: "Task Editor",
        component: <TasksEditor />
    },
    {
        path: "/network-editor",
        name: "Network Editor",
        component: <NetworkEditor />
    },
    {
        path: "/about",
        name: "About",
        component: <About />
    },
    /*{
        path: "/help",
        name: "help",
        component: <Help />
    },*/
    {
        path: "/error",
        component: <Error />
    }
];

export default views;