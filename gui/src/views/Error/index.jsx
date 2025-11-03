import { 
    Typography, 
    Button, 
    Box,
    TextField,
    Grid
} from "@mui/material";
import useToast from "../../hooks/useToast";
import MainView from "../../components/MainView";
import image from "../../assets/working_monkey.jpg";

const messageStyle = {
    fontSize: "15px",
    color: "rgb(100,100,100)"
};

const errorBlockStyle = {
    justifyContent: "center", 
    display: "flex",
    gap: "20px",
    width: "100%",
    paddingTop: "20px",
};

const View = ({errorMessage, onReset, onReport}) => {

    const toast = useToast();

    const handleReport = () => {
        toast("Error reportado", "success");
        onReport();
    };

    const handleReset = () => {
        toast("Aplicación reiniciada", "success");
        onReset();
    };

    return(
        <MainView title={"Critical Error"} >
            <Typography sx={messageStyle} mb={2}>
                The application has detected a critical error and cannot continue running. Our team is working to resolve it as soon as possible.
            </Typography>
            <img src={image} style={{
                width: "100%",
                top: "50%",
                borderRadius: "10%"
            }}/>
            <Typography sx={messageStyle} mt={2}>
                Please try again by restarting the application or submit a report to help us identify the issue.
            </Typography>
            <Grid 
                container 
                direction={"row"}
                mt={3}
                mb={3}
                justifyContent={"space-evenly"}
                >
                <Grid item>
                    <Button 
                        onClick={handleReport}
                        variant={"contained"}
                        color={"primary"}>
                            Send Report
                    </Button>
                </Grid>
                <Grid item>
                    <Button 
                        onClick={handleReset}
                        variant={"contained"}
                        color={"primary"}>
                            Restar Application
                    </Button>
                </Grid>
            </Grid>
            <Box sx={errorBlockStyle}>
                <TextField
                    label={"Crash dump"}
                    sx={{
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "#FF0000",
                        },
                    }}
                    value={errorMessage}
                    error
                    multiline
                    rows={15}
                    fullWidth
                    variant={"outlined"}
                    disabled
                    inputProps={{
                        style: {
                            fontFamily: "monospace",
                            fontSize: "13px"
                        }
                    }}
                />
            </Box>
        </MainView>
    );
};

export default View;