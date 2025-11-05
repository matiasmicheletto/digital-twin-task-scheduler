import React from "react";
import { 
    List,
    ListItem,
    ListItemText,
    Divider,
    Box, 
    Stack,
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
import { sidePanelStyle } from "../../themes/common";
import { GRAPH_MODES } from "../../hooks/useGraph";
import classes from './style.module.css';


const SidePanel = props => {

    const {
        vertices,
        edges,
        mode,
        selectedVertex,
        defaultVertex,
        connectingFrom,
        handleStartConnecting,
        setEditingVertex,
        setEditingEdge,
        setDialogOpen,
        removeVertex,
        disconnectVertices
    } = props;

    const handleAddVertex = (vertex) => { // Add or edit a vertex
        if(vertex){
            setEditingVertex({ ...vertex });
        }else{
            setEditingVertex(defaultVertex);
        }
        setEditingEdge(null);
        setDialogOpen(true);
    };

    const handleEditEdge = (edge) => {
        setEditingEdge({ ...edge });
        setEditingVertex(null);
        setDialogOpen(true);
    };

    return (
        <Box sx={sidePanelStyle} className={classes.sidePanel}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <Typography variant="subtitle1" sx={{fontWeight: "bold"}}>
                {mode === GRAPH_MODES.SCHEDULE ? "Tasks" : "Nodes"}
            </Typography>
            <Tooltip title={mode === GRAPH_MODES.SCHEDULE ? "Add Task" : "Add Node"}>
                <IconButton color="primary" onClick={() => handleAddVertex()}>
                    <AddCircle />
                </IconButton>
            </Tooltip>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
            <List dense>
                {vertices.map(n => (
                <React.Fragment key={n.id}>
                    <ListItem
                    selected={selectedVertex === n.id}
                    sx={{ 
                        cursor: "pointer", 
                        backgroundColor: selectedVertex === n.id ? "#000" : (connectingFrom === n.id ? "#666" : "inherit") }}
                    secondaryAction={
                        <Stack direction="row" spacing={1}>
                            <IconButton edge="end" onClick={e => handleStartConnecting(e, n)} size="small">
                                <Link fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" onClick={() => {handleAddVertex(n);}} size="small">
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" onClick={() => removeVertex(n.id)} size="small">
                                <Delete fontSize="small" />
                            </IconButton>
                        </Stack>
                    }>
                    {mode === GRAPH_MODES.SCHEDULE && 
                        <ListItemText 
                            primary={`${n.label} - ${n.mist ? "Mist" : "Edge/Cloud"}`} 
                            secondary={`C:${n.C} T:${n.T} D:${n.D} a:${n.a} M:${n.M}`} />
                    }
                    {mode === GRAPH_MODES.NETWORK && 
                        <ListItemText 
                            primary={`${n.label} - ${n.type}`} 
                            secondary={`Memory: ${n.memory} U: ${n.u}`} />
                    }
                    </ListItem>
                    <Divider />
                </React.Fragment>
                ))}
            </List>

            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                {mode === GRAPH_MODES.SCHEDULE ? "Precedences" : "Connections"}
            </Typography>

            <List dense>
                {edges.map(e => (
                    <ListItem key={e.id} secondaryAction={
                        <Stack direction="row" spacing={1}>
                            {mode === GRAPH_MODES.NETWORK &&
                                <IconButton edge="end" onClick={() => {handleEditEdge(e);}} size="small">
                                    <Edit fontSize="small" />
                                </IconButton>
                            }
                            <IconButton onClick={() => disconnectVertices(e.from.id, e.to.id)} size="small">
                                <Delete fontSize="small"/>
                            </IconButton>
                        </Stack>
                    }>
                    <ListItemText 
                        primary={e.label}
                        secondary={e.delay ? `Delay: ${e.delay}` : "" }/>
                    </ListItem>
                ))}
            </List>
            </Box>
        </Box>
    );
};

export default SidePanel;