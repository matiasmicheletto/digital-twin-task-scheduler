import { NODE_TYPE_LABELS } from "../../../../../shared/network";

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

const NodeTooltip = ({ node, position }) => (
    <g>
        <rect
            x={position.x+10}
            y={position.y}
            width={100}
            height={140}
            fill="white"
            stroke="black"
            strokeWidth={2}/>
        <ParamText x={position.x+20} y={position.y + 20} text={`ID: ${node.id}`} />
        <ParamText x={position.x+20} y={position.y + 40} text={`Name: ${node.label}`} />
        <ParamText x={position.x+20} y={position.y + 60} text={`Type: ${NODE_TYPE_LABELS[node.type]}`} />
        <ParamText x={position.x+20} y={position.y + 80} text={`Mem: ${node.memory}`} />
        <ParamText x={position.x+20} y={position.y + 100} text={`U: ${node.u}`} />
    </g>
);

export default NodeTooltip;