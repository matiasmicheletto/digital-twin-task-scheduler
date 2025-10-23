import {
    createTheme
} from "@mui/material/styles";

export const globalStyles = {
    a: {
        textDecoration: "none",
        fontWeight: "bold"
    }
};

export const componentsStyles = {
    paper: {
        backgroundColor: 'rgb(245, 245, 245)',
        padding: '10px'
    },
    title: {
        fontSize: "16px",
        fontWeight: "bold",
        color: "white"
    },
    hintText: {
        fontStyle: "italic",
        fontSize: "12px",
        padding: "0px",
        margin: "0px",
        lineHeight: "1em",
        color: "rgb(100,100,100)"
    },
    headerCell: {
        fontWeight: "bold",
        p: '2px 10px'
    },
    tableCell: {
        padding: '2px 10px',
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    }
};

const theme = createTheme({
    typography: {
        fontFamily: "Montserrat, Open Sans, sans-serif",
    },
    palette: {
        mode: "light",
        primary: {
            main: "#393939",
            contrastText: "#FFFFFF"
        },
        secondary: {
            main: "#8A0808",
            contrastText: "#FFFFFF"
        },
        text: {
            primary: "#FFFFFF",
            secondary: "#CCCCCC",
        },
        custom: {
            red: {
                main: "#DD0000"
            },
            darkRed: {
                main: "#8A0808"
            },
            green: {
                main: "#007700"
            },
            darkGreen: {
                main: "#088A29"
            }
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                contained: {
                    "&.Mui-disabled": {
                        backgroundColor: "#e0e0e0",
                        color: "#9e9e9e",
                    },
                },
                outlined: {
                    "&.Mui-disabled": {
                        borderColor: "#cccccc",
                        color: "#999999",
                    },
                },
                text: {
                    "&.Mui-disabled": {
                        color: "#999999",
                    }
                }
            }
        }
    }
});


export default theme;