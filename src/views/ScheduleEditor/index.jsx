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
import TaskGenerator, {PRESETS} from "../../model/taskGenerator";
import { Task } from "../../model/schedule";
import GraphLayout from "../../model/graphLayout";
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
  
  // Task parameteres editing dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

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
  }, [tasks, precedences, toGraph]);

  useEffect(() => { // Load saved data on component mount
    const savedData = loadFromLocalStorage('savedSchedules');
    if (savedData && savedData.tasks && savedData.tasks.length > 0) {
      try {
        fromGraph(savedData);
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

  const handleSaveNode = () => { // Save task after completing form
    if (editingNode) {
      try {
        addTask(Task.fromObject(editingNode)); // Overwrites if id exists
        setDialogOpen(false);
        setEditingNode(null);
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
              handleStartConnecting={handleStartConnecting}
              setEditingNode={setEditingNode}
              setDialogOpen={setDialogOpen}
              removeTask={removeTask}
              disconnectTasks={disconnectTasks} />

            <SvgCanvas
              svgRef={svgRef}
              pan={pan}
              zoom={zoom}
              isPanning={isPanning}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              handleSvgMouseDown={handleSvgMouseDown}
              handleSvgContextMenu={handleSvgContextMenu}
              tasks={tasks}
              precedences={precedences}
              selectedNode={selectedNode}
              connectingFrom={connectingFrom}
              handleNodeMouseDown={handleNodeMouseDown}
              handleNodeContextMenu={handleNodeContextMenu}
              draggingNode={draggingNode} /> 
          </Box> 

          <EditDialog
              dialogConfig={taskEditDialogConfig}
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              editingNode={editingNode}
              setEditingNode={setEditingNode}
              handleSave={handleSaveNode}
          />
      </Paper>
    </MainView>
  );
};

export default View;