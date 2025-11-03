import { 
    Box,
    Grid, 
    Button, 
    Typography 
} from "@mui/material";
import GenericCard from "../../GenericCard";

const selectedStyle = {
    textAlign: "center", 
    height: "150px",
    borderRadius: "15px",
    background: "lightblue"
};

const unselectedStyle = {
    textAlign: "center", 
    height: "150px",
    borderRadius: "15px"
};

const iconStyle = {
    display: "block", 
    marginLeft: "auto", 
    marginRight:"auto",
    filter: "contrast(50%) drop-shadow(3px 5px 3px #888)"
};

const Radio = ({name, value, onChange, options}) => {

    const columns = 12/options.length;

    const handleSelect = v => {
        onChange({
            target:{name,value:v}
        });
    };

    return (
        <Grid container spacing={2} direction="row">
            {options.map((op, index) => (
                <Grid item xs={columns} key={index}>
                    <GenericCard 
                        sx={value===op.value ? selectedStyle : unselectedStyle} 
                        onClick={() => handleSelect(op.value)}>
                        <Box 
                            display="flex" 
                            flexDirection="column"
                            justifyContent="center" 
                            alignItems="center">
                            <img src={op.icon} height={"70px"} style={iconStyle}></img>
                            <Typography sx={{marginTop: "10px"}}><b>{op.name}</b></Typography>
                        </Box>
                    </GenericCard>
                </Grid>
            ))}
        </Grid>
    );
};

export default Radio;