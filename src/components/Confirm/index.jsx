import React, { useContext } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button
} from '@mui/material';
import { UIUtilsDispatchContext } from '../../context/UIFeedback';

const Confirm = ({open, title, message, onConfirm, onCancel, okLabel, cancelLabel}) => {
    
    const dispatch = useContext(UIUtilsDispatchContext);

    const handleCancel = () => {
        if(typeof onCancel === "function")
            onCancel();
        dispatch({
            type: 'HIDE_CONFIRM'
        });
    };  

    return (
        <Dialog        
            BackdropProps={{sx:{backdropFilter: "blur(2px)"}}}
            sx={{zIndex: '9999'}}
            open={open}
            onClose={onCancel}>
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                {typeof onCancel === "function" &&
                    <Button onClick={handleCancel}>
                        {cancelLabel || "Cancelar"}
                    </Button>
                }
                <Button onClick={onConfirm} autoFocus>{okLabel || "Aceptar"}</Button>
            </DialogActions>
        </Dialog>
    );
};

export default Confirm;