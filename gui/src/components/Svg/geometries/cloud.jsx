const Cloud = ({
  cloud,
  onMouseDown,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  isSelected,
  isConnecting
}) => {
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
      {/* Cloud shape */}
      <path
        d={`
          M ${cloud.position.x - 40},${cloud.position.y}
          C ${cloud.position.x - 60},${cloud.position.y - 30} ${cloud.position.x - 10},${cloud.position.y - 40} ${cloud.position.x},${cloud.position.y - 20}
          C ${cloud.position.x + 20},${cloud.position.y - 50} ${cloud.position.x + 60},${cloud.position.y - 20} ${cloud.position.x + 40},${cloud.position.y}
          C ${cloud.position.x + 60},${cloud.position.y + 30} ${cloud.position.x + 10},${cloud.position.y + 40} ${cloud.position.x},${cloud.position.y + 20}
          C ${cloud.position.x - 20},${cloud.position.y + 40} ${cloud.position.x - 60},${cloud.position.y + 20} ${cloud.position.x - 40},${cloud.position.y}
          Z
        `}
        fill={fill}
        stroke={stroke}
        strokeWidth={3}
        strokeDasharray={isConnecting ? "4 2" : "none"}
      />

      <text
        x={cloud.position.x}
        y={cloud.position.y + 5}
        textAnchor="middle"
        fill={textColor}
        fontSize="14"
        fontWeight="bold"
        pointerEvents="none">
        {cloud.label}
      </text>
    </g>
  );
};

export default Cloud;
