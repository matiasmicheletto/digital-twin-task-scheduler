import { useState } from 'react';
import { 
    Box, 
    Grid, 
    FormControlLabel, 
    Switch as MuiSwitch,
    Typography
} from "@mui/material";
import classes from '../style.module.css';

const Switch = props => {

    const {
        icon,
        rIcon,
        onIconClick,
        title, 
        name, 
        value, 
        error, 
        labelFalse, 
        labelTrue, 
        onChange,
        disabled,
        center
    } = props;

    const [iconLoaded, setIconLoaded] = useState(false);

    const iconDisplay = icon && iconLoaded || rIcon;

    const handleCheck = event => {
        onChange({
            target:{
                name, 
                value:event.target.checked
            }
        });
    };

    return (
        <Grid container spacing={1} alignItems="center" direction={"row"}>
            {icon &&
                <Grid item xs={rIcon ? 1 : 2} display={iconDisplay ? 'block':'none'}>
                    {icon && !rIcon && 
                        <img 
                            onLoad={()=>setIconLoaded(true)} 
                            src={icon} 
                            className={classes.Icon} 
                            alt="icon" 
                            onClick={onIconClick}/>
                    }
                    {rIcon && <Box>{ icon }</Box>}
                </Grid>
            }
            <Grid item xs={rIcon ? 11 : (iconDisplay ? 10 : 12)} className={classes.Container}>
                {title && <span className={classes.Title}>{title}</span>}
                <Box 
                    className={classes.InputContainer} 
                    sx={{border: error ? "1px solid red":null, marginLeft:"0px"}}>
                    <Grid 
                        container 
                        direction="row"
                        alignItems="center" 
                        justifyContent={center && "center"}
                        spacing={1}>
                        {labelFalse && 
                            <Grid item sm={4}>
                                <Typography fontWeight={value ? "normal" : "bold"}>
                                    {labelFalse}
                                </Typography>
                            </Grid>
                        }
                        <Grid item sm={4}>
                            <FormControlLabel
                                label=""
                                labelPlacement="bottom"
                                sx={{"&.MuiFormControlLabel-root":{margin:"0px"}}}
                                control={
                                    <MuiSwitch 
                                        disabled={disabled}
                                        checked={value} 
                                        onChange={handleCheck} 
                                        inputProps={{ 'aria-label': 'controlled' }}/>
                                }/>        
                        </Grid>
                        <Grid item sm={4}>
                            <Typography fontWeight={value ? "bold" : "normal"}>
                                {labelTrue}
                            </Typography>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </Grid>
    );
};

export default Switch;