/**
 * TECHNICAL CALIPERS COMPONENT
 * 
 * Neural-Physical Instrument UI
 * Renders measurement markings around canvas edges
 * Updates in real-time based on zoom/pan state
 */

class TechnicalCalipers {
    constructor(container, canvas, options = {}) {
        this.container = container;
        this.canvas = canvas;
        this.options = {
            majorTickSpacing: options.majorTickSpacing || 100,
            minorTicksPerMajor: options.minorTicksPerMajor || 5,
            trackWidth: options.trackWidth || 20,
            labelOffset: options.labelOffset || 8,
            scale: options.scale || 1,
            offsetX: options.offsetX || 0,
            offsetY: options.offsetY || 0,
            unit: options.unit || 'm',
            precision: options.precision || 1
        };

        this.build();
        this.update();

        // Observe canvas resize
        this.resizeObserver = new ResizeObserver(() => this.update());
        this.resizeObserver.observe(this.canvas);
    }

    build() {
        this.container.innerHTML = '';

        // SVG for crisp rendering
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.style.cssText = `
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;

        // Define styles
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
            <style>
                .caliper-line { stroke: #2A2A35; stroke-width: 1; }
                .caliper-line.major { stroke: #3A3A45; }
                .caliper-text { 
                    fill: #484850; 
                    font-family: 'JetBrains Mono', monospace; 
                    font-size: 8px;
                }
                .caliper-bg { fill: rgba(5, 5, 10, 0.9); }
            </style>
        `;
        this.svg.appendChild(defs);

        // Groups for different elements
        this.bgGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.tickGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        this.labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        this.svg.appendChild(this.bgGroup);
        this.svg.appendChild(this.tickGroup);
        this.svg.appendChild(this.labelGroup);

        this.container.appendChild(this.svg);
    }

    update() {
        const width = this.canvas.offsetWidth || this.canvas.width;
        const height = this.canvas.offsetHeight || this.canvas.height;
        const tw = this.options.trackWidth;
        const majorSpacing = this.options.majorTickSpacing * this.options.scale;
        const minorSpacing = majorSpacing / this.options.minorTicksPerMajor;

        // Clear previous
        this.bgGroup.innerHTML = '';
        this.tickGroup.innerHTML = '';
        this.labelGroup.innerHTML = '';

        // Background tracks
        this.drawRect(this.bgGroup, tw, 0, width - 2 * tw, tw, 'caliper-bg'); // Top
        this.drawRect(this.bgGroup, tw, height - tw, width - 2 * tw, tw, 'caliper-bg'); // Bottom
        this.drawRect(this.bgGroup, 0, tw, tw, height - 2 * tw, 'caliper-bg'); // Left
        this.drawRect(this.bgGroup, width - tw, tw, tw, height - 2 * tw, 'caliper-bg'); // Right

        // Top edge ticks
        for (let x = tw; x < width - tw; x += minorSpacing) {
            const isMajor = Math.abs(x - tw) % majorSpacing < 1;
            const tickHeight = isMajor ? 8 : 4;
            this.drawLine(this.tickGroup, x, tw - tickHeight, x, tw, isMajor);

            if (isMajor) {
                const value = ((x - tw) / this.options.scale + this.options.offsetX) / 100;
                this.drawLabel(this.labelGroup, x, this.options.labelOffset, value.toFixed(this.options.precision), 'middle');
            }
        }

        // Bottom edge ticks
        for (let x = tw; x < width - tw; x += minorSpacing) {
            const isMajor = Math.abs(x - tw) % majorSpacing < 1;
            const tickHeight = isMajor ? 8 : 4;
            this.drawLine(this.tickGroup, x, height - tw, x, height - tw + tickHeight, isMajor);

            if (isMajor) {
                const value = ((x - tw) / this.options.scale + this.options.offsetX) / 100;
                this.drawLabel(this.labelGroup, x, height - this.options.labelOffset + 4, value.toFixed(this.options.precision), 'middle');
            }
        }

        // Left edge ticks
        for (let y = tw; y < height - tw; y += minorSpacing) {
            const isMajor = Math.abs(y - tw) % majorSpacing < 1;
            const tickWidth = isMajor ? 8 : 4;
            this.drawLine(this.tickGroup, tw - tickWidth, y, tw, y, isMajor);

            if (isMajor) {
                const value = ((y - tw) / this.options.scale + this.options.offsetY) / 100;
                this.drawLabel(this.labelGroup, this.options.labelOffset, y + 3, value.toFixed(this.options.precision), 'start');
            }
        }

        // Right edge ticks
        for (let y = tw; y < height - tw; y += minorSpacing) {
            const isMajor = Math.abs(y - tw) % majorSpacing < 1;
            const tickWidth = isMajor ? 8 : 4;
            this.drawLine(this.tickGroup, width - tw, y, width - tw + tickWidth, y, isMajor);

            if (isMajor) {
                const value = ((y - tw) / this.options.scale + this.options.offsetY) / 100;
                this.drawLabel(this.labelGroup, width - this.options.labelOffset, y + 3, value.toFixed(this.options.precision), 'end');
            }
        }

        // Corner squares
        this.drawRect(this.bgGroup, 0, 0, tw, tw, 'caliper-bg');
        this.drawRect(this.bgGroup, width - tw, 0, tw, tw, 'caliper-bg');
        this.drawRect(this.bgGroup, 0, height - tw, tw, tw, 'caliper-bg');
        this.drawRect(this.bgGroup, width - tw, height - tw, tw, tw, 'caliper-bg');
    }

    drawRect(group, x, y, w, h, className) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
        rect.setAttribute('class', className);
        group.appendChild(rect);
    }

    drawLine(group, x1, y1, x2, y2, isMajor) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', `caliper-line${isMajor ? ' major' : ''}`);
        group.appendChild(line);
    }

    drawLabel(group, x, y, text, anchor) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', y);
        label.setAttribute('text-anchor', anchor);
        label.setAttribute('class', 'caliper-text');
        label.textContent = text;
        group.appendChild(label);
    }

    setScale(scale) {
        this.options.scale = scale;
        this.update();
    }

    setOffset(x, y) {
        this.options.offsetX = x;
        this.options.offsetY = y;
        this.update();
    }

    destroy() {
        this.resizeObserver.disconnect();
        this.container.innerHTML = '';
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('technical-calipers');
    const canvas = document.getElementById('simulation-canvas');

    if (container && canvas) {
        window.technicalCalipers = new TechnicalCalipers(container, canvas);
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TechnicalCalipers };
}
