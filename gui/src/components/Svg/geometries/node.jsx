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

const getFillColor = (node, isSelected, isConnecting) => {
    if(node.mist) return fillColors.mist;
    if(isConnecting) return fillColors.connecting;
    if(isSelected) return fillColors.selected;
    return fillColors.default;
};

const getStrokeColor = (isSelected, isConnecting) => {
    if(isConnecting) return strokeColors.connecting;
    if(isSelected) return strokeColors.selected;
    return strokeColors.default;
};

// Draws geometric representation of a graph node (square for edge servers, circles for tasks and mist devices, and cloud)
const Node = ({ 
    node, 
    type,
    onMouseDown, 
    onContextMenu, 
    onMouseEnter, 
    onMouseLeave, 
    isSelected, 
    isConnecting}) => {

    const fill = getFillColor(node, isSelected, isConnecting);
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
                cx={node.position.x}
                cy={node.position.y}
                r={30}
                fill={fill}
                stroke={stroke}
                strokeDasharray={isConnecting ? "4 2" : "none"}
                strokeWidth={3}/>}

            {type === "EDGE" && 
            <rect
                x={node.position.x - 30}
                y={node.position.y - 30}
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
                M ${node.position.x - 40},${node.position.y}
                C ${node.position.x - 60},${node.position.y - 30} ${node.position.x - 10},${node.position.y - 40} ${node.position.x},${node.position.y - 20}
                C ${node.position.x + 20},${node.position.y - 50} ${node.position.x + 60},${node.position.y - 20} ${node.position.x + 40},${node.position.y}
                C ${node.position.x + 60},${node.position.y + 30} ${node.position.x + 10},${node.position.y + 40} ${node.position.x},${node.position.y + 20}
                C ${node.position.x - 20},${node.position.y + 40} ${node.position.x - 60},${node.position.y + 20} ${node.position.x - 40},${node.position.y}
                Z
                `}
                fill={fill}
                stroke={stroke}
                strokeWidth={3}
                strokeDasharray={isConnecting ? "4 2" : "none"}
            />}

            <text
                x={node.position.x}
                y={node.position.y+5}
                style={{ userSelect: "none" }}
                textAnchor="middle"
                fill={isSelected ? "#161616ff" : "#ebebebff"}
                fontSize="14"
                fontWeight="bold"
                pointerEvents="none">
                {node.label}
            </text>
        </g>
    );
};
export default Node;
