import { useRef, useState, useEffect } from "react";
import { 
    Box, 
    Paper
} from "@mui/material";
import MainView from "../../components/MainView";
import EditDialog from "./editDialog";
import AppBar from "./appBar";
import SidePanel from "./sidePanel";
import useToast from "../../hooks/useToast";
import {
  TaskCircle,
  Arrow,
  TaskTooltip
} from "../../components/Svg";
import {
  containerStyle,
  svgStyle,
  actionsTooltipStyle
} from "../../themes/common";
import { useScheduleContext } from "../../context/Model";
import TaskGenerator, {PRESETS} from "../../model/taskGenerator";
import GraphLayout from "../../model/graphLayout";
import { 
  importJSON, 
  exportJSON,
  saveToLocalStorage,
  loadFromLocalStorage 
} from "../../model/utils";


const View = () => {
  const { 
    addTask, 
    toTaskObject,
    getTask,
    getTasks, 
    getPrecedences,
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

  const tasks = [...getTasks()];
  const precedences = getPrecedences();

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
  }, [precedences, toGraph]);

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
      // Initial position is random
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
    // Apply graph layout to organize nodes
    const svgRect = svgRef.current?.getBoundingClientRect();
    const viewportDimensions = svgRect ? { 
      width: svgRect.width, 
      height: svgRect.height 
    } : null;
    const layout = new GraphLayout({
      width: viewportDimensions?.width || 1200,
      height: viewportDimensions?.height || 800,
      horizontalSpacing: 150,
      verticalSpacing: 100
    });
    layout.applyLayout(schedule);
    // Add generated tasks to current schedule
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
            
            <SidePanel
              tasks={tasks}
              precedences={precedences}
              selectedNode={selectedNode}
              connectingFrom={connectingFrom}
              handleAddTask={handleAddTask}
              handleStartConnecting={handleStartConnecting}
              setEditingTask={setEditingTask}
              setDialogOpen={setDialogOpen}
              removeTask={removeTask}
              disconnectTasks={disconnectTasks}
              getTask={getTask} />

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

                  
                  {precedences.map(({from, to}, idx) => (
                      <Arrow
                        key={idx}
                        from={from.position}
                        to={to.position} />
                    ))}
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