import { useState } from "react";

import { 
    AppBar as MuiAppBar,
    Toolbar,
    Stack,
    Typography,
    Tooltip,
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
    Download
} from "@mui/icons-material";

const AppBar = props => {

    const {
        handleZoomIn,
        handleZoomOut,
        handleResetView,
        handleDeleteTasks,
        handleExport,
        handleImport
    } = props;

    const [anchorEl, setAnchorEl] = useState(null);

    const openMenu = e => {
        setAnchorEl(e.currentTarget);
    };

    const closeMenu = () => {
        setAnchorEl(null);
    };

    return (
        <MuiAppBar position="static" color="default" elevation={1}>
            <Toolbar variant="dense">
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Tasks schedule editor
                </Typography>
                <Stack direction="row" spacing={1}>
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
                        <IconButton onClick={() => handleResetView()}>
                        <RestartAlt/>
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete All Tasks">
                        <IconButton onClick={handleDeleteTasks}>
                            <Delete/>
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Import / Export">
                        <IconButton onClick={openMenu}>
                            <Download />
                        </IconButton>
                    </Tooltip>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
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
                                closeMenu();
                            }}/>
                        <Upload fontSize="small" sx={{ mr: 1 }} /> Import JSON
                        </label>
                    </MenuItem>
                    <MenuItem onClick={() => {closeMenu(); handleExport();}}>
                        <Download fontSize="small" sx={{ mr: 1 }} /> Export JSON
                    </MenuItem>
                    </Menu>
                </Stack>
            </Toolbar>
        </MuiAppBar>
    );
};

export default AppBar;