import { useState, useRef, useEffect } from "react";
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Tooltip,
  Stack,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import LinkIcon from "@mui/icons-material/Link";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MainView from "../../components/MainView";
import EdgesLayer from "../../components/EdgesLayer";
import useSchedule from "../../hooks/useSchedule";
import { importJSON, exportJSON } from "../../model/utils";

let nextNodeId = 1;
let nextEdgeId = 1;

const taskBoxStyle = n => ({
    position: "absolute",
    left: n.x,
    top: n.y,
    width: 180,
    p: 1,
    cursor: "grab",
    userSelect: "none"
});

const View = () => {
    //const { taskData, addTask, connectTasks } = useSchedule();

    const [tasks, setTasks] = useState([]);
    const [precedences, setPrecedences] = useState([]);

    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [editingNode, setEditingNode] = useState(null);

    const [connectSourceId, setConnectSourceId] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    const boardRef = useRef(null);

    // --- Node Dragging ---
    const dragState = useRef({ draggingId: null, offsetX: 0, offsetY: 0 });
    
    const nodeRefs = useRef({}); // id -> DOM element
    const [nodeRects, setNodeRects] = useState({}); // id -> DOMRect    

    // call to update rects (call after layout changes)
  const updateNodeRects = () => {
    if (!boardRef.current) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const rects = {};
    for (const id of Object.keys(nodeRefs.current)) {
      const el = nodeRefs.current[id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      // convert to board-local coordinates
      rects[id] = {
        left: r.left - boardRect.left,
        top: r.top - boardRect.top,
        width: r.width,
        height: r.height,
        right: r.left - boardRect.left + r.width,
        bottom: r.top - boardRect.top + r.height,
        cx: r.left - boardRect.left + r.width / 2,
        cy: r.top - boardRect.top + r.height / 2,
      };
    }
    setNodeRects(rects);
  }

  // ensure rects update on relevant changes:
  useEffect(() => {
    updateNodeRects();
    // also on window resize (tasks may reflow)
    const ro = new ResizeObserver(updateNodeRects);
    // observe board and node elements
    if (boardRef.current) ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  // whenever tasks or their positions change, update rects
  useEffect(() => {
    // small timeout to let DOM update after state change
    const id = window.setTimeout(updateNodeRects, 0);
    return () => clearTimeout(id);
  }, [tasks]);

  const startDrag = (e, node) => {
    e.stopPropagation();
    const boardRect = boardRef.current.getBoundingClientRect();
    const offsetX = e.clientX - (boardRect.left + node.x);
    const offsetY = e.clientY - (boardRect.top + node.y);
    dragState.current = { draggingId: node.id, offsetX, offsetY };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  }

  const onPointerMove = e => {
    const { draggingId, offsetX, offsetY } = dragState.current;
    if (!draggingId) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - boardRect.left - offsetX;
    const y = e.clientY - boardRect.top - offsetY;
    setTasks((prev) => prev.map((n) => (n.id === draggingId ? { ...n, x, y } : n)));
  }

  const onPointerUp = () => {
    dragState.current = { draggingId: null, offsetX: 0, offsetY: 0 };
    window.removeEventListener("pointermove", onPointerMove);
  }

  // --- Node creation & deletion ---
  const addNode = () => {
    const id = String(nextNodeId++);
    const newNode = {
      id,
      label: `N${id}`,
      x: 40 + tasks.length * 20,
      y: 40 + tasks.length * 20,
      C: 1,
      T: 10,
      D: 10,
      a: 0,
      M: 1
    };
    setTasks((n) => [...n, newNode]);
    setSelectedNodeId(id);
    setEditingNode(newNode);
  }

  const removeNode = id => {
    setTasks((prev) => prev.filter((n) => n.id !== id));
    setPrecedences((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  }

  // --- Precedences ---
  const addEdge = (from, to) => {
    if (from === to) return; // no self-loop (optional)
    // avoid duplicate
    if (precedences.some((e) => e.from === from && e.to === to)) return;
    const edge = { id: String(nextEdgeId++), from, to };
    setPrecedences((prev) => [...prev, edge]);
  }

  const removeEdge = id => {
    setPrecedences((prev) => prev.filter((e) => e.id !== id));
  }

  // --- Connect mode (click source, then target) ---
  const onNodeClick = (node, e) => {
    e.stopPropagation();
    setSelectedNodeId(node.id);

    if (connectSourceId) {
      // complete connection
      addEdge(connectSourceId, node.id);
      setConnectSourceId(null);
    }
  }

  const startConnect = node => {
    setConnectSourceId(node.id);
  }

  // --- Edit dialog ---
  const openEdit = node => {
    setEditingNode({ ...node });
  }

  const saveEdit = () => {
    setTasks((prev) => prev.map((n) => (n.id === editingNode.id ? editingNode : n)));
    setEditingNode(null);
  }

  // --- Export / Import ---
  const handleExport = () => {
    const data = { tasks, precedences };
    exportJSON(data);
  }

  const handleImport = file => {
    importJSON(file).then(({ tasks, precedences }) => {
      if (tasks && precedences) {
        setTasks(tasks);
        setPrecedences(precedences);
      }
    });
  }

  // --- Helpers ---
  const nodeById = id => {
    return tasks.find((n) => n.id === id);
  }


  // --- Menu / misc ---
  const openMenu = e => {
    setAnchorEl(e.currentTarget);
  }
  const closeMenu = () => {
    setAnchorEl(null);
  }

  return (
    <MainView>
        <Paper elevation={3} sx={{ height: 600, display: "flex", flexDirection: "column" }}>
        <AppBar position="static" color="default" elevation={1}>
            <Toolbar variant="dense">
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Tasks schedule editor
            </Typography>
            <Stack direction="row" spacing={1}>
                <Tooltip title="Import / Export">
                    <IconButton onClick={openMenu}>
                        <FileUploadIcon />
                    </IconButton>
                </Tooltip>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
                <MenuItem
                    onClick={() => {
                        closeMenu();
                        handleExport();
                        }}>
                    <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} /> Export JSON
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
                    <FileUploadIcon fontSize="small" sx={{ mr: 1 }} /> Import JSON
                    </label>
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
                        <IconButton color="primary" onClick={addNode}>
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
                <List dense>
                    {tasks.map((n) => (
                        <React.Fragment key={n.id}>
                            <ListItem
                            selected={selectedNodeId === n.id}
                            secondaryAction={
                                <Stack direction="row" spacing={1}>
                                <IconButton edge="end" onClick={(e) => {e.stopPropagation(); startConnect(n, e);}} size="small">
                                    <LinkIcon fontSize="small" />
                                </IconButton>
                                <IconButton edge="end" onClick={() => openEdit(n)} size="small">
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton edge="end" onClick={() => removeNode(n.id)} size="small">
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                                </Stack>
                            }
                            >
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
                    {precedences.map((e) => (
                    <ListItem key={e.id} secondaryAction={<IconButton onClick={() => removeEdge(e.id)} size="small"><DeleteIcon fontSize="small"/></IconButton>}>
                        <ListItemText primary={`${nodeById(e.from)?.label ?? e.from} → ${nodeById(e.to)?.label ?? e.to}`} secondary={`id: ${e.id}`} />
                    </ListItem>
                    ))}
                </List>
            </Box>

            <Box 
                sx={{ position: "relative", flex: 1 }} 
                ref={boardRef} 
                onClick={() => { setSelectedNodeId(null); if (connectSourceId && connectSourceId !== "start") setConnectSourceId(null); }}>
            
            <EdgesLayer boardRef={boardRef} nodeRects={nodeRects} precedences={precedences} />

            {tasks.map((n) => (
                <Box
                    key={n.id}
                    ref={(el) => { nodeRefs.current[n.id] = el; }}
                    onPointerDown={(ev) => startDrag(ev, n)}
                    onClick={(ev) => onNodeClick(n, ev)}
                    sx={taskBoxStyle(n)}>
                <Paper elevation={selectedNodeId === n.id ? 6 : 2} sx={{ p: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">{n.label}</Typography>
                    <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(n); }}>
                        <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); startConnect(n); }}>
                        <LinkIcon fontSize="small" />
                        </IconButton>
                    </Stack>
                    </Stack>
                    <Typography variant="caption">C: {n.C}, T: {n.T}, D: {n.D}, a: {n.a}, M: {n.M}</Typography>
                </Paper>
                </Box>
            ))}
            </Box>
        </Box>

        {/* Edit dialog */}
        <Dialog open={Boolean(editingNode)} onClose={() => setEditingNode(null)} maxWidth="xs" fullWidth>
            <DialogTitle>Edit task</DialogTitle>
            <DialogContent>
            {editingNode && (
                <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField label="Label" value={editingNode.label} onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })} />
                <TextField
                    label="Worst-case exec time (C)"
                    type="number"
                    value={editingNode.C}
                    sx={{borderColor: 'red'}}
                    onChange={(e) => setEditingNode({ ...editingNode, C: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                />
                <TextField
                    label="Period (T)"
                    type="number"
                    value={editingNode.T}
                    onChange={(e) => setEditingNode({ ...editingNode, T: Number(e.target.value) })}
                    inputProps={{ min: 1 }}
                />
                <TextField
                    label="Deadline (D)"
                    type="number"
                    value={editingNode.D}
                    onChange={(e) => setEditingNode({ ...editingNode, D: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                />
                <TextField
                    label="Activation time (a)"
                    type="number"
                    value={editingNode.a}
                    onChange={(e) => setEditingNode({ ...editingNode, a: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                />
                <TextField
                    label="Memory requirement (M)"
                    type="number"
                    value={editingNode.M || 0}
                    onChange={(e) => setEditingNode({ ...editingNode, M: Number(e.target.value) })}
                    inputProps={{ min: 0 }}
                />
                </Stack>
            )}
            </DialogContent>
            <DialogActions>
            <Button onClick={() => setEditingNode(null)}>Cancel</Button>
            <Button onClick={saveEdit} variant="contained">
                Save
            </Button>
            </DialogActions>
        </Dialog>
        </Paper>
    </MainView>
  );
};

export default View;
