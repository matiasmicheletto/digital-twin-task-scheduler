import ScheduleEditor from "./ScheduleEditor";
import About from "./About";
import Error from "./Error";

const views = [
    {
        path: "/schedule-editor",
        name: "Editor",
        component: <ScheduleEditor />
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