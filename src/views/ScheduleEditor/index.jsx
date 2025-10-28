import { useRef, useState } from "react";
import { 
    AppBar,
    Toolbar,
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
import { useScheduleContext } from "../../context/Schedule";
import { 
    AddCircle, 
    Delete, 
    ZoomIn, 
    ZoomOut, 
    RestartAlt,
    Upload,
    Download
} from "@mui/icons-material";
import { Task } from "../../model/schedule";


const View = () => {
  const { addTask, removeTask, connectTasks, getTasks, toGraph } = useScheduleContext();
  const [nodePositions, setNodePositions] = useState({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingNode, setDraggingNode] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const [nextTaskId, setNextTaskId] = useState(1);

  const tasks = getTasks();
  const { precedences } = toGraph();

  const handleAddTask = () => {
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
      const task = new Task(
        editingTask.id,
        editingTask.label,
        parseFloat(editingTask.C),
        parseFloat(editingTask.T),
        parseFloat(editingTask.D),
        parseFloat(editingTask.a),
        parseFloat(editingTask.M)
      );
      addTask(task);
      
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

  const handleNodeRightClick = (e, taskId) => {
    e.preventDefault();
    if (connectingFrom === null) {
      setConnectingFrom(taskId);
    } else if (connectingFrom !== taskId) {
      connectTasks(connectingFrom, taskId);
      setConnectingFrom(null);
    }
  };

  const handleMouseMove = (e) => {
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

  const handleSvgMouseDown = (e) => {
    if (e.button === 0 && !draggingNode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelectedNode(null);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDeleteNode = () => {
    if (selectedNode) {
      removeTask(selectedNode);
      setSelectedNode(null);
    }
  };

  return (
    <MainView>
        <Paper elevation={3} sx={{ height: 600, display: "flex", flexDirection: "column" }}>
            <Box style={{ backgroundColor: "#1976d2", color: "white", display: "flex", alignItems: "center", gap: "16px" }}>
                <Button onClick={handleAddTask} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px" }} title="Add Task">
                <AddCircle size={20} />
                </Button>
                <Button onClick={handleDeleteNode} disabled={!selectedNode} style={{ background: "none", border: "none", color: "white", cursor: selectedNode ? "pointer" : "not-allowed", padding: "8px", opacity: selectedNode ? 1 : 0.5 }} title="Delete Selected">
                <Delete size={20} />
                </Button>
                <Button onClick={handleZoomIn} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px" }} title="Zoom In">
                <ZoomIn size={20} />
                </Button>
                <Button onClick={handleZoomOut} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px" }} title="Zoom Out">
                <ZoomOut size={20} />
                </Button>
                <Button onClick={handleResetView} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px" }} title="Reset View">
                <RestartAlt size={20} />
                </Button>
            </Box>

            <AppBar position="static" color="default" elevation={1}>
                <Toolbar variant="dense">
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                        Tasks schedule editor
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Import / Export">
                            <IconButton onClick={()=>{}}>
                                <Upload />
                            </IconButton>
                        </Tooltip>
                        {/*<Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={()=>{}}>*/}
                        <MenuItem
                            onClick={() => {
                                closeMenu();
                                handleExport();
                                }}>
                            <Download fontSize="small" sx={{ mr: 1 }} /> Export JSON
                        </MenuItem>
                        <MenuItem>
                            <label style={{ cursor: "pointer", width: "100%" }}>
                            <input
                                type="file"
                                accept="application/json"
                                style={{ display: "none" }}
                                onChange={(ev) => {
                                const f = ev.target.files?.[0];
                                if (f) handleImport(f);
                                closeMenu();
                                }}
                            />
                            <Upload fontSize="small" sx={{ mr: 1 }} /> Import JSON
                            </label>
                        </MenuItem>
                        {/*</Menu>*/}
                    </Stack>
                </Toolbar>
            </AppBar>

            <Box style={{ flexGrow: 1, overflow: "hidden", position: "relative", backgroundColor: "#f5f5f5" }}>
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseDown={handleSvgMouseDown}
                    onMouseLeave={handleMouseUp}
                    style={{ cursor: isPanning ? "grabbing" : "grab" }}>
                    <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
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
                                strokeWidth={2}
                            />
                            <polygon
                                points={`${endX},${endY} ${endX - arrowLen * Math.cos(angle - arrowAngle)},${endY - arrowLen * Math.sin(angle - arrowAngle)} ${endX - arrowLen * Math.cos(angle + arrowAngle)},${endY - arrowLen * Math.sin(angle + arrowAngle)}`}
                                fill="#666"
                            />
                            </g>
                        );
                        })}

                        {tasks.map(task => {
                        const pos = nodePositions[task.id] || { x: 400, y: 300 };
                        const isSelected = selectedNode === task.id;
                        const isConnecting = connectingFrom === task.id;
                        
                        return (
                            <g
                            key={task.id}
                            onMouseDown={(e) => handleNodeMouseDown(e, task.id)}
                            onContextMenu={(e) => handleNodeRightClick(e, task.id)}
                            style={{ cursor: "pointer" }}
                            >
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={40}
                                fill={isConnecting ? "#ff9800" : isSelected ? "#2196f3" : "#4caf50"}
                                stroke={isSelected ? "#1976d2" : "#388e3c"}
                                strokeWidth={3}
                            />
                            <text
                                x={pos.x}
                                y={pos.y - 5}
                                textAnchor="middle"
                                fill="white"
                                fontSize="14"
                                fontWeight="bold"
                                pointerEvents="none"
                            >
                                {task.label}
                            </text>
                            <text
                                x={pos.x}
                                y={pos.y + 10}
                                textAnchor="middle"
                                fill="white"
                                fontSize="10"
                                pointerEvents="none"
                            >
                                C:{task.C} T:{task.T}
                            </text>
                            </g>
                        );
                        })}
                    </g>
                </svg>

                <Box style={{ position: "absolute", bottom: "16px", right: "16px", padding: "16px", borderRadius: "8px", fontSize: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", color:"black" }}>
                <Box style={{ marginBottom: "4px" }}>Left-click + drag: Move nodes</Box>
                <Box style={{ marginBottom: "4px" }}>Right-click: Connect tasks</Box>
                <Box style={{ marginBottom: "4px" }}>Canvas drag: Pan view</Box>
                <Box>Zoom: {(zoom * 100).toFixed(0)}%</Box>
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
                            onChange={(e) => setEditingTask({ ...editingTask, label: e.target.value })}/>
                        <TextField
                            label="Execution Time"
                            type="number"
                            value={editingTask?.C || 0}
                            onChange={(e) => setEditingTask({ ...editingTask, C: e.target.value })}/>
                        <TextField
                            label="Period"
                            type="number"
                            value={editingTask?.T || 0}
                            onChange={(e) => setEditingTask({ ...editingTask, T: e.target.value })}/>
                        <TextField
                            label="Deadline"
                            type="number"
                            value={editingTask?.D || 0}
                            onChange={(e) => setEditingTask({ ...editingTask, D: e.target.value })}/>
                        <TextField
                            label="Activation Time"
                            type="number"
                            value={editingTask?.a || 0}
                            onChange={(e) => setEditingTask({ ...editingTask, a: e.target.value })}/>
                        <TextField
                            label="Memory"
                            type="number"
                            value={editingTask?.M || 0}
                            onChange={(e) => setEditingTask({ ...editingTask, M: e.target.value })}/>
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