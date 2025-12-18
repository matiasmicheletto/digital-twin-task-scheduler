import { useState } from "react";
import { 
    AppBar as MuiAppBar,
    Box,
    Toolbar,
    Stack,
    Tooltip,
    Button,
    IconButton,
    Menu,
    MenuItem
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
import usePreloader from "../../hooks/usePreloader";
import { PRESETS as SCHEDULE_PRESETS } from "../../../../shared/taskGenerator.js";
import { PRESETS as NETWORK_PRESETS } from "../../../../shared/networkGenerator.js";
import { GRAPH_MODES } from "../../hooks/useGraph/index.js";


const appBarStyle = {
    backgroundColor: "#333333 !important",
    opacity: "0.8",
    height: "64px"
};

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

    const preloader = usePreloader();

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

    const handleSetMode = newMode => {
        preloader(true);
        setTimeout(() => { // Delay to avoid UI glitches
            setMode(newMode);
            preloader(false);
        }, 100);
    };

    return (
        <MuiAppBar position="static" style={appBarStyle} color="primary" elevation={1}>
            <Toolbar>
                <Box sx={{ flexGrow: 1 }} >
                    <Button color="inherit" onClick={() => handleSetMode(GRAPH_MODES.SCHEDULE)}>
                        <span style={{fontWeight: mode===GRAPH_MODES.SCHEDULE ? "bold" : "normal"}}>Schedule</span>
                    </Button>

                    <Button color="inherit" onClick={() => handleSetMode(GRAPH_MODES.NETWORK)}>
                        <span style={{fontWeight: mode===GRAPH_MODES.NETWORK ? "bold" : "normal"}}>Network</span>
                    </Button>
                </Box>

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
                                <MenuItem 
                                    onClick={() => {
                                        handleGenerateSchedule(null);
                                        closeGenerateMenu();
                                    }}>
                                    <b>Custom...</b>
                                </MenuItem>
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