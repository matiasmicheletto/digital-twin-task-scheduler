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
import { PRESETS as SCHEDULE_PRESETS } from "../../../../shared/taskGenerator.js";
import { PRESETS as NETWORK_PRESETS } from "../../../../shared/networkGenerator.js";
import { GRAPH_MODES } from "../../hooks/useGraph/index.js";

const AppBar = props => {

    const {
        mode,
        setMode,
        handleZoomIn,
        handleZoomOut,
        handleResetView,
        handleDeleteVertices,
        handleGenerateSchedule,
        handleGenerateNetwork,
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

    const openGenerateMenu = e => {
        setGenerateTasksMenuAnchorEl(e.currentTarget);
    };

    const closeGenerateMenu = () => {
        setGenerateTasksMenuAnchorEl(null);
    };

    const tag = mode === GRAPH_MODES.NETWORK ? " (Network)" : " (Schedule)";

    return (
        <MuiAppBar position="static" color="default" elevation={1}>
            <Toolbar variant="dense">
                <FormControl fullWidth>
                    <Select
                        value={mode}
                        onChange={e => setMode(e.target.value)}>
                            <MenuItem value={GRAPH_MODES.SCHEDULE}>Tasks Precedences Editor</MenuItem>
                            <MenuItem value={GRAPH_MODES.NETWORK}>Network Editor</MenuItem>
                    </Select>
                </FormControl>

                <Stack direction="row" spacing={1}>
                    
                    {mode === GRAPH_MODES.SCHEDULE && 
                        <>
                            <Tooltip title="Generate Random Tasks">
                                <IconButton onClick={openGenerateMenu}>
                                    <Shuffle/>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                anchorEl={generateTasksMenuAnchorEl}
                                open={Boolean(generateTasksMenuAnchorEl)}
                                onClose={closeGenerateMenu}>
                                {
                                    Object.entries(SCHEDULE_PRESETS).map(([key, preset]) => (
                                        <MenuItem 
                                            key={key}
                                            onClick={() => {
                                                handleGenerateSchedule(preset);
                                                closeGenerateMenu();
                                            }}>
                                            {preset.name}
                                        </MenuItem>
                                    ))
                                }
                            </Menu>
                        </>
                    }

                    {mode === GRAPH_MODES.NETWORK &&
                        <>
                            <Tooltip title="Generate Random Network">
                                <IconButton onClick={openGenerateMenu}>
                                    <Shuffle/>
                                </IconButton>
                            </Tooltip>
                            <Menu
                                anchorEl={generateTasksMenuAnchorEl}
                                open={Boolean(generateTasksMenuAnchorEl)}
                                onClose={closeGenerateMenu}>
                                {
                                    Object.entries(NETWORK_PRESETS).map(([key, preset]) => (
                                        <MenuItem 
                                            key={key}
                                            onClick={() => {
                                                handleGenerateNetwork(preset);
                                                closeGenerateMenu();
                                            }}>
                                            {preset.name}
                                        </MenuItem>
                                    ))    
                                }
                            </Menu>
                        </>
                    }

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
                        <IconButton onClick={handleDeleteVertices}>
                            <Delete/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Import / Export">
                        <IconButton onClick={openExportMenu}>
                            <Download />
                        </IconButton>
                    </Tooltip>
                    <Menu 
                        anchorEl={exportMenuAnchorEl} 
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
                                        handleImport(f, "JSON");
                                        closeExportMenu();
                                    }}/>
                                <Upload fontSize="small" sx={{ mr: 1 }} /> 
                                Import JSON {tag}
                            </label>
                        </MenuItem>
                        <MenuItem>
                            <label style={{ cursor: "pointer", width: "100%" }}>
                                <input
                                    type="file"
                                    accept=".dat" 
                                    style={{ display: "none" }}
                                    onChange={ev => {
                                        const f = ev.target.files?.[0];
                                        if (f) 
                                        handleImport(f, "DAT");
                                        closeExportMenu();
                                    }}/>
                                <Upload fontSize="small" sx={{ mr: 1 }} /> 
                                Import DAT {tag}
                            </label>
                        </MenuItem>
                        <MenuItem onClick={() => {closeExportMenu(); handleExport("JSON");}}>
                            <Download fontSize="small" sx={{ mr: 1 }} /> Export JSON {tag}
                        </MenuItem>
                        <MenuItem onClick={() => {closeExportMenu(); handleExport("DAT");}}>
                            <Download fontSize="small" sx={{ mr: 1 }} /> Export DAT (All)
                        </MenuItem>
                    </Menu>
                </Stack>
            </Toolbar>
        </MuiAppBar>
    );
};

export default AppBar;