const EdgeServer = ({
    edge, 
    onMouseDown, 
    onContextMenu, 
    onMouseEnter, 
    onMouseLeave, 
    isSelected, 
    isConnecting
}) => {
    const size = 60; // total width/height
    const half = size / 2;

    const fill = isConnecting ? "#5f2e2eff" : isSelected ? "#949494ff" : "#161616ff";
    const stroke = isConnecting ? "#ff0000" : isSelected ? "#ffffffff" : "#727272ff";
    const textColor = isSelected ? "#161616ff" : "#ebebebff";

    return (
        <g
            onMouseDown={onMouseDown}
            onContextMenu={onContextMenu}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{ cursor: "pointer" }}>
            <rect
                x={edge.position.x - half}
                y={edge.position.y - half}
                width={size}
                height={size}
                rx="10"
                ry="10"
                fill={fill}
                stroke={stroke}
                strokeDasharray={isConnecting ? "4 2" : "none"}
                strokeWidth={3}/>

            <text
                x={edge.position.x}
                y={edge.position.y + 5}
                textAnchor="middle"
                fill={textColor}
                fontSize="14"
                fontWeight="bold"
                pointerEvents="none">
                {edge.label}
            </text>
        </g>
    );
};

export default EdgeServer;
