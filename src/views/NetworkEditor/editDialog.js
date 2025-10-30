import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack
} from "@mui/material";
import { NODE_TYPES, NODE_TYPE_LABELS } from "../../model/network";


const EditDialog = (props) => {

    const {
        dialogOpen,
        setDialogOpen,
        editingNode,
        setEditingNode,
        handleSaveNode,
    } = props;

    return (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Add/Edit New Node</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Node ID"
                        type="text"
                        value={editingNode?.id || ""}
                        disabled/>
                    <TextField
                        label="Label"
                        type="text"
                        value={editingNode?.label || ""}
                        onChange={e => setEditingNode({ ...editingNode, label: e.target.value })}/>
                    <FormControl fullWidth>
                        <InputLabel>Node Type</InputLabel>
                        <Select
                            value={editingNode.type}
                            onChange={e => setEditingNode({ ...editingNode, type: e.target.value })}>
                            {
                                Object.keys(NODE_TYPES)
                                    .filter(key => key !== "UNDEFINED")
                                    .map(key => (
                                        <MenuItem key={key} value={key}>
                                            {NODE_TYPE_LABELS[key]}
                                        </MenuItem>
                                    ))
                            }
                        </Select>
                    </FormControl>
                    <TextField
                        label="Memory Capacity"
                        type="number"
                        value={editingNode?.M || 0}
                        onChange={e => setEditingNode({ ...editingNode, M: e.target.value })}/>
                    <TextField
                        label="Memory Capacity"
                        type="number"
                        value={editingNode?.u || 0}
                        onChange={e => setEditingNode({ ...editingNode, u: e.target.value })}/>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveNode} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditDialog;