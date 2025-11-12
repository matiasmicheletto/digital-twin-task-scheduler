import React, { useState } from "react";
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    Switch,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
    Divider,
    FormControlLabel,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const SchedulerEditDialog = props => {
    const {
        dialogOpen,
        setDialogOpen,
        generateSchedule
    } = props;

    const [config, setConfig] = useState({
        // Graph structure
        numTasks: 20,
        graphType: 'random',
        density: 0.3,
        layers: 3,
        branchingFactor: 3,
        forkJoinGroups: 2,
        mistTaskRatio: 0.2,
        
        // C (Execution Time)
        C_strategy: 'uniform',
        C_min: 1,
        C_max: 10,
        C_bimodal_weight1: 0.7,
        C_bimodal_min1: 1,
        C_bimodal_max1: 5,
        C_bimodal_weight2: 0.3,
        C_bimodal_min2: 8,
        C_bimodal_max2: 15,
        
        // T (Period)
        T_strategy: 'harmonic',
        T_values: '10,20,40,80,160',
        T_min: 10,
        T_max: 100,
        
        // D (Deadline)
        D_strategy: 'implicit',
        D_ratio: 1.0,
        D_min_ratio: 0.5,
        D_max_ratio: 1.0,
        
        // a (Activation)
        a_strategy: 'zero',
        a_min: 0,
        a_max: 0,
        a_staggerInterval: 5,
        
        // M (Memory)
        M_strategy: 'uniform',
        M_min: 1,
        M_max: 5,
        M_proportionFactor: 0.5,
        
        // Utilization
        useTargetUtilization: false,
        targetUtilization: 0.7,
        
        // Naming
        taskPrefix: 'T'
    });

    const handleChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerate = () => {
        // Build the configuration object for TaskGenerator
        const generatorConfig = {
            numTasks: parseInt(config.numTasks),
            graphType: config.graphType,
            density: parseFloat(config.density),
            layers: parseInt(config.layers),
            branchingFactor: parseInt(config.branchingFactor),
            forkJoinGroups: parseInt(config.forkJoinGroups),
            mistTaskRatio: parseFloat(config.mistTaskRatio),
            taskPrefix: config.taskPrefix,
            
            C: {
                strategy: config.C_strategy,
                min: parseInt(config.C_min),
                max: parseInt(config.C_max)
            },
            
            T: {
                strategy: config.T_strategy,
                min: parseInt(config.T_min),
                max: parseInt(config.T_max)
            },
            
            D: {
                strategy: config.D_strategy,
                ratio: parseFloat(config.D_ratio),
                min: parseFloat(config.D_min_ratio),
                max: parseFloat(config.D_max_ratio)
            },
            
            a: {
                strategy: config.a_strategy,
                min: parseInt(config.a_min),
                max: parseInt(config.a_max),
                staggerInterval: parseInt(config.a_staggerInterval)
            },
            
            M: {
                strategy: config.M_strategy,
                min: parseInt(config.M_min),
                max: parseInt(config.M_max),
                proportionFactor: parseFloat(config.M_proportionFactor)
            }
        };
        
        // Add bimodal configuration for C
        if (config.C_strategy === 'bimodal') {
            generatorConfig.C.modes = [
                {
                    weight: parseFloat(config.C_bimodal_weight1),
                    min: parseInt(config.C_bimodal_min1),
                    max: parseInt(config.C_bimodal_max1)
                },
                {
                    weight: parseFloat(config.C_bimodal_weight2),
                    min: parseInt(config.C_bimodal_min2),
                    max: parseInt(config.C_bimodal_max2)
                }
            ];
        }
        
        // Add harmonic values for T
        if (config.T_strategy === 'harmonic') {
            generatorConfig.T.values = config.T_values.split(',').map(v => parseInt(v.trim()));
        }
        
        // Add target utilization if enabled
        if (config.useTargetUtilization) {
            generatorConfig.targetUtilization = parseFloat(config.targetUtilization);
        }
        
        generateSchedule(generatorConfig);
        setDialogOpen(false);
    };

    return (
        <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>Task Graph Generator Configuration</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {/* Graph Structure Section */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Graph Structure</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <TextField
                                    label="Number of Tasks"
                                    type="number"
                                    value={config.numTasks}
                                    onChange={(e) => handleChange('numTasks', e.target.value)}
                                    fullWidth
                                />
                                
                                <FormControl fullWidth>
                                    <InputLabel>Graph Type</InputLabel>
                                    <Select
                                        value={config.graphType}
                                        label="Graph Type"
                                        onChange={(e) => handleChange('graphType', e.target.value)}
                                    >
                                        <MenuItem value="chain">Chain</MenuItem>
                                        <MenuItem value="tree">Tree</MenuItem>
                                        <MenuItem value="fork-join">Fork-Join</MenuItem>
                                        <MenuItem value="random">Random DAG</MenuItem>
                                        <MenuItem value="layered">Layered</MenuItem>
                                        <MenuItem value="independent">Independent</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {config.graphType === 'random' && (
                                    <TextField
                                        label="Density (0-1)"
                                        type="number"
                                        inputProps={{ step: 0.1, min: 0, max: 1 }}
                                        value={config.density}
                                        onChange={(e) => handleChange('density', e.target.value)}
                                        fullWidth
                                        helperText="Proportion of possible edges to create"
                                    />
                                )}
                                
                                {config.graphType === 'layered' && (
                                    <TextField
                                        label="Number of Layers"
                                        type="number"
                                        value={config.layers}
                                        onChange={(e) => handleChange('layers', e.target.value)}
                                        fullWidth
                                    />
                                )}
                                
                                {config.graphType === 'tree' && (
                                    <TextField
                                        label="Branching Factor"
                                        type="number"
                                        value={config.branchingFactor}
                                        onChange={(e) => handleChange('branchingFactor', e.target.value)}
                                        fullWidth
                                        helperText="Max children per parent"
                                    />
                                )}
                                
                                {config.graphType === 'fork-join' && (
                                    <TextField
                                        label="Fork-Join Groups"
                                        type="number"
                                        value={config.forkJoinGroups}
                                        onChange={(e) => handleChange('forkJoinGroups', e.target.value)}
                                        fullWidth
                                        helperText="Number of parallel groups"
                                    />
                                )}
                                
                                <TextField
                                    label="MIST Task Ratio (0-1)"
                                    type="number"
                                    inputProps={{ step: 0.1, min: 0, max: 1 }}
                                    value={config.mistTaskRatio}
                                    onChange={(e) => handleChange('mistTaskRatio', e.target.value)}
                                    fullWidth
                                    helperText="Proportion of tasks with fixed allocation"
                                />
                                
                                <TextField
                                    label="Task Prefix"
                                    value={config.taskPrefix}
                                    onChange={(e) => handleChange('taskPrefix', e.target.value)}
                                    fullWidth
                                    helperText="Prefix for task IDs (e.g., 'T' creates T1, T2...)"
                                />
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Execution Time (C) Section */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Execution Time (C)</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Strategy</InputLabel>
                                    <Select
                                        value={config.C_strategy}
                                        label="Strategy"
                                        onChange={(e) => handleChange('C_strategy', e.target.value)}
                                    >
                                        <MenuItem value="uniform">Uniform</MenuItem>
                                        <MenuItem value="exponential">Exponential</MenuItem>
                                        <MenuItem value="bimodal">Bimodal</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {(config.C_strategy === 'uniform' || config.C_strategy === 'exponential') && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Min"
                                            type="number"
                                            value={config.C_min}
                                            onChange={(e) => handleChange('C_min', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Max"
                                            type="number"
                                            value={config.C_max}
                                            onChange={(e) => handleChange('C_max', e.target.value)}
                                            fullWidth
                                        />
                                    </Box>
                                )}
                                
                                {config.C_strategy === 'bimodal' && (
                                    <>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Mode 1 (Lightweight)
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <TextField
                                                label="Weight"
                                                type="number"
                                                inputProps={{ step: 0.1, min: 0, max: 1 }}
                                                value={config.C_bimodal_weight1}
                                                onChange={(e) => handleChange('C_bimodal_weight1', e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Min"
                                                type="number"
                                                value={config.C_bimodal_min1}
                                                onChange={(e) => handleChange('C_bimodal_min1', e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Max"
                                                type="number"
                                                value={config.C_bimodal_max1}
                                                onChange={(e) => handleChange('C_bimodal_max1', e.target.value)}
                                                fullWidth
                                            />
                                        </Box>
                                        
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Mode 2 (Heavyweight)
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                            <TextField
                                                label="Weight"
                                                type="number"
                                                inputProps={{ step: 0.1, min: 0, max: 1 }}
                                                value={config.C_bimodal_weight2}
                                                onChange={(e) => handleChange('C_bimodal_weight2', e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Min"
                                                type="number"
                                                value={config.C_bimodal_min2}
                                                onChange={(e) => handleChange('C_bimodal_min2', e.target.value)}
                                                fullWidth
                                            />
                                            <TextField
                                                label="Max"
                                                type="number"
                                                value={config.C_bimodal_max2}
                                                onChange={(e) => handleChange('C_bimodal_max2', e.target.value)}
                                                fullWidth
                                            />
                                        </Box>
                                    </>
                                )}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Period (T) Section */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Period (T)</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Strategy</InputLabel>
                                    <Select
                                        value={config.T_strategy}
                                        label="Strategy"
                                        onChange={(e) => handleChange('T_strategy', e.target.value)}
                                    >
                                        <MenuItem value="harmonic">Harmonic</MenuItem>
                                        <MenuItem value="uniform">Uniform</MenuItem>
                                        <MenuItem value="logarithmic">Logarithmic</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {config.T_strategy === 'harmonic' && (
                                    <TextField
                                        label="Harmonic Values (comma-separated)"
                                        value={config.T_values}
                                        onChange={(e) => handleChange('T_values', e.target.value)}
                                        fullWidth
                                        helperText="e.g., 10,20,40,80,160"
                                    />
                                )}
                                
                                {(config.T_strategy === 'uniform' || config.T_strategy === 'logarithmic') && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Min"
                                            type="number"
                                            value={config.T_min}
                                            onChange={(e) => handleChange('T_min', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Max"
                                            type="number"
                                            value={config.T_max}
                                            onChange={(e) => handleChange('T_max', e.target.value)}
                                            fullWidth
                                        />
                                    </Box>
                                )}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Deadline (D) Section */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Deadline (D)</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Strategy</InputLabel>
                                    <Select
                                        value={config.D_strategy}
                                        label="Strategy"
                                        onChange={(e) => handleChange('D_strategy', e.target.value)}
                                    >
                                        <MenuItem value="implicit">Implicit (D = T)</MenuItem>
                                        <MenuItem value="constrained">Constrained (D = T × ratio)</MenuItem>
                                        <MenuItem value="arbitrary">Arbitrary</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {config.D_strategy === 'constrained' && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Min Ratio"
                                            type="number"
                                            inputProps={{ step: 0.1, min: 0, max: 1 }}
                                            value={config.D_min_ratio}
                                            onChange={(e) => handleChange('D_min_ratio', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Max Ratio"
                                            type="number"
                                            inputProps={{ step: 0.1, min: 0, max: 1 }}
                                            value={config.D_max_ratio}
                                            onChange={(e) => handleChange('D_max_ratio', e.target.value)}
                                            fullWidth
                                        />
                                    </Box>
                                )}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Activation Time (a) Section */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Activation Time (a)</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Strategy</InputLabel>
                                    <Select
                                        value={config.a_strategy}
                                        label="Strategy"
                                        onChange={(e) => handleChange('a_strategy', e.target.value)}
                                    >
                                        <MenuItem value="zero">Zero (all start at 0)</MenuItem>
                                        <MenuItem value="uniform">Uniform</MenuItem>
                                        <MenuItem value="staggered">Staggered</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {config.a_strategy === 'uniform' && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Min"
                                            type="number"
                                            value={config.a_min}
                                            onChange={(e) => handleChange('a_min', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Max"
                                            type="number"
                                            value={config.a_max}
                                            onChange={(e) => handleChange('a_max', e.target.value)}
                                            fullWidth
                                        />
                                    </Box>
                                )}
                                
                                {config.a_strategy === 'staggered' && (
                                    <TextField
                                        label="Stagger Interval"
                                        type="number"
                                        value={config.a_staggerInterval}
                                        onChange={(e) => handleChange('a_staggerInterval', e.target.value)}
                                        fullWidth
                                        helperText="Time offset between consecutive tasks"
                                    />
                                )}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Memory (M) Section */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Memory (M)</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <FormControl fullWidth>
                                    <InputLabel>Strategy</InputLabel>
                                    <Select
                                        value={config.M_strategy}
                                        label="Strategy"
                                        onChange={(e) => handleChange('M_strategy', e.target.value)}
                                    >
                                        <MenuItem value="uniform">Uniform</MenuItem>
                                        <MenuItem value="proportional">Proportional to C</MenuItem>
                                    </Select>
                                </FormControl>
                                
                                {config.M_strategy === 'uniform' && (
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <TextField
                                            label="Min"
                                            type="number"
                                            value={config.M_min}
                                            onChange={(e) => handleChange('M_min', e.target.value)}
                                            fullWidth
                                        />
                                        <TextField
                                            label="Max"
                                            type="number"
                                            value={config.M_max}
                                            onChange={(e) => handleChange('M_max', e.target.value)}
                                            fullWidth
                                        />
                                    </Box>
                                )}
                                
                                {config.M_strategy === 'proportional' && (
                                    <TextField
                                        label="Proportion Factor"
                                        type="number"
                                        inputProps={{ step: 0.1 }}
                                        value={config.M_proportionFactor}
                                        onChange={(e) => handleChange('M_proportionFactor', e.target.value)}
                                        fullWidth
                                        helperText="M = C × factor"
                                    />
                                )}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Utilization Control Section */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="h6">Utilization Control</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={2}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={config.useTargetUtilization}
                                            onChange={(e) => handleChange('useTargetUtilization', e.target.checked)}
                                        />
                                    }
                                    label="Use Target Utilization (overrides C values)"
                                />
                                
                                {config.useTargetUtilization && (
                                    <TextField
                                        label="Target Utilization (0-1)"
                                        type="number"
                                        inputProps={{ step: 0.1, min: 0, max: 1 }}
                                        value={config.targetUtilization}
                                        onChange={(e) => handleChange('targetUtilization', e.target.value)}
                                        fullWidth
                                        helperText="System utilization U = Σ(C/T)"
                                    />
                                )}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleGenerate} variant="contained">
                    Generate
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SchedulerEditDialog;