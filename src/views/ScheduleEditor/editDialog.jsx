import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Stack
} from "@mui/material";

const EditDialog = (props) => {

    const {
        dialogOpen,
        setDialogOpen,
        editingTask,
        setEditingTask,
        handleSaveTask,
    } = props;

    return (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Add/Edit New Task</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Task ID"
                        type="text"
                        value={editingTask?.id || ""}
                        disabled/>
                    <TextField
                        label="Label"
                        type="text"
                        value={editingTask?.label || ""}
                        onChange={e => setEditingTask({ ...editingTask, label: e.target.value })}/>
                    <FormControl fullWidth>
                        <InputLabel>Task Type</InputLabel>
                        <Select
                            label="Task Type"
                            value={editingTask?.mist ? "mist" : "regular"}
                            onChange={e => setEditingTask({ ...editingTask, mist: e.target.value === "mist" })}>
                            <MenuItem value="regular">Edge/Cloud Task</MenuItem>
                            <MenuItem value="mist">Mist Task</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Execution Time"
                        type="number"
                        value={editingTask?.C || 0}
                        onChange={e => setEditingTask({ ...editingTask, C: e.target.value })}/>
                    <TextField
                        label="Period"
                        type="number"
                        value={editingTask?.T || 0}
                        onChange={e => setEditingTask({ ...editingTask, T: e.target.value })}/>
                    <TextField
                        label="Deadline"
                        type="number"
                        value={editingTask?.D || 0}
                        onChange={e => setEditingTask({ ...editingTask, D: e.target.value })}/>
                    <TextField
                        label="Activation Time"
                        type="number"
                        value={editingTask?.a || 0}
                        onChange={e => setEditingTask({ ...editingTask, a: e.target.value })}/>
                    <TextField
                        label="Memory"
                        type="number"
                        value={editingTask?.M || 0}
                        onChange={e => setEditingTask({ ...editingTask, M: e.target.value })}/>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveTask} variant="contained">Save</Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditDialog;