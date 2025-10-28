import React, { useRef, useState } from "react";
import { 
    AppBar,
    Toolbar,
    List,
    ListItem,
    ListItemText,
    Divider,
    Box, 
    Button, 
    TextField,
    Stack,
    DialogTitle,
    DialogContent,
    DialogActions, 
    Dialog,
    Paper,
    Typography,
    Tooltip,
    IconButton,
    Menu,
    MenuItem
} from "@mui/material";
import MainView from "../../components/MainView";
import { useScheduleContext } from "../../context/Model";
import { 
    AddCircle, 
    Delete, 
    ZoomIn, 
    ZoomOut, 
    RestartAlt,
    Upload,
    Download,
    Link,
    Edit
} from "@mui/icons-material";
import { importJSON, exportJSON } from "../../model/utils";


const svgStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 0
};

const actionsTooltipStyle = { 
  position: "absolute", 
  bottom: "16px", 
  right: "16px", 
  padding: "16px", 
  borderRadius: "8px", 
  fontSize: "12px", 
  boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
}

const View = () => {
  const { 
    addTask, 
    toTaskObject,
    getTask, 
    removeTask, 
    connectTasks, 
    disconnectTasks,
    toGraph,
    fromGraph 
  } = useScheduleContext();

  // Map
  const svgRef = useRef(null);
  const [nodePositions, setNodePositions] = useState({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Interaction (ids)
  const [draggingNode, setDraggingNode] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Editing dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [nextTaskId, setNextTaskId] = useState(1);

  const { tasks, precedences } = toGraph(); // For display purposes, no positions needed

  const handleAddTask = () => { // Initial values
    setEditingTask({
      id: `T${nextTaskId}`,
      label: `Task ${nextTaskId}`,
      C: 1,
      T: 10,
      D: 10,
      a: 0,
      M: 1
    });
    setDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (editingTask) {
      addTask(toTaskObject(editingTask));
      
      if (!nodePositions[editingTask.id]) {
        setNodePositions(prev => ({
          ...prev,
          [editingTask.id]: {
            x: 400 + Math.random() * 200,
            y: 300 + Math.random() * 200
          }
        }));
      }
      
      setNextTaskId(prev => prev + 1);
      setDialogOpen(false);
      setEditingTask(null);
    }
  };

  const handleNodeMouseDown = (e, taskId) => {
    if (e.button === 0) {
      e.stopPropagation();
      setDraggingNode(taskId);
      setSelectedNode(taskId);
    }
  };

  const handleNodeContextMenu = (e, taskId) => {
    console.log(connectingFrom);
    e.preventDefault();
    e.stopPropagation();
    if (connectingFrom === null) {
      setConnectingFrom(taskId);
    } else {
      if (connectingFrom !== taskId) {
        connectTasks(connectingFrom, taskId);
        setConnectingFrom(null);
      }
    }
  };

  const handleMouseMove = e => {
    if (draggingNode) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setNodePositions(prev => ({
        ...prev,
        [draggingNode]: { x, y }
      }));
    } else if (isPanning) {
      setPan({
        x: pan.x + (e.clientX - panStart.x),
        y: pan.y + (e.clientY - panStart.y)
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDraggingNode(null);
    setIsPanning(false);
  };

  const handleSvgMouseDown = e => {
    if (e.button === 0 && !draggingNode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelectedNode(null);
    }
    if(e.target.tagName === 'svg' || e.target.tagName === 'g')
      setConnectingFrom(null);
  };

  const handleSvgContextMenu = e => {
    e.preventDefault();
    // Only cancel connection if right-clicking on empty canvas (not on a node)
    if (e.target.tagName === 'svg' || e.target.tagName === 'g') {
      setConnectingFrom(null);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleStartConnecting = (e, n) => {
    e.stopPropagation(); 
    if(connectingFrom) 
      setConnectingFrom(null); 
    else 
      setConnectingFrom(n.id);
  };

  const handleDeleteTask = () => {
    if (selectedNode) {
      removeTask(selectedNode);
      setNodePositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[selectedNode];
        return newPositions;
      });
      setSelectedNode(null);
    }
  };

  const handleExport = () => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    const viewportDimensions = svgRect ? { 
      width: svgRect.width, 
      height: svgRect.height 
    } : null;
    exportJSON({...toGraph(), nodePositions, viewportDimensions});
  };

  const handleImport = file => {
    importJSON(file).then(data => {
      const svgRect = svgRef.current?.getBoundingClientRect();
      const viewportDimensions = svgRect ? { 
        width: svgRect.width, 
        height: svgRect.height 
      } : null;
      
      const newPositions = {...nodePositions}; // Previous positions
      if (data.nodePositions && viewportDimensions) {
        Object.keys(data.nodePositions).forEach(taskId => {
          const pos = data.nodePositions[taskId];
          newPositions[taskId] = {
            x: pos.x,
            y: pos.y
          };    
        });
      }

      fromGraph(data);
      setNodePositions(newPositions);
    });
  };

  const openMenu = e => {
    setAnchorEl(e.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  return (
    <MainView>
        <Paper elevation={3} sx={{ minHeight: 400, display: "flex", flexDirection: "column" }}>
            <AppBar position="static" color="default" elevation={1}>
                <Toolbar variant="dense">
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Tasks schedule editor
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Zoom In">
                            <IconButton onClick={handleZoomIn}>
                              <ZoomIn/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Zoom Out">
                            <IconButton onClick={handleZoomOut}>
                                <ZoomOut/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Reset View">
                            <IconButton onClick={handleResetView}>
                              <RestartAlt/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Selected Task">
                            <IconButton onClick={handleDeleteTask} disabled={!selectedNode}>
                                <Delete/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Import / Export">
                            <IconButton onClick={openMenu}>
                                <Download />
                            </IconButton>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
                          <MenuItem>
                              <label style={{ cursor: "pointer", width: "100%" }}>
                              <input
                                  type="file"
                                  accept="application/json"
                                  style={{ display: "none" }}
                                  onChange={ev => {
                                    const f = ev.target.files?.[0];
                                    if (f) 
                                      handleImport(f);
                                    closeMenu();
                                  }}/>
                              <Upload fontSize="small" sx={{ mr: 1 }} /> Import JSON
                              </label>
                          </MenuItem>
                          <MenuItem onClick={() => {closeMenu(); handleExport();}}>
                              <Download fontSize="small" sx={{ mr: 1 }} /> Export JSON
                          </MenuItem>
                        </Menu>
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box sx={{ display: "flex", flex: 1 }}>
              <Box sx={{ width: 350, borderRight: "1px solid #eee", p: 1, overflow: "auto" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="subtitle1">Tasks</Typography>
                      <Tooltip title="Add task">
                          <IconButton color="primary" onClick={handleAddTask}>
                              <AddCircle/>
                          </IconButton>
                      </Tooltip>
                  </Box>
                  <List dense>
                      {tasks.map(n => (
                          <React.Fragment key={n.id}>
                              <ListItem
                                selected={selectedNode === n.id}
                                sx={{ 
                                  cursor: "pointer", 
                                  backgroundColor: selectedNode === n.id ? "#000" : (connectingFrom === n.id ? "#666" : "inherit") }}
                                secondaryAction={
                                    <Stack direction="row" spacing={1}>
                                      <IconButton edge="end" onClick={e => handleStartConnecting(e, n)} size="small">
                                          <Link fontSize="small" />
                                      </IconButton>
                                      <IconButton edge="end" onClick={() => {setEditingTask(n); setDialogOpen(true);}} size="small">
                                          <Edit fontSize="small" />
                                      </IconButton>
                                      <IconButton edge="end" onClick={() => removeTask(n.id)} size="small">
                                          <Delete fontSize="small" />
                                      </IconButton>
                                    </Stack>
                                }>
                                <ListItemText primary={`${n.label} (C:${n.C} T:${n.T} D:${n.D} a:${n.a} M:${n.M})`} secondary={`id: ${n.id}`} />
                              </ListItem>
                              <Divider />
                          </React.Fragment>
                      ))}
                  </List>

                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                      Precedences
                  </Typography>
                  <List dense>
                      {precedences.map(e => (
                        <ListItem key={e.id} secondaryAction={<IconButton onClick={() => disconnectTasks(e.from, e.to)} size="small"><Delete fontSize="small"/></IconButton>}>
                            <ListItemText primary={`${getTask(e.from)?.label ?? e.from} → ${getTask(e.to)?.label ?? e.to}`} secondary={`id: ${e.id}`} />
                        </ListItem>
                      ))}
                  </List>
              </Box>

              <Box style={{ flexGrow: 1, overflow: "hidden", position: "relative"}}>
                  <svg
                      ref={svgRef}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseDown={handleSvgMouseDown}
                      onMouseLeave={handleMouseUp}
                      onContextMenu={handleSvgContextMenu}
                      style={{ cursor: isPanning ? "grabbing" : "grab", ...svgStyle }}>
                      <g 
                        transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                          {precedences.map((prec, idx) => {
                            const from = nodePositions[prec.from];
                            const to = nodePositions[prec.to];
                            if (!from || !to) return null;
                            
                            const dx = to.x - from.x;
                            const dy = to.y - from.y;
                            const len = Math.sqrt(dx * dx + dy * dy);
                            const ux = dx / len;
                            const uy = dy / len;
                            
                            const startX = from.x + ux * 40;
                            const startY = from.y + uy * 40;
                            const endX = to.x - ux * 40;
                            const endY = to.y - uy * 40;
                            
                            const arrowLen = 10;
                            const arrowAngle = Math.PI / 6;
                            const angle = Math.atan2(dy, dx);
                            
                            return (
                                <g key={idx}>
                                  <line
                                      x1={startX}
                                      y1={startY}
                                      x2={endX}
                                      y2={endY}
                                      stroke="#666"
                                      strokeWidth={2}/>
                                  <polygon
                                      points={`${endX},${endY} ${endX - arrowLen * Math.cos(angle - arrowAngle)},${endY - arrowLen * Math.sin(angle - arrowAngle)} ${endX - arrowLen * Math.cos(angle + arrowAngle)},${endY - arrowLen * Math.sin(angle + arrowAngle)}`}
                                      fill="#666"/>
                                </g>
                            );
                            })
                          }

                          {tasks.map(task => {
                            const pos = nodePositions[task.id] || { x: 400, y: 300 };
                            const isSelected = selectedNode === task.id;
                            const isConnecting = connectingFrom === task.id;
                            
                            return (
                              <g key={task.id}>
                                <g
                                  onMouseDown={e => handleNodeMouseDown(e, task.id)}
                                  onContextMenu={e => handleNodeContextMenu(e, task.id)}
                                  onMouseEnter={() => setHoveredNode(task.id)}
                                  onMouseLeave={() => setHoveredNode(null)}
                                  style={{ cursor: "pointer" }}>
                                  <circle
                                      cx={pos.x}
                                      cy={pos.y}
                                      r={30}
                                      fill={isConnecting ? "#5f2e2eff" : isSelected ? "#949494ff" : "#161616ff"}
                                      stroke={isConnecting ? "#ff0000" : isSelected ? "#ffffffff" : "#727272ff"}
                                      strokeDasharray={isConnecting ? "4 2" : "none"}
                                      strokeWidth={3}/>
                                  <text
                                      x={pos.x}
                                      y={pos.y+5}
                                      textAnchor="middle"
                                      fill={isSelected ? "#161616ff" : "#ebebebff"}
                                      fontSize="14"
                                      fontWeight="bold"
                                      pointerEvents="none">
                                      {task.label}
                                  </text>
                                </g>
                                {hoveredNode === task.id && !draggingNode &&
                                  <g>
                                    <rect
                                      x={pos.x-15}
                                      y={pos.y}
                                      width={80}
                                      height={140}
                                      fill="white"
                                      stroke="black"
                                      strokeWidth={2}/>
                                    <text
                                        x={pos.x}
                                        y={pos.y + 20}
                                        textAnchor="start"
                                        fill="black"
                                        fontSize="12"
                                        pointerEvents="none">
                                        {`id: ${task.id}`}
                                    </text>
                                    <text
                                        x={pos.x}
                                        y={pos.y + 40}
                                        textAnchor="start"
                                        fill="black"
                                        fontSize="12"
                                        pointerEvents="none">
                                        {`C: ${task.C}`}
                                    </text>
                                    <text
                                        x={pos.x}
                                        y={pos.y + 60}
                                        textAnchor="start"
                                        fill="black"
                                        fontSize="12"
                                        pointerEvents="none">
                                        {`T: ${task.T}`}
                                    </text>
                                    <text
                                        x={pos.x}
                                        y={pos.y + 80}
                                        textAnchor="start"
                                        fill="black"
                                        fontSize="12"
                                        pointerEvents="none">
                                        {`D: ${task.D}`}
                                    </text>
                                    <text
                                        x={pos.x}
                                        y={pos.y + 100}
                                        textAnchor="start"
                                        fill="black"
                                        fontSize="12"
                                        pointerEvents="none">
                                        {`a: ${task.a}`}
                                    </text>
                                    <text
                                        x={pos.x}
                                        y={pos.y + 120}
                                        textAnchor="start"
                                        fill="black"
                                        fontSize="12"
                                        pointerEvents="none">
                                        {`M: ${task.M}`}
                                    </text>
                                  </g>
                                }
                              </g>
                            );
                          })
                        }
                      </g>
                  </svg>

                  <Box style={actionsTooltipStyle}>
                  <Box style={{ marginBottom: "4px" }}>Left-click + drag: Move nodes</Box>
                  <Box style={{ marginBottom: "4px" }}>Right-click: Connect tasks</Box>
                  <Box style={{ marginBottom: "4px" }}>Canvas drag: Pan view</Box>
                  <Box>Zoom: {(zoom * 100).toFixed(0)}%</Box>
                  </Box>
              </Box>
            </Box>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Task ID"
                            type="text"
                            value={editingTask?.id || ""}
                            disabled/>
                        <TextField
                            label="Label"
                            type="text"
                            value={editingTask?.label || ""}
                            onChange={e => setEditingTask({ ...editingTask, label: e.target.value })}/>
                        <TextField
                            label="Execution Time"
                            type="number"
                            value={editingTask?.C || 0}
                            onChange={e => setEditingTask({ ...editingTask, C: e.target.value })}/>
                        <TextField
                            label="Period"
                            type="number"
                            value={editingTask?.T || 0}
                            onChange={e => setEditingTask({ ...editingTask, T: e.target.value })}/>
                        <TextField
                            label="Deadline"
                            type="number"
                            value={editingTask?.D || 0}
                            onChange={e => setEditingTask({ ...editingTask, D: e.target.value })}/>
                        <TextField
                            label="Activation Time"
                            type="number"
                            value={editingTask?.a || 0}
                            onChange={e => setEditingTask({ ...editingTask, a: e.target.value })}/>
                        <TextField
                            label="Memory"
                            type="number"
                            value={editingTask?.M || 0}
                            onChange={e => setEditingTask({ ...editingTask, M: e.target.value })}/>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveTask} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Paper>
    </MainView>
  );
};

export default View;