const TaskCircle = ({
    task, 
    onMouseDown, 
    onContextMenu, 
    onMouseEnter, 
    onMouseLeave, 
    position, 
    isSelected, 
    isConnecting}) => (
        <g
            onMouseDown={onMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ cursor: "pointer" }}>
            <circle
                cx={position.x}
                cy={position.y}
                r={30}
                fill={isConnecting ? "#5f2e2eff" : isSelected ? "#949494ff" : "#161616ff"}
                stroke={isConnecting ? "#ff0000" : isSelected ? "#ffffffff" : "#727272ff"}
                strokeDasharray={isConnecting ? "4 2" : "none"}
                strokeWidth={3}/>
            <text
                x={position.x}
                y={position.y+5}
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