import { useRef, useState, useEffect } from "react";
import { 
    Box, 
    Paper
} from "@mui/material";
import MainView from "../../components/MainView";
import SvgCanvas from "../../components/Svg";
import EditDialog from "../../components/EditDialog";
import AppBar from "../../components/AppBar";
import SidePanel from "../../components/SidePanel";
import useToast from "../../hooks/useToast";
import { containerStyle } from "../../themes/common";
import { useScheduleContext, useNetworkContext } from "../../context/Model";
import TaskGenerator from "../../../../shared/taskGenerator.js";
import { Task } from "../../../../shared/schedule.js";
import GraphLayout from "../../../../shared/graphLayout.js";
import { 
  importJSON, 
  exportJSON,
  saveToLocalStorage,
  loadFromLocalStorage 
} from "../../model/utils";


const taskEditDialogConfig = {
    title: "Edit Task",
    fields: [
        {
            attrName: "id",
            label: "Task ID",
            type: "text",
            disabled: true
        },
        {
            attrName: "label",
            label: "Label",
            type: "text"
        },
        {
            attrName: "C",
            label: "Execution Time",
            type: "number"
        },
        {
            attrName: "mist",
            labelTrue: "Mist Task",
            labelFalse: "Edge/Cloud Task",
            type: "switch"
        },
        {
            attrName: "T",
            label: "Period",
            type: "number"
        },
        {
            attrName: "D",
            label: "Deadline",
            type: "number"
        },
        {
            attrName: "a",
            label: "Activation Time",
            type: "number"
        },
        {
            attrName: "M",
            label: "Memory Requirement",
            type: "number"
        }
    ]
};

const nodeEditDialogConfig = {
    title: "Edit Node",
    fields: [
        {
            attrName: "id",
            label: "Node ID",
            type: "text",
            disabled: true
        },
        {
            attrName: "label",
            label: "Label",
            type: "text"
        },
        {
            attrName: "type",
            label: "Node Type",
            type: "select",
            options: [
                { value: "edge", text: "Edge Server" },
                { value: "cloud", text: "Cloud Server" }
            ]
        },
        {
            attrName: "m",
            label: "Memory",
            type: "text"
        },
        {
            attrName: "u",
            label: "Utilization",
            type: "text"
        }
    ]
};

const View = () => {
  const { 
    addTask, 
    getTask,
    getTasks, 
    getPrecedences,
    removeTask, 
    deleteSchedule,
    connectTasks, 
    disconnectTasks,
    scheduleToGraph,
    scheduleFromGraph 
  } = useScheduleContext();

  const {
    addNode,
    removeVertex,
    connectNodes,
    disconnectVertices,
    getNode,
    networkToGraph,
    networkFromGraph
  } = useNetworkContext();

  const toast = useToast();

  // Canvas
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Interactions (ids)
  const [draggingVertex, setDraggingVertex] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [selectedVertex, setSelectedVertex] = useState(null);
  
  // Task parameteres editing dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVertex, setEditingVertex] = useState(null);

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
        ...scheduleToGraph(),
        viewportDimensions
      };

      saveToLocalStorage('savedSchedules', scheduleData);
      console.log('Auto-saved schedule to localStorage');
    };

    // Auto-save when tasks or positions change (including when cleared)
    const timeoutId = setTimeout(autoSaveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [tasks, precedences, scheduleToGraph]);

  useEffect(() => { // Load saved data on component mount
    const savedSchedules = loadFromLocalStorage('savedSchedules');
    if (savedSchedules && savedSchedules.tasks && savedSchedules.tasks.length > 0) {
      try {
        scheduleFromGraph(savedSchedules);
        handleResetView();
        toast("Loaded saved schedule from previous session", "info");
      } catch (error) {
        console.error('Failed to load saved schedule:', error);
        toast("Failed to load saved schedule: " + error.message, "error");
        localStorage.removeItem('savedSchedules');
      }
    }
  }, [scheduleFromGraph]);

  const handleResetView = () => { // Reset pan and zoom to fit all vertices
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      // Calculate bounding box of all vertices
      const pos = tasks.map(t => t.position);
      if (pos.length === 0) return;
      const xs = pos.map(p => p.x);
      const ys = pos.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const vertexWidth = maxX - minX + 80; // + vertex diameter
      const vertexHeight = maxY - minY + 80; // + vertex diameter
      const scaleX = svgRect.width / vertexWidth;
      const scaleY = svgRect.height / vertexHeight;
      const newZoom = Math.min(scaleX, scaleY, 1);
      setZoom(newZoom);
      setPan({
        x: (svgRect.width - vertexWidth * newZoom) / 2 - minX * newZoom + 40 * newZoom,
        y: (svgRect.height - vertexHeight * newZoom) / 2 - minY * newZoom + 40 * newZoom
      });
    }
  };

  const handleSaveVertex = () => { // Save task after completing form
    if (editingVertex) {
      try {
        addTask(Task.fromObject(editingVertex)); // Overwrites if id exists
        setDialogOpen(false);
        setEditingVertex(null);
        handleResetView();
        toast("Task saved successfully", "success");
      } catch (error) {
        toast(error.message, "error");
      }
    }
  };

  const handleVertexMouseDown = (e, taskId) => {
    if (e.button === 0) {
      e.stopPropagation();
      setDraggingVertex(taskId);
      setSelectedVertex(taskId);
    }
  };

  const handleVertexContextMenu = (e, taskId) => {
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
    if (draggingVertex) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      getTask(draggingVertex).setPosition(x, y);      
    } else if (isPanning) {
      setPan({
        x: pan.x + (e.clientX - panStart.x),
        y: pan.y + (e.clientY - panStart.y)
      });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setDraggingVertex(null);
    setIsPanning(false);
  };

  const handleSvgMouseDown = e => {
    if (e.button === 0 && !draggingVertex) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      setSelectedVertex(null);
    }
    if(e.target.tagName === 'svg' || e.target.tagName === 'g')
      setConnectingFrom(null);
  };

  const handleSvgContextMenu = e => {
    e.preventDefault();
    // Only cancel connection if right-clicking on empty canvas (not on a vertex)
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
    setSelectedVertex(null);
  };

  const handleGenerateTasks = (config) => {
    deleteSchedule();
    const generator = new TaskGenerator(config); // Random task set generator
    const schedule = generator.generate(); // Generate random schedule
    // Apply graph layout to organize vertices
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
    const graph = schedule.toGraph();
    layout.applyLayout(graph);
    // Add generated tasks to current schedule
    scheduleFromGraph(graph);
  };

  const handleExport = () => {
    const svgRect = svgRef.current?.getBoundingClientRect();
    const viewportDimensions = svgRect ? { 
      width: svgRect.width, 
      height: svgRect.height 
    } : null;
    exportJSON({...scheduleToGraph(), viewportDimensions});
  };

  const handleImport = file => {
    importJSON(file).then(data => {
      try{
        scheduleFromGraph(data);
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
              vertices={tasks}
              edges={precedences}
              topListName={"Tasks"}
              bottomListName={"Precedences"}
              selectedVertex={selectedVertex}
              defaultVertex={{
                label: `Task ${tasks.length + 1}`,
                mist: false,
                C: 1,
                T: 10,
                D: 10,
                a: 0,
                M: 1
                // Initial position is random
              }}
              connectingFrom={connectingFrom}
              handleStartConnecting={handleStartConnecting}
              setEditingVertex={setEditingVertex}
              setDialogOpen={setDialogOpen}
              removeVertex={removeTask}
              disconnectVertices={disconnectTasks} />

            <SvgCanvas
              svgRef={svgRef}
              pan={pan}
              zoom={zoom}
              isPanning={isPanning}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              handleSvgMouseDown={handleSvgMouseDown}
              handleSvgContextMenu={handleSvgContextMenu}
              vertices={tasks}
              edges={precedences}
              selectedVertex={selectedVertex}
              connectingFrom={connectingFrom}
              handleVertexMouseDown={handleVertexMouseDown}
              handleVertexContextMenu={handleVertexContextMenu}
              draggingVertex={draggingVertex} /> 
          </Box> 

          <EditDialog
              dialogConfig={taskEditDialogConfig}
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              editingVertex={editingVertex}
              setEditingVertex={setEditingVertex}
              handleSave={handleSaveVertex}
          />
      </Paper>
    </MainView>
  );
};

export default View;