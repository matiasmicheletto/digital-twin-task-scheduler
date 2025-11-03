import Calendar from 'react-calendar';
import { 
    Box,
    Grid,     
    FormControl,
    InputLabel,
    Select, 
    MenuItem 
} from '@mui/material';
import GenericCard from '../../GenericCard';
import { MONTHS } from '../../../model/constants';
import moment from 'moment';
import './calendar-style.css';

const DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const currentYear = moment().year();
const YEARS = Array.from({length: 150}, (_, index) => currentYear-index);

const DateInput = ({name, value, onChange}) => {

    const m = moment(value);
    const date = m.toDate();
    const day = m.date();
    const month = m.month();
    const year =  m.year();

    const handleSelect = d => {        
        onChange({
            target:{
                name: name,
                value: moment(d).unix()*1000
            }
        });
    };

    const handleDateChange = (f,v) => {                
        const d = new Date(year, month, day);
        d[f](v);
        onChange({
            target:{
                name: name,
                value: moment(d).unix()*1000
            }
        });
    };

    return (
        <GenericCard>
            <Grid container spacing={1}>
                <Grid item xs={4}>
                    <FormControl fullWidth>
                        <InputLabel>Día</InputLabel>
                        <Select
                            size="small"
                            label="Mes"
                            value={day}
                            onChange={e => handleDateChange("setDate", e.target.value)}>
                                {
                                    [...Array(DAYS[month]).keys()].map((d, index) => (
                                        <MenuItem key={index} value={d+1}>{d+1}</MenuItem>
                                    ))
                                }
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={4}>
                    <FormControl fullWidth>
                        <InputLabel>Mes</InputLabel>
                        <Select
                            size="small"
                            label="Mes"
                            value={month}
                            onChange={e => handleDateChange("setMonth", e.target.value)}>
                                {
                                    MONTHS.map((m, index) => (
                                        <MenuItem key={index} value={index}>{m}</MenuItem>
                                    ))
                                }
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={4}>
                    <FormControl fullWidth>
                        <InputLabel>Año</InputLabel>
                        <Select
                            size="small"
                            label="Mes"
                            value={year}
                            onChange={e => handleDateChange("setFullYear", e.target.value)}>
                                {
                                    YEARS.map((y, index) => (
                                        <MenuItem key={index} value={y}>{y}</MenuItem>
                                    ))
                                }
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>
            <Box>
                <Calendar 
                    activeStartDate={date}
                    showNavigation={false}
                    calendarType="gregory"
                    locale="es-ES"
                    selectRange={false}
                    value={date}
                    onChange={handleSelect}/>
            </Box>
        </GenericCard>
    );
};

export default DateInput;