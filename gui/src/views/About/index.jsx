import { Link, Typography } from "@mui/material";
import MainView from "../../components/MainView";
import { FaLink } from "react-icons/fa";

const View = () => {

    return (
        <MainView title="">
            <Typography variant="h4" gutterBottom>
                Digital Twin Task Scheduler
            </Typography>
            <Typography variant="h5" gutterBottom>
                About
            </Typography>
            <br/>
            <Typography variant="h5" gutterBottom>
                <Link href="https://github.com/matiasmicheletto/digital-twin-task-scheduler" target="_blank" rel="noopener"
                color="inherit" underline="hover">
                    <Typography variant="h5" component="span">
                        GitHub Repository
                    </Typography>
                    <FaLink style={{marginLeft: "10px"}}/> 
                </Link>
            </Typography>
        </MainView>
    );
};

export default View;