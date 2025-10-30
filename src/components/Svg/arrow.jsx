const arrowLen = 10;
const arrowAngle = Math.PI / 6;

const Arrow = props => {

    const {
        from,
        to,
        idx
    } = props;

    if (!from || !to) return null;
    
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const ux = dx / len;
    const uy = dy / len;
    
    const startX = from.x + ux * 40;
    const startY = from.y + uy * 40;
    const endX = to.x - ux * 40;
    const endY = to.y - uy * 40;
    
    const angle = Math.atan2(dy, dx);
    
    return (
        <g key={idx}>
        <line
            x1={startX}
            y1={startY}
            x2={endX}
            y2={endY}
            stroke="#666"
            strokeWidth={2}/>
        <polygon
            points={`${endX},${endY} ${
                endX - arrowLen * Math.cos(angle - arrowAngle)
            },${
                endY - arrowLen * Math.sin(angle - arrowAngle)
            } ${
                endX - arrowLen * Math.cos(angle + arrowAngle)
            }, ${
                endY - arrowLen * Math.sin(angle + arrowAngle)
            }`}
            fill="#666"/>
        </g>
    );
};

export default Arrow;