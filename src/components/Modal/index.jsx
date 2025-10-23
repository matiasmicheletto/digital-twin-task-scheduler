import {
    Box, 
    Button,
    Typography,
    Modal as MuiModal
} from "@mui/material";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  backgroundColor: '#000000aa',
  border: '1px solid #000',
  boxShadow: 5,
  p: 4
};

const Modal = props => {
    const {
        open, 
        title, 
        message,
        onCancel
    } = props;

    return (
        <MuiModal
            open={open}
            onClose={onCancel}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description">
            <Box sx={style}>
                <Typography>
                    {title}
                </Typography>
                <Typography>
                    {message}
                </Typography>
                <Box sx={{display:"flex", justifyContent:"center"}}>
                    <Button 
                        variant="contained" 
                        color="primary"
                        onClick={onCancel}
                        sx={{mt:2}}>
                            Cerrar
                    </Button>
                </Box>
            </Box>
        </MuiModal>
    );
};

export default Modal;