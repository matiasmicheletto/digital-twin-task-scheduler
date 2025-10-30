import React, { useRef, useState, useEffect } from "react";
import { 
    List,
    ListItem,
    ListItemText,
    Divider,
    Box, 
    Stack,
    Paper,
    Typography,
    Tooltip,
    IconButton
} from "@mui/material";
import { 
    AddCircle, 
    Delete, 
    Link,
    Edit
} from "@mui/icons-material";
import MainView from "../../components/MainView";
import EditDialog from "./editDialog";
import AppBar from "./appBar";
import useToast from "../../hooks/useToast";
import {
  TaskCircle,
  Arrow,
  TaskTooltip
} from "./geometries";
import { useScheduleContext } from "../../context/Model";
import TaskGenerator, {PRESETS} from "../../model/taskGenerator";
import { 
  importJSON, 
  exportJSON,
  saveToLocalStorage,
  loadFromLocalStorage 
} from "../../model/utils";
import classes from './style.module.css';


const containerStyle = { 
  position: "absolute",
  top: "64px", // Below the navigation bar
  left: 0,
  width: "calc(100% - 20px)",
  flexDirection: "column",
  height: "calc(100vh - 84px)", // Full height minus small margins
  margin: "10px", // Small margin around the entire component
  overflow: "hidden" // Prevent Paper from scrolling
};

const sidePanelStyle = { 
  width: 400, 
  borderRight: "1px solid #444", 
  p: 1,
  height: "calc(100vh - 132px)", // Full height minus toolbars
  overflowY: "auto",
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column"
};

const svgStyle = { // Full size SVG canvas
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 0
};

const actionsTooltipStyle = { // Help box in canvas
  position: "fixed", 
  bottom: 0, 
  right: 0, 
  margin: "20px",
  padding: "16px", 
  borderRadius: "8px", 
  fontSize: "12px", 
  boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
};



const View = () => {
  const { 
    addTask, 
    toTaskObject,
    getTask, 
    removeTask, 
    deleteSchedule,
    connectTasks, 
    disconnectTasks,
    toGraph,
    fromGraph 
  } = useScheduleContext();

  const toast = useToast();

  // Canvas
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Interactions (ids)
  const [draggingNode, setDraggingNode] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Task parameteres editing dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [nextTaskId, setNextTaskId] = useState(1); // For generating new task IDs

  const { tasks, precedences } = toGraph();


  useEffect(() => { // Auto-save to localStorage
    const autoSaveData = () => {
      const svgRect = svgRef.current?.getBoundingClientRect();
      const viewportDimensions = svgRect ? { 
        width: svgRect.width, 
        height: svgRect.height 
      } : null;
      
      const scheduleData = {
        ...toGraph(),
        viewportDimensions
      };
      
      saveToLocalStorage('savedSchedules', scheduleData);
      console.log('Auto-saved schedule to localStorage');
    };

    // Auto-save when tasks or positions change (including when cleared)
    const timeoutId = setTimeout(autoSaveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [tasks, precedences, toGraph]);

  useEffect(() => { // Load saved data on component mount
    const savedData = loadFromLocalStorage('savedSchedules');
    if (savedData && savedData.tasks && savedData.tasks.length > 0) {
      try {
        fromGraph(savedData);
        
        // Update next task ID based on loaded tasks
        const maxId = savedData.tasks.reduce((max, task) => {
          const idNum = parseInt(task.id.replace('T', ''));
          return isNaN(idNum) ? max : Math.max(max, idNum);
        }, 0);
        setNextTaskId(maxId + 1);
        handleResetView();
        toast("Loaded saved schedule from previous session", "info");
      } catch (error) {
        console.error('Failed to load saved schedule:', error);
        toast("Failed to load saved schedule: " + error.message, "error");
        localStorage.removeItem('savedSchedules');
      }
    }
  }, [fromGraph]);

  const handleResetView = () => { // Reset pan and zoom to fit all nodes
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      // Calculate bounding box of all nodes
      const pos = tasks.map(t => t.position);
      if (pos.length === 0) return;
      const xs = pos.map(p => p.x);
      const ys = pos.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const nodesWidth = maxX - minX + 80; // + node diameter
      const nodesHeight = maxY - minY + 80; // + node diameter
      const scaleX = svgRect.width / nodesWidth;
      const scaleY = svgRect.height / nodesHeight;
      const newZoom = Math.min(scaleX, scaleY, 1);
      setZoom(newZoom);
      setPan({
        x: (svgRect.width - nodesWidth * newZoom) / 2 - minX * newZoom + 40 * newZoom,
        y: (svgRect.height - nodesHeight * newZoom) / 2 - minY * newZoom + 40 * newZoom
      });
    }
  };

  const handleAddTask = () => { // Add a task with default initial parameters
    setEditingTask({
      id: `T${nextTaskId}`,
      label: `Task ${nextTaskId}`,
      mist: false,
      C: 1,
      T: 10,
      D: 10,
      a: 0,
      M: 1
    });
    setDialogOpen(true);
  };

  const handleSaveTask = () => { // Save task after completing form
    if (editingTask) {
      try {
        addTask(toTaskObject(editingTask)); // Overwrites if id exists
        setNextTaskId(prev => prev + 1);
        setDialogOpen(false);
        setEditingTask(null);
        handleResetView();
        toast("Task saved successfully", "success");
      } catch (error) {
        toast(error.message, "error");
      }
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
    e.preventDefault();
    e.stopPropagation();
    if (connectingFrom === null) {
      setConnectingFrom(taskId);
    } else {
      if (connectingFrom !== taskId) {
        try{
          connectTasks(connectingFrom, taskId);
          setConnectingFrom(null);
        } catch (error) {
          toast(error.message, "error");
        }
      }
    }
  };

  const handleMouseMove = e => {
    if (draggingNode) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      getTask(draggingNode).setPosition(x, y);      
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

  const handleStartConnecting = (e, n) => {
    e.stopPropagation(); 
    if(connectingFrom) 
      setConnectingFrom(null); 
    else 
      setConnectingFrom(n.id);
  };

  const handleDeleteTasks = () => {
    deleteSchedule();
    setNextTaskId(1);
    setSelectedNode(null);
  };

  const handleGenerateTasks = () => {
    deleteSchedule();
    const generator = new TaskGenerator(PRESETS.medium); // Random task set generator
    const schedule = generator.generate(); // Generate random schedule
    fromGraph(schedule.toGraph());
  };

  const handleExport = () => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    const viewportDimensions = svgRect ? { 
      width: svgRect.width, 
      height: svgRect.height 
    } : null;
    exportJSON({...toGraph(), viewportDimensions});
  };

  const handleImport = file => {
    importJSON(file).then(data => {
      try{
        fromGraph(data);
        handleResetView();
        toast("Imported schedule successfully", "success");
      } catch (error) {
        toast(error.message, "error");
      }
    });
  };

  return (
    <MainView>
        <Paper elevation={3} sx={containerStyle}>
          <AppBar
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            handleResetView={handleResetView}
            handleDeleteTasks={handleDeleteTasks}
            handleGenerateTasks={handleGenerateTasks}
            handleExport={handleExport}
            handleImport={handleImport}/>

          <Box sx={{ display: "flex", flex: 1, height: "100%" }}>
            <Box sx={sidePanelStyle} className={classes.sidePanel}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <Typography variant="subtitle1" sx={{fontWeight: "bold"}}>Tasks</Typography>
                <Tooltip title="Add task">
                    <IconButton color="primary" onClick={handleAddTask}>
                        <AddCircle />
                    </IconButton>
                </Tooltip>
              </Box>

              <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
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
                        <ListItemText primary={`${n.label} - ${n.mist ? "Mist" : "Edge/Cloud"}`} secondary={`id: ${n.id} (C:${n.C} T:${n.T} D:${n.D} a:${n.a} M:${n.M})`} />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>

                <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                    Precedences
                </Typography>

                <List dense>
                    {precedences.map(e => (
                      <ListItem key={e.id} secondaryAction={
                        <IconButton onClick={() => disconnectTasks(e.from, e.to)} size="small">
                          <Delete fontSize="small"/>
                        </IconButton>
                      }>
                      <ListItemText primary={`${getTask(e.from)?.label ?? e.from} → ${getTask(e.to)?.label ?? e.to}`} secondary={`id: ${e.id}`} />
                      </ListItem>
                    ))}
                </List>
              </Box>
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
                  <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                    
                    {tasks.map(task => (
                      <g key={task.id}>
                        <TaskCircle
                          task={task}                          
                          isSelected={selectedNode === task.id}
                          isConnecting={connectingFrom === task.id}
                          onMouseDown={e => handleNodeMouseDown(e, task.id)}
                          onContextMenu={e => handleNodeContextMenu(e, task.id)}
                          onMouseEnter={() => setHoveredNode(task.id)}
                          onMouseLeave={() => setHoveredNode(null)} />

                        {hoveredNode === task.id && !draggingNode &&
                          <TaskTooltip task={task} position={task.position} />
                        }
                      </g>
                    )
                  )}

                  {precedences.map((prec, idx) => (
                      <Arrow 
                        key={idx} 
                        from={getTask(prec.from).position} 
                        to={getTask(prec.to).position} />
                    )
                  )}
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

        <EditDialog
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
            editingTask={editingTask}
            setEditingTask={setEditingTask}
            handleSaveTask={handleSaveTask}
        />
      </Paper>
    </MainView>
  );
};

export default View;