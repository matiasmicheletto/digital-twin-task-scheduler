const ParamText = ({x, y, text}) => (
    <text
        x={x}
        y={y}
        style={{ userSelect: "none" }}
        textAnchor="start"
        fill="black"
        fontSize="12"
        pointerEvents="none">
        {text}
    </text>
);

const TaskTooltip = ({ task, position }) => (
    <g>
        <rect
            x={position.x+10}
            y={position.y}
            width={100}
            height={140}
            fill="white"
            stroke="black"
            strokeWidth={2}/>
        <ParamText x={position.x+20} y={position.y + 20} text={`ID: ${task.id}`} />
        <ParamText x={position.x+20} y={position.y + 40} text={`C: ${task.C}`} />
        <ParamText x={position.x+20} y={position.y + 60} text={`T: ${task.T}`} />
        <ParamText x={position.x+20} y={position.y + 80} text={`D: ${task.D}`} />
        <ParamText x={position.x+20} y={position.y + 100} text={`a: ${task.a}`} />
        <ParamText x={position.x+20} y={position.y + 120} text={`M: ${task.M}`} />
    </g>
);

export default TaskTooltip;