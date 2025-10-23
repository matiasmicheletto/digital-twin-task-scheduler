
import { useState } from 'react';
import {
    Button, 
    Box
} from '@mui/material';

const FileInput = ({onFileSelect, buttonText}) => {

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        onFileSelect(file);
    }

    return ( 
        <Box sx={{p:1}}>  
            <Button
                variant="contained"
                fullWidth
                component="label"
                color="success"
                onChange={handleFileSelect}>
                {buttonText}
                <input
                    type="file"
                    accept=".gal"
                    hidden/>
            </Button>
        </Box>
    );
};

export default FileInput;