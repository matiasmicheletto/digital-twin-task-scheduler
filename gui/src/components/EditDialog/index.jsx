import React from "react";
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    Switch,
    InputLabel,
    MenuItem,
    Select,
    Stack
} from "@mui/material";


const EditDialog = props => {

    const {
        editDialogContent,
        dialogOpen,
        setDialogOpen,
        editingElement,
        setEditingElement,
        handleSave
    } = props;

    const setAttr = (attrName, value) => {
        setEditingElement({ ...editingElement, [attrName]: value });
    };

    return (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>{editDialogContent.title}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {editDialogContent.fields.map(field => (
                        <React.Fragment key={field.attrName}>
                            {field.type === "text" && 
                                <TextField
                                    label={field.label}
                                    type="text"
                                    disabled={field.disabled}
                                    value={editingElement ? editingElement[field.attrName] : ""}
                                    onChange={e => setAttr(field.attrName, e.target.value)}/>
                            }

                            {field.type === "number" && 
                                <TextField
                                    label={field.label}
                                    type="number"
                                    disabled={field.disabled}
                                    value={editingElement ? editingElement[field.attrName] : 0}
                                    onChange={e => setAttr(field.attrName, parseInt(e.target.value))}/>
                            }

                            {field.type === "select" &&
                                <FormControl fullWidth>
                                    <InputLabel>{field.label}</InputLabel>
                                    <Select
                                        label={field.label}
                                        value={editingElement ? editingElement[field.attrName] : ""}
                                        onChange={e => setAttr(field.attrName, e.target.value)}>
                                        {field.options.map(opt =>
                                            <MenuItem key={opt.value} value={opt.value}>{opt.text}</MenuItem>
                                        )}
                                    </Select>
                                </FormControl>
                            }

                            {field.type === "switch" &&
                                <Box sx={{ marginBottom: "16px" }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontSize: "14px", fontWeight: "500" }}>{field.label}</label>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <span style={{ fontSize: "14px" }}>{field.labelFalse}</span>
                                            <Switch
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                    color: '#2196f3', // blue when checked
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: '#2196f3', // blue track when checked
                                                    },
                                                }}
                                                checked={editingElement ? editingElement[field.attrName] : false}
                                                onChange={e => setAttr(field.attrName, e.target.checked)}
                                            />
                                        <span style={{ fontSize: "14px" }}>{field.labelTrue}</span>
                                    </Box>
                                </Box>
                            }
                        </React.Fragment>
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditDialog;