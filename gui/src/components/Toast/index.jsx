import React from 'react';
import { Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Toast = ({open, message, severity, onClose}) => (
    <Snackbar open={open} sx={{marginBottom: "50px"}}>
        <Alert severity={severity} onClose={onClose}>
            {message}
        </Alert>
    </Snackbar>
);

export default Toast;