import GraphEditor from "./GraphEditor";
import About from "./About";
import Error from "./Error";

const views = [
    {
        path: "/graph-editor",
        name: "Editor",
        component: <GraphEditor />
    },
    {
        path: "/about",
        name: "About",
        component: <About />
    },
    {
        path: "/error",
        component: <Error />
    }
];

export default views;