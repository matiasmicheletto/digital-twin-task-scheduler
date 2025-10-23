import { useState } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
    Box
} from '@mui/material';
import Input from '../Inputs/Input';
import Select from '../Inputs/Select';

const Prompt = (props) => {

    const {
        open, 
        title, 
        message, 
        inputType, 
        inputProps, 
        defaultValue,
        onConfirm, 
        showCancelButton,
        onCancel
    } = props;

    const [value, setValue] = useState(defaultValue || "");

    const handleConfirm = () => {
        onConfirm(value);
        setValue(""); // Reset the value
    };

    const handleClose = () => {
        setValue(""); // Reset the value
        onCancel && onCancel();
    };

    return (
        <Dialog        
            slotProps={
                {
                    backdrop:{
                        sx:{backdropFilter: "blur(2px)"}
                    }
                }
            }
            open={open}
            fullWidth={true}
            onClose={handleClose}>
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {message}
                </DialogContentText>
                <Box sx={{marginTop: "20px"}}>
                {inputType === "input" && 
                    <Input 
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        {...inputProps}/>
                }
                {inputType === "select" && 
                    <Select
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        {...inputProps} />
                }
                </Box>
            </DialogContent>
            <DialogActions>
                {showCancelButton && <Button onClick={onCancel}>Cancelar</Button>}
                <Button onClick={handleConfirm} autoFocus>Aceptar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default Prompt;