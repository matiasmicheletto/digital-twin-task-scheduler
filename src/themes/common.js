export const containerStyle = { 
  position: "absolute",
  top: "64px", // Below the navigation bar
  left: 0,
  width: "calc(100% - 20px)",
  flexDirection: "column",
  height: "calc(100vh - 84px)", // Full height minus small margins
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
  margin: "20px",
  padding: "16px", 
  borderRadius: "8px", 
  fontSize: "12px", 
  boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
};