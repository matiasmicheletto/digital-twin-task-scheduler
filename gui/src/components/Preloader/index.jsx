import React from 'react';
import { CircularProgress, Box } from '@mui/material';
import classes from './style.module.css';

const Preloader = () => ( // Full screen preloader
    <Box className={classes.Container}>
        <Box className={classes.SpinnerContainer}>
            <CircularProgress 
                enableTrackSlot 
                variant='indeterminate' 
                sx={{
                    color: '#fff',
                    '& .MuiCircularProgress-circle': {
                    animationDuration: '0.1s', // default ~1.4s
                    },
                }}/>
        </Box>
    </Box>
);

export default Preloader;