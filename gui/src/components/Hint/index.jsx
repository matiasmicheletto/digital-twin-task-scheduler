import { forwardRef, useRef } from "react";
import { 
    Box, 
    Button,
    Typography,
    Modal
} from "@mui/material";

const containerStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "85%",
    bgcolor: "background.paper",
    border: "1px solid #444",
    borderRadius: 1,
    boxShadow: 24,
    p: 2,
    maxHeight: "80%",
    overflowY: "auto"
};

const ModalContent = forwardRef(({title, message, onConfirm}, ref) => {

    return (
        <Box sx={containerStyle} ref={ref} tabIndex="0">

            <Typography variant="h6" sx={{textAlign: "center"}}>
                {title}
            </Typography>

            <Typography variant="body1" sx={{mt: 2}}>
                {message}
            </Typography>

            <Box sx={{
                    display:"flex", 
                    justifyContent: "right",
                    mt: 2
                }}>
                <Button 
                    color="success"
                    onClick={onConfirm}>
                    {"Aceptar"}
                </Button>
            </Box>
        </Box>
    );
});


const HintRef = forwardRef((props, ref) => (
    <ModalContent {...props} ref={ref} />
));

const HintModal = (props) => {
    
    const ref = useRef();

    const { 
        open, 
        title, 
        message, 
        onConfirm 
    } = props;

    return (
        <Modal 
            sx={{overflow:"auto"}}
            open={open}>
            <HintRef
                title={title}
                message={message}
                onConfirm={onConfirm}
                ref={ref}/>
        </Modal>
    );
}


export default HintModal;