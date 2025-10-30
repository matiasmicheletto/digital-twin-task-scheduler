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
import classes from './style.module.css';


const SidePanel = props => {

    const {
        tasks,
        precedences,
        selectedNode,
        connectingFrom,
        handleAddTask,
        handleStartConnecting,
        setEditingTask,
        setDialogOpen,
        removeTask,
        disconnectTasks,
        getTask
    } = props;

    return (
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
                    <IconButton onClick={() => disconnectTasks(e.from.id, e.to.id)} size="small">
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