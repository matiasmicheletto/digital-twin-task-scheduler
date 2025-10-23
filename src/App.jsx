import { useState } from 'react'
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  IconButton
} from '@mui/material'
import { 
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import './App.css'

function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [count, setCount] = useState(0)

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
    },
  })

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <ScheduleIcon sx={{ mr: 2 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Digital Twin Task Scheduler
            </Typography>
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h4" component="h1" gutterBottom align="center">
                  Welcome to Digital Twin Task Scheduler
                </Typography>
                <Typography variant="body1" paragraph align="center" color="text.secondary">
                  A simulator to test and optimize task allocation in the context of a blackboard pattern based digital twin.
                </Typography>
              </CardContent>
            </Card>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Vite + React
                    </Typography>
                    <Typography variant="body2" paragraph>
                      This application is built with Vite and React, providing fast development and optimized production builds.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button 
                        variant="contained" 
                        onClick={() => setCount((count) => count + 1)}
                      >
                        count is {count}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      Material-UI
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Using Material-UI (MUI) for beautiful, responsive components with built-in theming support.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button variant="outlined" color="primary">
                        Explore Components
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  )
}

export default App
