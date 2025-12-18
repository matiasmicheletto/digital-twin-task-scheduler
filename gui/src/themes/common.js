export const containerStyle = { 
  position: "absolute",
  top: 0,
  left: 0,
  width: "calc(100vw - 20px)", // Full width minus some margin
  height: "calc(100vh - 20px)", // Full height minus AppBar
  display: "flex",
  flexDirection: "column",
  margin: "10px", // Small margin around the entire component
  overflow: "hidden" // Prevent Paper from scrolling
};

export const sidePanelStyle = { 
  width: 400, 
  borderRight: "1px solid #444", 
  p: 1,
  height: "calc(100vh - 132px)", // Full height minus toolbars
  overflowY: "auto",
  overflowX: "hidden",
  display: "flex",
  flexDirection: "column"
};

export const svgStyle = { // Full size SVG canvas
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 0
};

export const actionsTooltipStyle = { // Help box in canvas
  position: "fixed", 
  bottom: 0, 
  right: 0, 
  marginRight: "20px",
  marginBottom: "20px",
  padding: "16px", 
  borderRadius: "8px", 
  fontSize: "12px", 
  boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
};