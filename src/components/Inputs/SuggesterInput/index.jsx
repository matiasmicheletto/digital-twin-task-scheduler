import { useState } from 'react';
import { Grid, TextField, Autocomplete } from '@mui/material';
import classes from '../style.module.css';

const renderOption = (props, option) => (
    <li {...props} key={option.key}>
        {option.label}
    </li>
);

const renderInput = (props, params) => {
    
    const [iconLoaded, setIconLoaded] = useState(false);
    const iconDisplay = props.icon && iconLoaded || props.rIcon;

    return (
        <Grid container spacing={2} alignItems="center" sx={{marginBottom:"0px", maxHeight: props.value?.length ? "none" : "50px"}}>
            {props.icon &&
            <Grid 
                item 
                xs={props.rIcon ? 1 : 2}                         
                display={iconDisplay ? 'block':'none'}>
                {props.icon && !props.rIcon && 
                    <img 
                        onLoad={()=>setIconLoaded(true)} 
                        src={props.icon} 
                        className={classes.Icon} 
                        alt="icon" 
                        onClick={props.onIconClick}/>
                }
                {props.rIcon && 
                    <div style={{textAlign:"center"}}>
                        { props.icon }
                    </div>
                }
            </Grid>
            }
            <Grid item xs={props.rIcon ? 11 : (iconDisplay ? 10 : 12)} className={classes.Container}>
                <TextField
                    {...params}         
                    sx={{zIndex: 0}}                    
                    variant="outlined"
                    className={classes.Input}
                    value={props.value?.label}
                    onChange={props.onChange}
                    label={props.label}/>  
            </Grid>
        </Grid>
    );
};

const SuggesterInput = props => (
    <Autocomplete
        size="small"
        multiple={props.multiple}
        freeSolo={props.freeSolo}
        noOptionsText="Sin resultados"
        limitTags={1}
        value={props.value}
        onChange={(_, nv) => props.onChange({target:{name: props.name, value: nv}})}
        options={props.options} 
        isOptionEqualToValue={(op, val) => (op.key === val.key)}
        getOptionLabel={opt => opt.label || ""}
        renderOption={renderOption}
        renderInput={p => renderInput(props,p)}/>
);

export default SuggesterInput;