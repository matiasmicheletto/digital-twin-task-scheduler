import React, { useState, useRef } from "react";
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

// Simple directed graph editor with node properties: C, T, D, a
// Usage: import GraphEditor from './GraphEditor'; <GraphEditor />

let nextNodeId = 1;
let nextEdgeId = 1;

function EdgesLayer({ nodes, edges }) {
  const nodeById = (id) => nodes.find((n) => n.id === id);
  const edgeColor = "#555";

  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {edges.map((e) => {
        const f = nodeById(e.from);
        const t = nodeById(e.to);
        if (!f || !t) return null;

        const x1 = f.x + 60;
        const y1 = f.y + 24;
        const x2 = t.x + 60;
        const y2 = t.y + 24;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const ux = dx / len;
        const uy = dy / len;
        const ah = 8;

        const arrowX = x2 - ux * 18;
        const arrowY = y2 - uy * 18;
        const leftX = arrowX - uy * ah;
        const leftY = arrowY + ux * ah;
        const rightX = arrowX + uy * ah;
        const rightY = arrowY - ux * ah;

        return (
          <g key={e.id}>
            <line
              x1={x1}
              y1={y1}
              x2={arrowX}
              y2={arrowY}
              stroke={edgeColor}
              strokeWidth={2}
            />
            <polygon
              points={`${arrowX},${arrowY} ${leftX},${leftY} ${rightX},${rightY}`}
              fill={edgeColor}
            />
          </g>
        );
      })}
    </svg>
  );
};

export default function GraphEditor() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [editingNode, setEditingNode] = useState(null);

  const [connectSourceId, setConnectSourceId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const boardRef = useRef(null);

  // --- Node Dragging ---
  const dragState = useRef({ draggingId: null, offsetX: 0, offsetY: 0 });

  function startDrag(e, node) {
    e.stopPropagation();
    const boardRect = boardRef.current.getBoundingClientRect();
    const offsetX = e.clientX - (boardRect.left + node.x);
    const offsetY = e.clientY - (boardRect.top + node.y);
    dragState.current = { draggingId: node.id, offsetX, offsetY };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  }

  function onPointerMove(e) {
    const { draggingId, offsetX, offsetY } = dragState.current;
    if (!draggingId) return;
    const boardRect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - boardRect.left - offsetX;
    const y = e.clientY - boardRect.top - offsetY;
    setNodes((prev) => prev.map((n) => (n.id === draggingId ? { ...n, x, y } : n)));
  }

  function onPointerUp() {
    dragState.current = { draggingId: null, offsetX: 0, offsetY: 0 };
    window.removeEventListener("pointermove", onPointerMove);
  }

  // --- Node creation & deletion ---
  function addNode() {
    const id = String(nextNodeId++);
    const newNode = {
      id,
      label: `N${id}`,
      x: 40 + nodes.length * 20,
      y: 40 + nodes.length * 20,
      C: 1,
      T: 10,
      D: 10,
      a: 0,
    };
    setNodes((n) => [...n, newNode]);
    setSelectedNodeId(id);
    setEditingNode(newNode);
  }

  function removeNode(id) {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  }

  // --- Edges ---
  function addEdge(from, to) {
    if (from === to) return; // no self-loop (optional)
    // avoid duplicate
    if (edges.some((e) => e.from === from && e.to === to)) return;
    const edge = { id: String(nextEdgeId++), from, to };
    setEdges((prev) => [...prev, edge]);
  }

  function removeEdge(id) {
    setEdges((prev) => prev.filter((e) => e.id !== id));
  }

  // --- Connect mode (click source, then target) ---
  function onNodeClick(node, e) {
    e.stopPropagation();
    setSelectedNodeId(node.id);

    if (connectSourceId) {
      // complete connection
      addEdge(connectSourceId, node.id);
      setConnectSourceId(null);
    }
  }

  function startConnect(node, e) {
    e.stopPropagation();
    setConnectSourceId(node.id);
  }

  // --- Edit dialog ---
  function openEdit(node) {
    setEditingNode({ ...node });
  }

  function saveEdit() {
    setNodes((prev) => prev.map((n) => (n.id === editingNode.id ? editingNode : n)));
    setEditingNode(null);
  }

  // --- Export / Import ---
  function exportJSON() {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "graph.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) throw Error("Invalid format");
        setNodes(parsed.nodes.map((n) => ({ ...n })));
        setEdges(parsed.edges.map((e) => ({ ...e })));
        // update counters
        nextNodeId = Math.max(1, ...parsed.nodes.map((n) => Number(n.id) || 0) + 1);
        nextEdgeId = Math.max(1, ...parsed.edges.map((e) => Number(e.id) || 0) + 1);
      } catch (err) {
        alert("Failed to import: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  // --- Helpers ---
  function nodeById(id) {
    return nodes.find((n) => n.id === id);
  }


  // --- Menu / misc ---
  function openMenu(e) {
    setAnchorEl(e.currentTarget);
  }
  function closeMenu() {
    setAnchorEl(null);
  }

  return (
    <Paper elevation={3} sx={{ height: 600, display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Directed Graph Editor
          </Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Add node">
              <IconButton color="primary" onClick={addNode}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title={connectSourceId ? "Connecting: click target to finish" : "Start connection (click source)"}>
              <IconButton
                color={connectSourceId ? "secondary" : "default"}
                onClick={() => setConnectSourceId(connectSourceId ? null : "start")}
              >
                <LinkIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Import / Export">
              <IconButton onClick={openMenu}>
                <FileUploadIcon />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
              <MenuItem
                onClick={() => {
                  closeMenu();
                  exportJSON();
                }}
              >
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
                      if (f) importJSON(f);
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
        <Box sx={{ width: 320, borderRight: "1px solid #eee", p: 1, overflow: "auto" }}>
          <Typography variant="subtitle1">Nodes</Typography>
          <List dense>
            {nodes.map((n) => (
              <React.Fragment key={n.id}>
                <ListItem
                  selected={selectedNodeId === n.id}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <IconButton edge="end" onClick={() => startConnect(n)} size="small">
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
                  <ListItemText primary={`${n.label} (C:${n.C} T:${n.T} D:${n.D} a:${n.a})`} secondary={`id: ${n.id}`} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>

          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Edges
          </Typography>
          <List dense>
            {edges.map((e) => (
              <ListItem key={e.id} secondaryAction={<IconButton onClick={() => removeEdge(e.id)} size="small"><DeleteIcon fontSize="small"/></IconButton>}>
                <ListItemText primary={`${nodeById(e.from)?.label ?? e.from} → ${nodeById(e.to)?.label ?? e.to}`} secondary={`id: ${e.id}`} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">Export / Import</Typography>
          <Button variant="outlined" size="small" startIcon={<FileDownloadIcon />} onClick={exportJSON} sx={{ mt: 1 }}>
            Export JSON
          </Button>
        </Box>

        <Box sx={{ position: "relative", flex: 1 }} ref={boardRef} onClick={() => { setSelectedNodeId(null); if (connectSourceId && connectSourceId !== "start") setConnectSourceId(null); }}>
          <EdgesLayer nodes={nodes} edges={edges} />

          {nodes.map((n) => (
            <Box
              key={n.id}
              onPointerDown={(ev) => startDrag(ev, n)}
              onClick={(ev) => onNodeClick(n, ev)}
              sx={{
                position: "absolute",
                left: n.x,
                top: n.y,
                width: 120,
                p: 1,
                cursor: "grab",
                userSelect: "none",
              }}
            >
              <Paper elevation={selectedNodeId === n.id ? 6 : 2} sx={{ p: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle2">{n.label}</Typography>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(n); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); startConnect(n, e); }}>
                      <LinkIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </Stack>
                <Typography variant="caption">C: {n.C} • T: {n.T} • D: {n.D} • a: {n.a}</Typography>
              </Paper>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Edit dialog */}
      <Dialog open={Boolean(editingNode)} onClose={() => setEditingNode(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit node</DialogTitle>
        <DialogContent>
          {editingNode && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Label" value={editingNode.label} onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })} />
              <TextField
                label="Worst-case exec time (C)"
                type="number"
                value={editingNode.C}
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
  );
}
