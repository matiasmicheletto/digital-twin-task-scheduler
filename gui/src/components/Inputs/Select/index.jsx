import { useState } from 'react';
import { 
    Box,
    FormControl, 
    InputLabel, 
    Select as MuiSelect,
    MenuItem,
    Grid 
} from '@mui/material';
import useHint from '../../../hooks/useHint';
import classes from '../style.module.css';

const Select = props => {

    const {
        icon,
        rIcon,
        onIconClick,
        onChange,
        id,
        label,
        name,
        value,
        disabled,
        options,
        error,
        hintTitle,
        hintMessage
    } = props;

    const [iconLoaded, setIconLoaded] = useState(false);

    const hint = useHint();

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
        <Grid container spacing={2} alignItems="center" sx={{mb:2}}>
            {icon &&
                <Grid item xs={rIcon ? 1 : 2} display={iconDisplay ? 'block':'none'}>
                    {icon && !rIcon && 
                        <img 
                            onLoad={()=>setIconLoaded(true)} 
                            src={icon} 
                            className={classes.Icon} 
                            alt="icon" 
                            onClick={handleIconClick}/>
                    }
                    {rIcon && <Box>{ icon }</Box>}
                </Grid>
            }
            <Grid item xs={rIcon ? 11 : (iconDisplay ? 10 : 12)} className={classes.Container}>
                <FormControl fullWidth size="small">
                    <InputLabel id={id} sx={{color: error ? "#d32f2f":""}}>{label}</InputLabel>
                    <MuiSelect
                        disabled={disabled}
                        className={classes.SelectContainer}
                        name={name}
                        labelId={id}
                        value={value}            
                        label={label}
                        sx={{zIndex:0, color: error ? "#d32f2f":""}} 
                        error={error}                       
                        onChange={onChange}>
                        {options.map((item, index) => (
                            <MenuItem key={index} value={item.value}>{item.label}</MenuItem>
                        ))}
                    </MuiSelect>
                </FormControl>
            </Grid>
        </Grid>
    );
};

export default Select;