
import { useState } from "react";
import { Box } from "@mui/material";
import {
  TaskCircle,
  Arrow,
  TaskTooltip
} from "./geometries";
import {
  svgStyle,
  actionsTooltipStyle
} from "../../themes/common";


const SvgCanvas = props => {

    const {
        svgRef,
        pan,
        zoom,
        isPanning,
        handleMouseMove,
        handleMouseUp,
        handleSvgMouseDown,
        handleSvgContextMenu,
        nodes,
        edges,
        selectedNode,
        connectingFrom,
        handleNodeMouseDown,
        handleNodeContextMenu,
        draggingNode
    } =  props;

    const [hoveredNode, setHoveredNode] = useState(null);

    return (
        <Box sx={{ flexGrow: 1, overflow: "hidden", position: "relative"}}>
            <svg
                ref={svgRef}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseDown={handleSvgMouseDown}
                onMouseLeave={handleMouseUp}
                onContextMenu={handleSvgContextMenu}
                style={{ cursor: isPanning ? "grabbing" : "grab", ...svgStyle }}>
                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    {nodes.map(task => (
                        <TaskCircle
                            key={task.id}
                            task={task}
                            isSelected={selectedNode === task.id}
                            isConnecting={connectingFrom === task.id}
                            onMouseDown={e => handleNodeMouseDown(e, task.id)}
                            onContextMenu={e => handleNodeContextMenu(e, task.id)}
                            onMouseEnter={() => setHoveredNode(task.id)}
                            onMouseLeave={() => setHoveredNode(null)} />
                    ))}
        
                    {edges.map(({from, to}, idx) => (
                        <Arrow
                            key={idx}
                            from={from.position}
                            to={to.position} />
                    ))}

                    {nodes.map(task => (// Render tooltips last to be on top
                        hoveredNode === task.id && !draggingNode &&
                            <TaskTooltip key={task} task={task} position={task.position} />
                    ))
                    }
                </g>
            </svg>

            <Box style={actionsTooltipStyle}>
                <Box style={{ marginBottom: "4px" }}>Left-click + drag: Move nodes</Box>
                <Box style={{ marginBottom: "4px" }}>Right-click: Connect nodes</Box>
                <Box style={{ marginBottom: "4px" }}>Canvas drag: Pan view</Box>
                <Box>Zoom: {(zoom * 100).toFixed(0)}%</Box>
            </Box>
        </Box>
    );
};

export default SvgCanvas;