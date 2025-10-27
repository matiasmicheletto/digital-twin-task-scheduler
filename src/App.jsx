import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, GlobalStyles } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles"; 
import theme, { globalStyles } from "./themes";
import views from "./views";
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from "./components/Navigation";
import { ScheduleProvider } from './context/Schedule';
import UIUtilsProvider from './context/UIFeedback';


const App = () => (
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={globalStyles}/>
        <UIUtilsProvider>
            <ScheduleProvider>
                <BrowserRouter>
                    <ErrorBoundary>
                        <Navigation/>
                        <Routes>
                            <Route index element={views[0].component} />
                            {
                                views.map((v,k) => (
                                    <Route key={k} path={v.path} element={v.component} />
                                ))        
                            }
                            <Route path="*" element={<Navigate replace to="/" />} />
                        </Routes>
                    </ErrorBoundary>
                </BrowserRouter>
            </ScheduleProvider>
        </UIUtilsProvider>
    </ThemeProvider>
);

export default App;
