
const svgStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 0
};

const lineRectIntersection = (px, py, qx, qy, rect) => {
    // line from P(px,py) to Q(qx,qy).
    // rect: { left, top, right, bottom } in same coords
    // returns intersection point on rect boundary nearest to Q, or Q if Q is outside
    const { left, top, right, bottom } = rect;
    const dx = qx - px;
    const dy = qy - py;
    const candidates = [];

    // helper to push t in [0,1] with computed point
    const pushT = (t, x, y) => {
        if (t >= 0 && t <= 1) candidates.push({ t, x, y });
    };

    // intersect with left vertical x = left
    if (dx !== 0) {
        const tLeft = (left - px) / dx;
        const yLeft = py + tLeft * dy;
        if (yLeft >= top - 1e-6 && yLeft <= bottom + 1e-6) pushT(tLeft, left, yLeft);
    }
    // right vertical
    if (dx !== 0) {
        const tRight = (right - px) / dx;
        const yRight = py + tRight * dy;
        if (yRight >= top - 1e-6 && yRight <= bottom + 1e-6) pushT(tRight, right, yRight);
    }
    // top horizontal y = top
    if (dy !== 0) {
        const tTop = (top - py) / dy;
        const xTop = px + tTop * dx;
        if (xTop >= left - 1e-6 && xTop <= right + 1e-6) pushT(tTop, xTop, top);
    }
    // bottom horizontal
    if (dy !== 0) {
        const tBottom = (bottom - py) / dy;
        const xBottom = px + tBottom * dx;
        if (xBottom >= left - 1e-6 && xBottom <= right + 1e-6) pushT(tBottom, xBottom, bottom);
    }

    if (candidates.length === 0) {
        // fallback: return center
        return { x: qx, y: qy };
    }
    // choose intersection with largest t (closest to Q)
    candidates.sort((a, b) => b.t - a.t);
    return { x: candidates[0].x, y: candidates[0].y };
};

const EdgesLayer = ({ boardRef, nodeRects, precedences }) => {
    if (!boardRef.current) return null;

    return (
        <svg
            style={svgStyle}>
            {precedences.map((e) => {
                const f = nodeRects[e.from];
                const t = nodeRects[e.to];
                if (!f || !t) return null;

                const x1 = f.cx;
                const y1 = f.cy;
                const x2 = t.cx;
                const y2 = t.cy;

                // find intersection with target rect boundary
                const tgtRect = { left: t.left, top: t.top, right: t.right, bottom: t.bottom };
                const endPt = lineRectIntersection(x1, y1, x2, y2, tgtRect);

                // compute arrowhead
                const dx = endPt.x - x1;
                const dy = endPt.y - y1;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const ux = dx / len;
                const uy = dy / len;

                const arrowLen = 10; // length of arrow tip
                const arrowBaseX = endPt.x - ux * arrowLen;
                const arrowBaseY = endPt.y - uy * arrowLen;
                const ah = 6; // half width of arrow
                const leftX = arrowBaseX - uy * ah;
                const leftY = arrowBaseY + ux * ah;
                const rightX = arrowBaseX + uy * ah;
                const rightY = arrowBaseY - ux * ah;

                return (
                    <g key={e.id}>
                        <line x1={x1} y1={y1} x2={arrowBaseX} y2={arrowBaseY} stroke={"#444"} strokeWidth={2} />
                        <polygon points={`${endPt.x},${endPt.y} ${leftX},${leftY} ${rightX},${rightY}`} fill={"#444"} />
                    </g>
                );
            })}
        </svg>
    );
};

export default EdgesLayer;