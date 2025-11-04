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

const getFillColor = (vertex, isSelected, isConnecting) => {
    if(vertex.mist) return fillColors.mist;
    if(isConnecting) return fillColors.connecting;
    if(isSelected) return fillColors.selected;
    return fillColors.default;
};

const getStrokeColor = (isSelected, isConnecting) => {
    if(isConnecting) return strokeColors.connecting;
    if(isSelected) return strokeColors.selected;
    return strokeColors.default;
};

// Draws geometric representation of a graph vertex (square for edge servers, circles for tasks and mist devices, and cloud)
const Vertex = ({ 
    vertex, 
    type,
    onMouseDown, 
    onContextMenu, 
    onMouseEnter, 
    onMouseLeave, 
    isSelected, 
    isConnecting}) => {

    const fill = getFillColor(vertex, isSelected, isConnecting);
    const stroke = getStrokeColor(isSelected, isConnecting);

    return (
        <g
            onMouseDown={onMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ cursor: "pointer" }}>

            {(type === "TASK" || type === "MIST") && 
            <circle
                cx={vertex.position.x}
                cy={vertex.position.y}
                r={30}
                fill={fill}
                stroke={stroke}
                strokeDasharray={isConnecting ? "4 2" : "none"}
                strokeWidth={3}/>}

            {type === "EDGE" && 
            <rect
                x={vertex.position.x - 30}
                y={vertex.position.y - 30}
                width={60}
                height={60}
                rx="10"
                ry="10"
                fill={fill}
                stroke={stroke}
                strokeDasharray={isConnecting ? "4 2" : "none"}
                strokeWidth={3}/>}

            {type === "CLOUD" &&   
            <path
                d={`
                M ${vertex.position.x - 40},${vertex.position.y}
                C ${vertex.position.x - 60},${vertex.position.y - 30} ${vertex.position.x - 10},${vertex.position.y - 40} ${vertex.position.x},${vertex.position.y - 20}
                C ${vertex.position.x + 20},${vertex.position.y - 50} ${vertex.position.x + 60},${vertex.position.y - 20} ${vertex.position.x + 40},${vertex.position.y}
                C ${vertex.position.x + 60},${vertex.position.y + 30} ${vertex.position.x + 10},${vertex.position.y + 40} ${vertex.position.x},${vertex.position.y + 20}
                C ${vertex.position.x - 20},${vertex.position.y + 40} ${vertex.position.x - 60},${vertex.position.y + 20} ${vertex.position.x - 40},${vertex.position.y}
                Z
                `}
                fill={fill}
                stroke={stroke}
                strokeWidth={3}
                strokeDasharray={isConnecting ? "4 2" : "none"}
            />}

            <text
                x={vertex.position.x}
                y={vertex.position.y+5}
                style={{ userSelect: "none" }}
                textAnchor="middle"
                fill={isSelected ? "#161616ff" : "#ebebebff"}
                fontSize="14"
                fontWeight="bold"
                pointerEvents="none">
                {vertex.label}
            </text>
        </g>
    );
};
export default Vertex;
