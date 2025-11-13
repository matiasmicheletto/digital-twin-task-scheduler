import { useRef, useState, useEffect } from "react";
import { 
    Box, 
    Paper
} from "@mui/material";
import MainView from "../../components/MainView";
import SvgCanvas from "../../components/Svg";
import EditDialog from "../../components/EditDialog";
import SchedulerConfigDialog from "../../components/SchedulerConfigDialog";
import AppBar from "../../components/AppBar";
import SidePanel from "../../components/SidePanel";
import useToast from "../../hooks/useToast";
import { containerStyle } from "../../themes/common";
import useGraph, { GRAPH_MODES } from "../../hooks/useGraph";
import TaskGenerator from "../../../../shared/taskGenerator.js";
import { GENERATORS } from "../../../../shared/networkGenerator.js";
import GraphLayout from "../../../../shared/graphLayout.js";
import { NODE_TYPES } from "../../../../shared/network.js";
import { 
  taskEditDialogConfig, 
  nodeEditDialogConfig, 
  edgeEditDialogConfig
} from "./dialogFormConfigs.js";
import { 
  importFile, 
  exportFile,
  saveToLocalStorage,
  loadFromLocalStorage,
  getRandomScreenPosition 
} from "../../model/utils";


const getDefaultVertex = (mode, vertices) => (mode === GRAPH_MODES.SCHEDULE ? {
    label: `Task ${vertices.length + 1}`,
    mist: false,
    C: 1,
    T: 10,
    D: 10,
    a: 0,
    M: 1,
    position: getRandomScreenPosition()
  }
  :
  {
    label: `Node ${vertices.length + 1}`,
    type: NODE_TYPES.MIST,
    memory: 1024,
    u: 0.5,
    position: getRandomScreenPosition()
  });

const View = () => {
  
  const [mode, setMode] = useState(GRAPH_MODES.SCHEDULE);

  const {
    network,
    addVertex,
    removeVertex,
    connectVertices,
    disconnectVertices,
    getVertex,
    getVertices,
    getEdges,
    deleteGraph,
    setEdgeProp,
    fromObject,
    graphToModel,
    modelToGraph,
    modelsToDat,
    datToModels
  } = useGraph(mode);

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

  // Dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false); // Edit vertex/edge dialog
  const [schedulerConfigDialogOpen, setSchedulerConfigDialogOpen] = useState(false); // Edit scheduler config dialog
  
  // To know which element is being edited in the dialog
  const [editingVertex, setEditingVertex] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);

  const editDialogContent = editingEdge? edgeEditDialogConfig : (mode === GRAPH_MODES.SCHEDULE ? taskEditDialogConfig : nodeEditDialogConfig);

  // For tasks/nodes and edges information display
  const vertices = getVertices();
  const edges = getEdges();

  // Add list of available nodes to assign task processorId
  if(mode === GRAPH_MODES.SCHEDULE){
    // Update processorId options in task edit dialog
    editDialogContent
      .fields
      .find(f => f.attrName === "processorId")
      .options = [
        { value: null, text: "Unassigned" },
        ...network.getNodes().map(v => ({ value: v.id, text: v.label }))
      ];
  }

  useEffect(() => { // Auto-save to localStorage
    const autoSaveData = () => {
      const svgRect = svgRef.current?.getBoundingClientRect();
      const viewportDimensions = svgRect ? { 
        width: svgRect.width, 
        height: svgRect.height 
      } : null;
      
      const graph = {...modelToGraph()};
      graph.viewportDimensions = viewportDimensions;
      
      saveToLocalStorage(mode === GRAPH_MODES.SCHEDULE ? 'savedSchedules' : 'savedNetworks', graph);
      console.log('Auto-saved graph to localStorage');
    };

    // Auto-save when vertices or positions change (including when cleared)
    const timeoutId = setTimeout(autoSaveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [vertices, edges, modelToGraph]);

  useEffect(() => { // Load saved data on component mount
    /* For testing
    const savedSchedules = JSON.parse(localStorage.getItem('savedSchedules'))
    console.log(savedSchedules);
    const savedNetworks = JSON.parse(localStorage.getItem('savedNetworks'))
    console.log(savedNetworks);
    */

    const data = loadFromLocalStorage(mode === GRAPH_MODES.SCHEDULE ? 'savedSchedules' : 'savedNetworks');
    if (data) {
      try {
        graphToModel(data);
        handleResetView();
        toast("Loaded saved graph from previous session", "info");
      } catch (error) {
        console.error('Failed to load saved graph:', error);
        toast("Failed to load saved graph: " + error.message, "error");
        localStorage.removeItem(mode === GRAPH_MODES.SCHEDULE ? 'savedSchedules' : 'savedNetworks');
      }
    }
  }, [graphToModel]);

  const handleResetView = () => { // Reset pan and zoom to fit all vertices
    const svgRect = svgRef.current?.getBoundingClientRect();
    if (svgRect) {
      // Calculate bounding box of all vertices
      const pos = vertices.map(t => t.position);
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

  const handleSetEditingElement = updatedElement => { // Update editing element state
    if (editingVertex) {
      if(mode === GRAPH_MODES.SCHEDULE){ // If assigning task to a processor, check constraints
        if(updatedElement.processorId) {
          const assignedNode = network.getNode(updatedElement.processorId);
          if(!assignedNode) {
            toast("Assigned processor does not exist in the network", "error");
            return;
          }
          if(assignedNode.type === NODE_TYPES.MIST && assignedNode.allocatedTasks.length >= 1) {
            toast("Mist nodes can only have one task allocated at a time", "error");
            return;
          }
          // Deallocate from previous node if processorId changed
          const previousElement = getVertex(updatedElement.id);
          if(previousElement.processorId && previousElement.processorId !== updatedElement.processorId) {
            const previousNode = network.getNode(previousElement.processorId);
            if(previousNode) {
              previousNode.deallocateTask(updatedElement.id);
            }
          }
          // Allocate to new node
          assignedNode.allocateTask(updatedElement.id);
        }
      }
      setEditingVertex(updatedElement);
    }
    if (editingEdge) {
      setEditingEdge(updatedElement);
    }
  };

  const handleSaveElement = () => { // Save vertex after completing form
    if (editingVertex) {
      try {
        const vrtx = fromObject(editingVertex);
        addVertex(vrtx); // Overwrites if id exists
        setEditDialogOpen(false);
        setEditingVertex(null);
        handleResetView();
        toast("Task saved successfully", "success");
      } catch (error) {
        toast(error.message, "error");
      }
    }
    if (editingEdge) {
      try {
        setEdgeProp(editingEdge.id, 'delay', editingEdge.delay);
        setEditDialogOpen(false);
        setEditingEdge(null);
        toast("Link saved successfully", "success");
      } catch (error) {
        toast(error.message, "error");
      }
    }
  };

  const handleVertexMouseDown = (e, vertexId) => {
    if (e.button === 0) {
      e.stopPropagation();
      setDraggingVertex(vertexId);
      setSelectedVertex(vertexId);
    }
  };

  const handleArrowMouseDown = (e, edgeId) => {
    e.stopPropagation();
    setSelectedVertex(null);
    const edge = edges.find(ed => ed.id === edgeId);
    setEditingEdge({
      id: edge.id,
      label: edge.label,
      delay: edge.delay
    });
    setEditDialogOpen(true);
  }

  const handleVertexContextMenu = (e, vertexId) => {
    e.preventDefault();
    e.stopPropagation();
    if (connectingFrom === null) {
      setConnectingFrom(vertexId);
    } else {
      if (connectingFrom !== vertexId) {
        try{
          connectVertices(connectingFrom, vertexId);
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
      getVertex(draggingVertex).setPosition(x, y);      
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

  const handleDeleteVertices = () => {
    deleteGraph();
    setSelectedVertex(null);
  };

  const handleGenerateSchedule = config => {
    if(config){
      deleteGraph();
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
      // Add generated vertices to current schedule
      graphToModel(graph);
    }else{
      setSchedulerConfigDialogOpen(true);
    }
  };

  const handleGenerateNetwork = config => {
    deleteGraph();
    const generator = new GENERATORS[config.generator](config); // Random network generator
    const network = generator.generate(); // Generate random network
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
    const graph = network.toGraph();
    layout.applyLayout(graph);
    // Add generated vertices to current network
    graphToModel(graph);
  };

  const handleExport = format => {
    if(format === "JSON"){ // Network and Schedule are exported sepparaterly
      const svgRect = svgRef.current?.getBoundingClientRect();
      const viewportDimensions = svgRect ? { 
        width: svgRect.width, 
        height: svgRect.height 
      } : null;
      const graph = {...modelToGraph()};
      const data = mode === GRAPH_MODES.SCHEDULE ? {
        tasks: graph.vertices,
        precedences: graph.edges,
        viewportDimensions
      } : {
        nodes: graph.vertices,
        connections: graph.edges,
        viewportDimensions
      };
      exportFile(data, true); // Export in json format
    }
    if(format === "DAT"){ // Combined network and schedule for .dat export
      exportFile(modelsToDat(), false); // Export in plain text format
    }
  };

  const handleImport = (file, format) => {
    importFile(file, format === "JSON")
      .then(data => {
        const graph = format === "JSON" ? data : datToModels(data);
        const modelGraph = mode === GRAPH_MODES.SCHEDULE ? {
          vertices: graph.tasks,
          edges: graph.precedences,
          viewportDimensions: graph.viewportDimensions
        } : {
          vertices: graph.nodes,
          edges: graph.connections,
          viewportDimensions: graph.viewportDimensions
        };
        try{
          graphToModel(modelGraph);
          handleResetView();
          toast(`Imported ${mode === GRAPH_MODES.SCHEDULE ? "schedule" : "network"} successfully`, "success");
        } catch (error) {
          toast(error.message, "error");
        }
        
      });
  };

  return (
    <MainView>
      <Paper elevation={3} sx={containerStyle}>
          <AppBar
            mode={mode}
            setMode={setMode}
            handleZoomIn={handleZoomIn}
            handleZoomOut={handleZoomOut}
            handleResetView={handleResetView}
            handleDeleteVertices={handleDeleteVertices}
            handleGenerateSchedule={handleGenerateSchedule}
            handleGenerateNetwork={handleGenerateNetwork}
            handleExport={handleExport}
            handleImport={handleImport}/>

          <Box sx={{ display: "flex", flex: 1, height: "100%" }}>
            <SidePanel
              vertices={vertices}
              edges={edges}
              mode={mode}
              selectedVertex={selectedVertex}
              defaultVertex={() => getDefaultVertex(mode, vertices)}
              connectingFrom={connectingFrom}
              handleStartConnecting={handleStartConnecting}
              setEditingVertex={setEditingVertex}
              setEditingEdge={setEditingEdge}
              setEditDialogOpen={setEditDialogOpen}
              removeVertex={removeVertex}
              disconnectVertices={disconnectVertices} />

            <SvgCanvas
              svgRef={svgRef}
              pan={pan}
              zoom={zoom}
              isPanning={isPanning}
              handleMouseMove={handleMouseMove}
              handleMouseUp={handleMouseUp}
              handleSvgMouseDown={handleSvgMouseDown}
              handleSvgContextMenu={handleSvgContextMenu}
              vertices={vertices}
              edges={edges}
              selectedVertex={selectedVertex}
              connectingFrom={connectingFrom}
              handleVertexMouseDown={handleVertexMouseDown}
              handleVertexContextMenu={handleVertexContextMenu}
              handleArrowMouseDown={handleArrowMouseDown}
              draggingVertex={draggingVertex} /> 
          </Box> 

          <EditDialog
              editDialogContent={editDialogContent}
              dialogOpen={editDialogOpen}
              setDialogOpen={setEditDialogOpen}
              editingElement={editingVertex || editingEdge}
              setEditingElement={handleSetEditingElement}
              handleSave={handleSaveElement} />

          <SchedulerConfigDialog
            dialogOpen={schedulerConfigDialogOpen}
            setDialogOpen={setSchedulerConfigDialogOpen}
            generateSchedule={handleGenerateSchedule} />
      </Paper>
    </MainView>
  );
};

export default View;