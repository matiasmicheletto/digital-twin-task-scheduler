import ScheduleEditor from "./ScheduleEditor";
import NetworkEditor from "./NetworkEditor";
import About from "./About";
//import Help from "./Help";
import Error from "./Error";

const views = [
    {
        path: "/schedule-editor",
        name: "Precedences Editor",
        component: <ScheduleEditor />
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