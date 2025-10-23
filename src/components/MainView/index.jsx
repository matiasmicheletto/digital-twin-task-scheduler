import { Container, Box, Typography } from '@mui/material';
import classes from './style.module.css';

const Component = ({title, background, children}) => (
    <Box>
        <Box className={classes.Background} 
            sx={{background:`linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.85)), url(${background})`}}>
        </Box>
        <Container className={classes.Container}>
            {title && 
                <Typography variant="h3" className={classes.Title}>
                    {title}
                </Typography>
            }
            {children}            
        </Container>
    </Box>
);


export default Component;