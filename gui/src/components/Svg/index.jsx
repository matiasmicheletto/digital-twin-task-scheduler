
import { useState } from "react";
import { Box } from "@mui/material";
import {
  Arrow,
  TaskTooltip,
  NodeTooltip,
  Vertex
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
        vertices,
        edges,
        selectedVertex,
        connectingFrom,
        handleVertexMouseDown,
        handleVertexContextMenu,
        handleArrowMouseDown,
        draggingVertex
    } =  props;

    const [hoveredNode, setHoveredVertex] = useState(null);

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
                    {vertices.map(vertex => (
                        <Vertex
                            type={vertex.type}
                            key={vertex.id}
                            vertex={vertex}
                            isSelected={selectedVertex === vertex.id}
                            isConnecting={connectingFrom === vertex.id}
                            onMouseDown={e => handleVertexMouseDown(e, vertex.id)}
                            onContextMenu={e => handleVertexContextMenu(e, vertex.id)}
                            onMouseEnter={() => setHoveredVertex(vertex.id)}
                            onMouseLeave={() => setHoveredVertex(null)} />
                    ))}
        
                    {edges.map((edge, idx) => (
                        <Arrow
                            onMouseDown={e => handleArrowMouseDown(e, edge.id)}
                            key={idx}
                            from={edge.from?.position}
                            to={edge.to?.position}
                            weight={edge.delay} />
                    ))}

                    {vertices.map(vertex => (// Render tooltips last to be on top
                        hoveredNode === vertex.id && !draggingVertex &&
                            (vertex.type==="TASK" ? 
                            <TaskTooltip key={vertex.id} task={vertex} position={vertex.position} />
                            :
                            <NodeTooltip key={vertex.id} node={vertex} position={vertex.position} />
                            )   
                    ))
                    }
                </g>
            </svg>

            <Box style={actionsTooltipStyle}>
                <Box style={{ marginBottom: "4px" }}>Left-click + drag: Move vertices</Box>
                <Box style={{ marginBottom: "4px" }}>Right-click: Connect vertices</Box>
                <Box style={{ marginBottom: "4px" }}>Canvas drag: Pan view</Box>
                <Box>Zoom: {(zoom * 100).toFixed(0)}%</Box>
            </Box>
        </Box>
    );
};

export default SvgCanvas;