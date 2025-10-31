const fillColors = {
    default: "#161616ff",
    selected: "#949494ff",
    connecting: "#5f2e2eff",
    mist: "#2e4a7eff"
};

const strokeColors = {
    default: "#727272ff",
    selected: "#ffffffff",
    connecting: "#ff0000"
};

const getFillColor = (task, isSelected, isConnecting) => {
    if(task.mist) return fillColors.mist;
    if(isConnecting) return fillColors.connecting;
    if(isSelected) return fillColors.selected;
    return fillColors.default;
};

const getStrokeColor = (isSelected, isConnecting) => {
    if(isConnecting) return strokeColors.connecting;
    if(isSelected) return strokeColors.selected;
    return strokeColors.default;
};

const TaskCircle = ({
    task, 
    onMouseDown, 
    onContextMenu, 
    onMouseEnter, 
    onMouseLeave, 
    isSelected, 
    isConnecting}) => (
        <g
            onMouseDown={onMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ cursor: "pointer" }}>
            <circle
                cx={task.position.x}
                cy={task.position.y}
                r={30}
                fill={getFillColor(task, isSelected, isConnecting)}
                stroke={getStrokeColor(isSelected, isConnecting)}
                strokeDasharray={isConnecting ? "4 2" : "none"}
                strokeWidth={3}/>
            <text
                x={task.position.x}
                y={task.position.y+5}
                style={{ userSelect: "none" }}
                textAnchor="middle"
                fill={isSelected ? "#161616ff" : "#ebebebff"}
                fontSize="14"
                fontWeight="bold"
                pointerEvents="none">
                {task.label}
            </text>
        </g>
    );

export default TaskCircle;