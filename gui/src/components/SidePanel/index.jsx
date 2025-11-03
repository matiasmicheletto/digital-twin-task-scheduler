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
import { NODE_TYPES, NODE_TYPE_LABELS } from "../../model/network";
import { sidePanelStyle } from "../../themes/common";
import classes from './style.module.css';


const SidePanel = props => {

    const {
        nodes,
        edges,
        topListName,
        bottomListName,
        selectedNode,
        defaultNode,
        connectingFrom,
        handleStartConnecting,
        setEditingNode,
        setDialogOpen,
        removeNode,
        disconnectNodes
    } = props;

    const handleAddNode = (node) => { // Add or edit a node
        if(node){
            setEditingNode({ ...node });
        }else{
            setEditingNode(defaultNode);
        }
        setDialogOpen(true);
    };

    return (
        <Box sx={sidePanelStyle} className={classes.sidePanel}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <Typography variant="subtitle1" sx={{fontWeight: "bold"}}>
                {topListName}
            </Typography>
            <Tooltip title="Add task">
                <IconButton color="primary" onClick={() => handleAddNode()}>
                    <AddCircle />
                </IconButton>
            </Tooltip>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
            <List dense>
                {nodes.map(n => (
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
                            <IconButton edge="end" onClick={() => {handleAddNode(n);}} size="small">
                                <Edit fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" onClick={() => removeNode(n.id)} size="small">
                                <Delete fontSize="small" />
                            </IconButton>
                        </Stack>
                    }>
                    <ListItemText 
                        primary={`${n.label} - ${n.mist ? "Mist" : "Edge/Cloud"}`} 
                        secondary={`C:${n.C} T:${n.T} D:${n.D} a:${n.a} M:${n.M}`} />
                    {/* For network nodes
                    <ListItemText 
                        primary={`${n.label} - ${NODE_TYPE_LABELS[n.type]}`}
                        secondary={`M:${n.memory} U:${n.u}`} />
                    */}
                    </ListItem>
                    <Divider />
                </React.Fragment>
                ))}
            </List>

            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>
                {bottomListName}
            </Typography>

            <List dense>
                {edges.map(e => (
                    <ListItem key={e.id} secondaryAction={
                    <IconButton onClick={() => disconnectNodes(e.from.id, e.to.id)} size="small">
                        <Delete fontSize="small"/>
                    </IconButton>
                    }>
                    <ListItemText primary={`${e.from?.label ?? "-"} → ${e.to?.label ?? "-"}`}/>
                    </ListItem>
                ))}
            </List>
            </Box>
        </Box>
    );
};

export default SidePanel;