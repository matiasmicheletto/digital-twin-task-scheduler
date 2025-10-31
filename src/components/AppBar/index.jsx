import { useState } from "react";
import { 
    AppBar as MuiAppBar,
    Toolbar,
    Stack,
    Tooltip,
    IconButton,
    Menu,
    FormControl,
    MenuItem,
    Select
} from "@mui/material";
import { 
    Delete, 
    ZoomIn, 
    ZoomOut, 
    RestartAlt,
    Upload,
    Download,
    Shuffle
} from "@mui/icons-material";
import { PRESETS } from "../../model/taskGenerator";

const AppBar = props => {

    const {
        handleZoomIn,
        handleZoomOut,
        handleResetView,
        handleDeleteTasks,
        handleGenerateTasks,
        handleExport,
        handleImport
    } = props;

    const [exportMenuAnchorEl, setExportMenuAnchorEl] = useState(null);
    const [generateTasksMenuAnchorEl, setGenerateTasksMenuAnchorEl] = useState(null);

    const openExportMenu = e => {
        setExportMenuAnchorEl(e.currentTarget);
    };

    const closeExportMenu = () => {
        setExportMenuAnchorEl(null);
    };

    const openGenerateTasksMenu = e => {
        setGenerateTasksMenuAnchorEl(e.currentTarget);
    };

    const closeGenerateTasksMenu = () => {
        setGenerateTasksMenuAnchorEl(null);
    };

    return (
        <MuiAppBar position="static" color="default" elevation={1}>
            <Toolbar variant="dense">
                <FormControl fullWidth>
                    <Select
                        value="Tasks Precedences Editor"
                        onChange={()=>{}}>
                            <MenuItem value="Tasks Precedences Editor">Tasks Precedences Editor</MenuItem>
                            <MenuItem value="Network Editor">Network Editor</MenuItem>
                    </Select>
                </FormControl>

                <Stack direction="row" spacing={1}>
                    <Tooltip title="Generate Random Tasks">
                        <IconButton onClick={openGenerateTasksMenu}>
                            <Shuffle/>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={generateTasksMenuAnchorEl}
                        open={Boolean(generateTasksMenuAnchorEl)}
                        onClose={closeGenerateTasksMenu}>
                        <MenuItem onClick={() => {handleGenerateTasks(PRESETS.small); closeGenerateTasksMenu();}}>Small (5 tasks)</MenuItem>
                        <MenuItem onClick={() => {handleGenerateTasks(PRESETS.medium); closeGenerateTasksMenu();}}>Medium (20 tasks)</MenuItem>
                        <MenuItem onClick={() => {handleGenerateTasks(PRESETS.largeSparse); closeGenerateTasksMenu();}}>Large sparse (100 tasks)</MenuItem>
                        <MenuItem onClick={() => {handleGenerateTasks(PRESETS.largeDense); closeGenerateTasksMenu();}}>Large dense (50 tasks)</MenuItem>
                        <MenuItem onClick={() => {handleGenerateTasks(PRESETS.pipeline); closeGenerateTasksMenu();}}>Pipeline (30 tasks)</MenuItem>
                        <MenuItem onClick={() => {handleGenerateTasks(PRESETS.highUtilization); closeGenerateTasksMenu();}}>High utilization (25 tasks)</MenuItem>                        
                    </Menu>

                    <Tooltip title="Zoom In">
                        <IconButton onClick={handleZoomIn}>
                        <ZoomIn/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Zoom Out">
                        <IconButton onClick={handleZoomOut}>
                            <ZoomOut/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset View">
                        <IconButton onClick={handleResetView}>
                        <RestartAlt/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete All Tasks">
                        <IconButton onClick={handleDeleteTasks}>
                            <Delete/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Import / Export">
                        <IconButton onClick={openExportMenu}>
                            <Download />
                        </IconButton>
                    </Tooltip>
                    <Menu 
                        exportMenuAnchorEl={exportMenuAnchorEl} 
                        open={Boolean(exportMenuAnchorEl)} 
                        onClose={closeExportMenu}>
                        <MenuItem>
                            <label style={{ cursor: "pointer", width: "100%" }}>
                            <input
                                type="file"
                                accept="application/json"
                                style={{ display: "none" }}
                                onChange={ev => {
                                    const f = ev.target.files?.[0];
                                    if (f) 
                                    handleImport(f);
                                    closeExportMenu();
                                }}/>
                            <Upload fontSize="small" sx={{ mr: 1 }} /> Import JSON
                            </label>
                        </MenuItem>
                        <MenuItem onClick={() => {closeExportMenu(); handleExport();}}>
                            <Download fontSize="small" sx={{ mr: 1 }} /> Export JSON
                        </MenuItem>
                    </Menu>
                </Stack>
            </Toolbar>
        </MuiAppBar>
    );
};

export default AppBar;