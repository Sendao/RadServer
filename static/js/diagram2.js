// Diagram Library
// Utility:
// Seeded Random Number Generator (Linear Congruential Generator)
function SeededRandom(seed = 0) {
    this.seed = seed;
    this.a = 1664525; // Multiplier
    this.c = 1013904223; // Increment
    this.m = 4294967296; // Modulus (2^32)

    this.next = function() {
        this.seed = (this.a * this.seed + this.c) % this.m;
        return this.seed / this.m; // Normalize to [0, 1)
    };
}
const rng = new SeededRandom(0);

// Line segment intersection:
function lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    // Check for degenerate segments
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) return null;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    // Use epsilon for near-parallel lines
    if (Math.abs(denom) < 1e-10) return null;

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    // Use epsilon for bounds check
    const epsilon = 1e-10;
    if (t >= -epsilon && t <= 1 + epsilon && u >= -epsilon && u <= 1 + epsilon) {
        return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
    }
    return null;
}

class Diagram {
    constructor(canvasId, width = 800, height = 600, layout = 'spring') {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = width;
        this.canvas.height = height;
        this.shapes = [];
        this.connectors = [];
        this.layout = layout; // 'spring', 'radial', or 'manual'
        this.padding = 20; // Padding between shapes
        this.springStrength = 0.1; // Force strength for spring layout
        this.springLength = 150; // Desired distance between shapes for spring layout
        this.iterations = 50; // Number of iterations for spring layout

        // Default style settings
        this.styles = {
            font: '16px Arial',
            textColor: '#000000',
            connectorColor: '#000000',
            defaultFill: '#ffffff',
            hoverFill: '#e6e6e6',
            strokeWidth: 4 // Matches current shape stroke width
        };
    }


    setStyle(styles = {}) {
        // Merge provided styles with default styles, overriding defaults
        this.styles = {
            ...this.styles,
            ...styles
        };

        // Update canvas context font immediately if changed
        if (styles.font) {
            this.ctx.font = this.styles.font;
        }
    }

    setLayout(layout) {
        this.layout = layout;
        this.applyLayout();
    }

    addShape(type, text, options = {}) {
        if (options.stroke) options.strokeColor = options.stroke;
        if (options.fill) options.fillColor = options.fill;
        if (!options.strokeColor) options.strokeColor = '#000000';
        if (!options.fillColor) options.fillColor = this.getDefaultFillColor(); // Use palette or default style

        const shapeOptions = {
            fillColor: options.fillColor || this.styles.defaultFill,
            strokeColor: options.strokeColor || this.styles.connectorColor, // Use connector color as fallback for stroke
            label: text,
            rounded: options.rounded || 0,
            strokeWidth: options.strokeWidth || this.styles.strokeWidth,
            textColor: options.textColor || this.styles.textColor
        };

        // Calculate size based on actual text size (no division by two here)
        const size = this.calculateSize(text);
        shapeOptions.size = size;

        if (this.layout === 'manual') {
            shapeOptions.x = options.x || (rng.next()*50-25);
            shapeOptions.y = options.y || (rng.next()*50-25);
        }

        const shape = new Shape(this, type, shapeOptions.x, shapeOptions.y, size, shapeOptions);
        this.shapes.push(shape);
        this.applyLayout();
        return shape;
    }

    isPointInShape(mouseX, mouseY, shape) {
        if (!(shape instanceof Shape)) {
            throw new Error('The shape parameter must be an instance of Shape');
        }
        return shape.isPointInside(mouseX, mouseY);
    }

    addConnector(start, end, options = {}) {
        if (!(start instanceof Shape)) {
            start = this.shapes[start];
        }
        if (!(end instanceof Shape)) {
            end = this.shapes[end];
        }
        this.connectors.push(new Connector(start, end, {
            ...options,
            strokeColor: options.strokeColor || this.styles.connectorColor,
            strokeWidth: options.strokeWidth || 3 // Use 3 as default for bolder lines, matching your change
        }));
        this.applyLayout();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.shapes.forEach(shape => shape.draw(this.ctx));
        this.connectors.forEach(connector => connector.draw(this.ctx));
    }

    autoFillColor(strokeColor) {
        // Convert stroke color to RGB, darken it (reduce brightness by 20%)
        const rgb = this.hexToRgb(strokeColor);
        const darkened = rgb.map(val => Math.max(0, val - 51)); // Reduce each channel by 20% (51/255)
        return `rgb(${darkened[0]}, ${darkened[1]}, ${darkened[2]})`;
    }

    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
    }


    calculateSize(text) {
        // Measure actual text size and calculate shape size to fit (no division by two here)
        this.ctx.font = this.styles.font; // Use the current font from styles
        const metrics = this.ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = 20; // Approximate height for 16px Arial (adjust if font changes)
        const padding = 10; // Padding around text
        let size = Math.max(30, Math.ceil(textWidth + padding * 2), Math.ceil(textHeight + padding * 2));

        // Apply a scaling factor for polygons (triangle, pentagon) to prevent them from being too large
        // Cap the size at 100 for polygons to match the typical size of circles and squares
        if (this.shapes.length > 0 && this.shapes[this.shapes.length - 1].type !== 'circle' && 
            this.shapes[this.shapes.length - 1].type !== 'rectangle' && 
            this.shapes[this.shapes.length - 1].type !== 'square') {
            size = Math.min(size, 100); // Cap polygon size at 100
        }
        return size;
    }

    getLuminance(rgb) {
        // Calculate luminance for RGB (approximate)
        const [r, g, b] = rgb.map(val => val / 255);
        return 0.299 * r + 0.587 * g + 0.114 * b;
    }

    autoTextColor(fillColor) {
        // Convert fill color to RGB
        const rgb = this.hexToRgb(fillColor);
        const luminance = this.getLuminance(rgb);
        return luminance > 0.5 ? '#000000' : '#ffffff'; // Dark text on light, light on dark
    }

    getDefaultFillColor() {
        // Palette of agreeable fill colors
        const colorPalette = [
            '#ff9999', // Light red
            '#99ff99', // Light green
            '#9999ff', // Light blue
            '#ffcc99', // Light orange
            '#cc99ff', // Light purple
            '#99ffcc', // Light teal
            '#ff99cc', // Light pink
            '#ccff99'  // Light yellow-green
        ];
        // Cycle through colors based on the number of shapes
        return colorPalette[this.shapes.length % colorPalette.length];
    }

    applyLayout() {
        if (this.layout === 'spring') {
            this.springLayout();
        } else if (this.layout === 'radial') {
            this.radialLayout();
        }
    }

    springLayout() {
        const nodes = this.shapes;
        const edges = this.connectors;

        // Use seeded random number generator for deterministic randomness (seed = 0)
        let loopmax = 10000;

        // Deterministic initial placement using seeded random numbers
        nodes.forEach(node => {
            if (!node.x || !node.y) {
                node.x = rng.next() * this.canvas.width;
                node.y = rng.next() * this.canvas.height;
                // Ensure positions stay within bounds and account for size
                node.x = Math.max(node.size + this.padding, Math.min(this.canvas.width - node.size - this.padding, node.x));
                node.y = Math.max(node.size + this.padding, Math.min(this.canvas.height - node.size - this.padding, node.y));
            }
        });

        // Spring simulation with deterministic forces
        for (let i = 0; i < this.iterations; i++) {
            loopmax--;
            if( loopmax <= 0 ) {
                console.warn("Reached loopmax");
                break;
            }
            // Repulsive forces (all pairs) with collision detection
            for (let j = 0; j < nodes.length; j++) {
                for (let k = j + 1; k < nodes.length; k++) {
                    const a = nodes[j];
                    const b = nodes[k];
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    const minDistance = a.size + b.size + this.padding; // Approximate collision distance

                    if (distance < minDistance) {
                        // Push shapes apart to prevent overlap
                        const force = (minDistance - distance) * 0.5; // Adjust force for collision
                        a.x -= dx * force / distance;
                        a.y -= dy * force / distance;
                        b.x += dx * force / distance;
                        b.y += dy * force / distance;
                    } else {
                        // Normal repulsive force
                        const force = this.springStrength * (this.springLength - distance) / distance;
                        a.x -= dx * force;
                        a.y -= dy * force;
                        b.x += dx * force;
                        b.y += dy * force;
                    }
                }
            }

            // Attractive forces (connected nodes)
            edges.forEach(edge => {
                const a = edge.start instanceof Shape ? edge.start : null;
                const b = edge.end instanceof Shape ? edge.end : null;
                if (a && b) {
                    const dx = b.x - a.x;
                    const dy = b.y - a.y;
                    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                    const force = -this.springStrength * (distance - this.springLength) / distance;
                    a.x += dx * force;
                    a.y += dy * force;
                    b.x -= dx * force;
                    b.y -= dy * force;
                }
            });

            // Keep shapes within canvas bounds
            nodes.forEach(node => {
                node.x = Math.max(node.size + this.padding, Math.min(this.canvas.width - node.size - this.padding, node.x));
                node.y = Math.max(node.size + this.padding, Math.min(this.canvas.height - node.size - this.padding, node.y));
            });

            // Validate no line crossings
            if (this.hasLineCrossings()) {
                // Randomize positions using the seeded random number generator and restart this iteration
                nodes.forEach((node, idx) => {
                    node.x = rng.next() * this.canvas.width;
                    node.y = rng.next() * this.canvas.height;
                    // Ensure positions stay within bounds and account for size
                    node.x = Math.max(node.size + this.padding, Math.min(this.canvas.width - node.size - this.padding, node.x));
                    node.y = Math.max(node.size + this.padding, Math.min(this.canvas.height - node.size - this.padding, node.y));
                });
                i=-1; // start over from zero
            }
        }
    }


    radialLayout() {
        const nodes = this.shapes;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) / 2 - 50; // Leave some margin

        nodes.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / nodes.length;
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        });
    }
    hasLineCrossings() {
        const edges = this.connectors;
        const nodes = this.shapes;
        let m, n;

        // Check for crossings between connectors (using curve approximation for curved lines)
        for (m = 0; m < edges.length; m++) {
            for (n = m + 1; n < edges.length; n++) {
                const edge1 = edges[m];
                const edge2 = edges[n];
                if (!(edge1.start instanceof Shape) || !(edge1.end instanceof Shape) || 
                    !(edge2.start instanceof Shape) || !(edge2.end instanceof Shape)) continue;

                const s1 = edge1.start.getEdgePoint(edge1.end.x, edge1.end.y);
                const e1 = edge1.end.getEdgePoint(edge1.start.x, edge1.start.y);
                const s2 = edge2.start.getEdgePoint(edge2.end.x, edge2.end.y);
                const e2 = edge2.end.getEdgePoint(edge2.start.x, edge2.start.y);

                // Approximate curves for both connectors if they are curved
                const segments1 = edge1.isCurved ? this.approximateCurve(edge1, s1, e1) : [[s1, e1]];
                const segments2 = edge2.isCurved ? this.approximateCurve(edge2, s2, e2) : [[s2, e2]];

                // Check for crossings between segments of both connectors
                for (let seg1 of segments1) {
                    for (let seg2 of segments2) {
                        if (lineIntersect(seg1[0].x, seg1[0].y, seg1[1].x, seg1[1].y, 
                                        seg2[0].x, seg2[0].y, seg2[1].x, seg2[1].y)) {
                            return true; // Lines (or curve segments) cross
                        }
                    }
                }
            }
        }

        // Check for crossings between connectors and shapes (exclude connected shapes, using curve approximation for curved lines)
        for (let edge of edges) {
            const start = edge.start instanceof Shape ? edge.start : null;
            const end = edge.end instanceof Shape ? edge.end : null;
            if (!start || !end) continue; // Skip if start or end isn’t a Shape

            const s = start.getEdgePoint(end.x, end.y);
            const e = end.getEdgePoint(start.x, start.y);

            // Approximate the curve if it's curved, otherwise use straight line
            const segments = edge.isCurved ? this.approximateCurve(edge, s, e) : [[s, e]];

            for (let node of nodes) {
                // Skip the shapes this connector is connected to
                if (node === start || node === end) continue;

                // Check if any segment of the connector intersects the shape's boundary
                for (let [startPoint, endPoint] of segments) {
                    if (node.lineIntersects(startPoint.x, startPoint.y, endPoint.x, endPoint.y)) {
                        return true; // Line or curve segment crosses an unconnected shape
                    }
                }
            }
        }

        return false; // No crossings found
    }

    approximateCurve(edge, startPoint, endPoint) {
        const segments = 10; // Number of segments to approximate the curve
        const points = [];
        const sx = startPoint.x;
        const sy = startPoint.y;
        const ex = endPoint.x;
        const ey = endPoint.y;
        const cpX = (sx + ex) / 2 + (ey - sy) * edge.curveRatio;
        const cpY = (sy + ey) / 2 + (sx - ex) * edge.curveRatio;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const mt = 1 - t;
            const x = mt * mt * sx + 2 * mt * t * cpX + t * t * ex;
            const y = mt * mt * sy + 2 * mt * t * cpY + t * t * ey;
            points.push({ x, y });
        }

        const curveSegments = [];
        for (let i = 0; i < points.length - 1; i++) {
            curveSegments.push([points[i], points[i + 1]]);
        }
        return curveSegments;
    }
}

class Shape {
    constructor(dia, type, x, y, size, options = {}) {
        if (!options.stroke) options.stroke = options.strokeColor;
        if (!options.stroke) options.stroke = '#000000';

        if (!options.fill) options.fill = options.fillColor;
        if (!options.fill) options.fill = dia.styles.defaultFill; // Use global default fill

        if (!options.color) options.color = options.textColor;
        if (!options.color) options.color = dia.styles.textColor; // Use global text color

        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.rounded = options.rounded || 0;
        this.fillColor = options.fill;
        this.strokeColor = options.stroke;
        this.label = options.label || '';
        this.textColor = options.color;
        this.strokeWidth = options.strokeWidth || dia.styles.strokeWidth; // Use global stroke width

        // Update draw method to use the font from styles
        this.font = dia.styles.font;
    }

    draw(ctx) {
        ctx.beginPath();
        const r = this.rounded;
        let s = this.size;

        // Only divide size by 2 for circles to get radius
        if (this.type === 'circle') {
            s = s / 2;
            ctx.arc(this.x, this.y, s, 0, Math.PI * 2);
        } else {
            const sides = {
                'triangle': 3,
                'rectangle': 4,
                'square': 4,
                'pentagon': 5
            }[this.type];
            const angleStep = (2 * Math.PI) / sides;
            let startAngle = this.type === 'triangle' ? Math.PI / 2 : 0;

            for (let i = 0; i < sides; i++) {
                const angle = startAngle + i * angleStep;
                const x = this.x + s * Math.cos(angle);
                const y = this.y + s * Math.sin(angle);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else if (r > 0 && this.type !== 'rectangle' && this.type !== 'square') {
                    const prevX = this.x + s * Math.cos(angle - angleStep);
                    const prevY = this.y + s * Math.sin(angle - angleStep);
                    ctx.arcTo(prevX, prevY, x, y, r);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();

            if (this.type === 'rectangle' || this.type === 'square') {
                const w = this.type === 'square' ? s : s * 1.5;
                const h = s;
                ctx.beginPath();
                ctx.moveTo(this.x - w / 2 + r, this.y - h / 2);
                ctx.lineTo(this.x + w / 2 - r, this.y - h / 2);
                ctx.arcTo(this.x + w / 2, this.y - h / 2, this.x + w / 2, this.y - h / 2 + r, r);
                ctx.lineTo(this.x + w / 2, this.y + h / 2 - r);
                ctx.arcTo(this.x + w / 2, this.y + h / 2, this.x + w / 2 - r, this.y + h / 2, r);
                ctx.lineTo(this.x - w / 2 + r, this.y + h / 2);
                ctx.arcTo(this.x - w / 2, this.y + h / 2, this.x - w / 2, this.y + h / 2 - r, r);
                ctx.lineTo(this.x - w / 2, this.y - h / 2 + r);
                ctx.arcTo(this.x - w / 2, this.y - h / 2, this.x - w / 2 + r, this.y - h / 2, r);
                ctx.closePath();
            }
        }

        ctx.fillStyle = this.fillColor;
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.strokeWidth;
        ctx.stroke();

        if (this.label) {
            ctx.fillStyle = this.textColor;
            ctx.font = this.font; // Use the font from styles
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.label, this.x, this.y);
        }
    }

    isPointInside(x, y) {
        // Check if point (x, y) is inside the shape
        if (this.type === 'circle') {
            // Use distance formula for circle (radius = size / 2)
            const dx = x - this.x;
            const dy = y - this.y;
            const r = this.size / 2;
            return dx * dx + dy * dy <= r * r; // Point is inside if distance <= radius^2
        } else {
            // For polygons (triangle, pentagon, rectangle, square), use point-in-polygon test
            const sides = {
                'triangle': 3,
                'rectangle': 4,
                'square': 4,
                'pentagon': 5
            }[this.type];
            const angleStep = (2 * Math.PI) / sides;
            let startAngle = this.type === 'triangle' ? Math.PI / 2 : 0;
            let s = this.size;
            let inside = false;

            // Ray-casting algorithm (count intersections with horizontal ray from point to right)
            for (let i = 0; i < sides; i++) {
                const a1 = startAngle + i * angleStep;
                const a2 = startAngle + (i + 1) * angleStep;
                const x1 = this.x + s * Math.cos(a1);
                const y1 = this.y + s * Math.sin(a1);
                const x2 = this.x + s * Math.cos(a2);
                const y2 = this.y + s * Math.sin(a2);

                // Check if the point is on the edge (within epsilon for floating-point precision)
                const epsilon = 1e-10;
                if (Math.abs(this.distanceToLine(x, y, x1, y1, x2, y2)) < epsilon) {
                    return true; // Point is on the edge, consider it inside
                }

                // Ray-casting: Count intersections with horizontal ray from (x, y) to right
                if (((y1 > y) !== (y2 > y)) && // One point above, one below the ray
                    (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1)) {
                    inside = !inside;
                }
            }

            // Handle rectangles/squares with their bounding box
            if (this.type === 'rectangle' || this.type === 'square') {
                const w = this.type === 'square' ? s : s * 1.5;
                const h = s;
                const left = this.x - w / 2;
                const right = this.x + w / 2;
                const top = this.y - h / 2;
                const bottom = this.y + h / 2;
                return x >= left && x <= right && y >= top && y <= bottom;
            }

            return inside;
        }
    }

    distanceToLine(x, y, x1, y1, x2, y2) {
        // Calculate the perpendicular distance from point (x, y) to line segment (x1, y1) to (x2, y2)
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;

        if (len_sq !== 0) { // In case of zero-length segment
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    lineIntersects(x1, y1, x2, y2) {
        // Check if the line segment (x1, y1) to (x2, y2) intersects the shape's boundary
        if (this.type === 'circle') {
            // Use circle-line intersection formula
            const dx = x2 - x1;
            const dy = y2 - y1;
            const cx = this.x;
            const cy = this.y;
            const r = this.size / 2; // Radius for circle

            const a = dx * dx + dy * dy;
            const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
            const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;

            const discriminant = b * b - 4 * a * c;
            if (discriminant < 0) return false; // No intersection

            const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
            const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);

            // Check if intersection points are within the line segment (0 <= t <= 1)
            return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
        } else {
            // For polygons (triangle, pentagon, rectangle, square), check against each edge
            const sides = {
                'triangle': 3,
                'rectangle': 4,
                'square': 4,
                'pentagon': 5
            }[this.type];
            const angleStep = (2 * Math.PI) / sides;
            let startAngle = this.type === 'triangle' ? Math.PI / 2 : 0;
            let s = this.size;

            for (let i = 0; i < sides; i++) {
                const a1 = startAngle + i * angleStep;
                const a2 = startAngle + (i + 1) * angleStep;
                const x3 = this.x + s * Math.cos(a1);
                const y3 = this.y + s * Math.sin(a1);
                const x4 = this.x + s * Math.cos(a2);
                const y4 = this.y + s * Math.sin(a2);

                if (lineIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) {
                    return true; // Line intersects this edge
                }
            }

            // Special case for rectangle/square
            if (this.type === 'rectangle' || this.type === 'square') {
                const w = this.type === 'square' ? s : s * 1.5;
                const h = s;
                const edges = [
                    { x1: this.x - w / 2, y1: this.y - h / 2, x2: this.x + w / 2, y2: this.y - h / 2 }, // Top
                    { x1: this.x + w / 2, y1: this.y - h / 2, x2: this.x + w / 2, y2: this.y + h / 2 }, // Right
                    { x1: this.x + w / 2, y1: this.y + h / 2, x2: this.x - w / 2, y2: this.y + h / 2 }, // Bottom
                    { x1: this.x - w / 2, y1: this.y + h / 2, x2: this.x - w / 2, y2: this.y - h / 2 }  // Left
                ];
                for (let edge of edges) {
                    if (lineIntersect(x1, y1, x2, y2, edge.x1, edge.y1, edge.x2, edge.y2)) {
                        return true; // Line intersects this edge
                    }
                }
            }

            return false; // No intersection found
        }
    }

    getEdgePoint(targetX, targetY) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const angle = Math.atan2(dy, dx);
        let edgeX, edgeY;

        if (this.type === 'circle') {
            edgeX = this.x + (this.size / 2) * Math.cos(angle); // Use size/2 for radius
            edgeY = this.y + (this.size / 2) * Math.sin(angle);
        } else if (this.type === 'rectangle' || this.type === 'square') {
            const w = this.type === 'square' ? this.size : this.size * 1.5;
            const h = this.size;
            const t = Math.min(
                Math.abs(w / 2 / dx),
                Math.abs(h / 2 / dy)
            );
            edgeX = this.x + t * dx;
            edgeY = this.y + t * dy;
            edgeX = Math.max(this.x - w / 2, Math.min(this.x + w / 2, edgeX));
            edgeY = Math.max(this.y - h / 2, Math.min(this.y + h / 2, edgeY));
        } else {
            const sides = { 'triangle': 3, 'pentagon': 5 }[this.type];
            const angleStep = (2 * Math.PI) / sides;
            let startAngle = this.type === 'triangle' ? Math.PI / 2 : 0;
            let minDist = Infinity;
            for (let i = 0; i < sides; i++) {
                const a1 = startAngle + i * angleStep;
                const a2 = startAngle + (i + 1) * angleStep;
                const x1 = this.x + this.size * Math.cos(a1);
                const y1 = this.y + this.size * Math.sin(a1);
                const x2 = this.x + this.size * Math.cos(a2);
                const y2 = this.y + this.size * Math.sin(a2);
                const intersect = lineIntersect(this.x, this.y, targetX, targetY, x1, y1, x2, y2);
                if (intersect) {
                    const dist = (intersect.x - this.x) ** 2 + (intersect.y - this.y) ** 2;
                    if (dist < minDist) {
                        minDist = dist;
                        edgeX = intersect.x;
                        edgeY = intersect.y;
                    }
                }
            }
        }
        return { x: edgeX, y: edgeY };
    }
}

class Connector {
    constructor(start, end, options = {}) {
        this.start = start;
        this.end = end;
        if (!options.stroke) options.stroke = options.strokeColor;
        if (!options.stroke) options.stroke = '#000000';
        this.strokeColor = options.stroke || this.start?.diagram?.styles?.connectorColor || '#000000'; // Use global connector color if available
        this.isCurved = options.isCurved || false;
        this.curveRatio = options.curveRatio || 0.5;
        this.offsetStart = options.offsetStart || { x: 0, y: 0 };
        this.offsetEnd = options.offsetEnd || { x: 0, y: 0 };
    }

    draw(ctx) {
        let sx, sy, ex, ey;
        if (this.start instanceof Shape) {
            const edge = this.start.getEdgePoint(this.end.x, this.end.y);
            sx = edge.x + this.offsetStart.x;
            sy = edge.y + this.offsetStart.y;
        } else {
            sx = this.start.x + this.offsetStart.x;
            sy = this.start.y + this.offsetStart.y;
        }
        if (this.end instanceof Shape) {
            const edge = this.end.getEdgePoint(this.start.x, this.start.y);
            ex = edge.x + this.offsetEnd.x;
            ey = edge.y + this.offsetEnd.y;
        } else {
            ex = this.end.x + this.offsetEnd.x;
            ey = this.end.y + this.offsetEnd.y;
        }

        ctx.beginPath();
        ctx.moveTo(sx, sy);

        if (this.isCurved) {
            const cpX = (sx + ex) / 2 + (ey - sy) * this.curveRatio;
            const cpY = (sy + ey) / 2 + (sx - ex) * this.curveRatio;
            ctx.quadraticCurveTo(cpX, cpY, ex, ey);
        } else {
            ctx.lineTo(ex, ey);
        }

        ctx.lineWidth = 3; // Bolder lines as per your change
        ctx.strokeStyle = this.strokeColor;
        ctx.stroke();
    }
}
