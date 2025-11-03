import { useState } from 'react';
import { Box, Grid, TextField, InputAdornment } from '@mui/material';
import useHint from '../../../hooks/useHint';
import classes from '../style.module.css';

const Input = props => {

    const {
        icon,
        rIcon,
        blinkingIcon,
        onIconClick,
        type,
        label,
        value,
        name,
        disabled,
        multiline,
        onChange,
        error,
        unit,
        hintTitle,
        hintMessage
    } = props;

    const hint = useHint();

    const [iconLoaded, setIconLoaded] = useState(false);

    const iconDisplay = icon && iconLoaded || rIcon;

    const handleIconClick = () => {
        if (onIconClick) {
            onIconClick();
        }else if (hintTitle && hintMessage) {
            hint({
                title: hintTitle,
                message: hintMessage
            });
        }
    }

    return (
        <Grid container spacing={2} alignItems="center">
            {icon &&
                <Grid 
                    item 
                    xs={rIcon ? 1 : 2} 
                    display={iconDisplay ? 'block':'none'}>
                    {icon && !rIcon && 
                        <img 
                            onLoad={()=>setIconLoaded(true)} 
                            src={icon} 
                            className={blinkingIcon ? classes.NeonIcon : classes.Icon} 
                            alt="icon" 
                            onClick={handleIconClick}/>
                    }
                    {rIcon && <Box>{ icon }</Box>}
                </Grid>
            }
            <Grid item xs={rIcon ? 11 : (iconDisplay ? 10 : 12)} className={classes.Container}>
                <TextField
                    disabled={disabled}
                    multiline={multiline}
                    variant="outlined"
                    size="small" 
                    className={classes.Input}
                    type={type}
                    label={label}
                    value={value || ""}
                    name={name}    
                    onChange={onChange}
                    error={error}
                    sx={{zIndex: 0}}
                    InputProps={unit ? {
                        endAdornment:<InputAdornment position="start">{unit}</InputAdornment>
                    } : null}/>  
            </Grid>
        </Grid>
    );
};

export default Input;