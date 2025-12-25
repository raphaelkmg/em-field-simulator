/**
 * VISUALIZATION RENDERER - NEURAL-PHYSICAL EDITION
 * 
 * Laboratory instrument aesthetic with:
 * - Parallax depth grid
 * - Flow particles along field lines
 * - Topographic iso-contours
 * - Scientific primary color palette
 */

class EMRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Animation time
        this.animTime = 0;
        this.lastTime = Date.now();

        // Mouse position for parallax
        this.mouseX = 0.5;
        this.mouseY = 0.5;

        // Rendering settings
        this.arrowScale = 1.0;
        this.arrowMaxLength = 30;
        this.fieldLineWidth = 1.5;
        this.particleRadius = 10;
        this.trailWidth = 2;

        // Scientific Primary Color Palette
        this.colors = {
            // Base
            background: '#05050A',
            surfaceDark: '#0A0A0F',

            // Accents
            cadmiumOrange: '#E65100',
            cobaltBlue: '#1565C0',
            phosphorGreen: '#4CAF50',
            phosphorGreenBright: '#66BB6A',

            // Field visualization
            positive: '#E65100',      // Cadmium Orange for positive charges
            negative: '#1565C0',      // Cobalt Blue for negative charges
            fieldLinePos: '#4CAF50',  // Phosphor Green for field lines
            fieldLineNeg: '#1565C0',  // Cobalt Blue
            vectorField: '#4CAF50',

            // Wave visualization
            wave: '#4CAF50',          // Phosphor Green for E-field
            waveMagnetic: '#1565C0',  // Cobalt Blue for H-field

            // Grid
            gridMajor: '#1A1A22',
            gridMinor: '#101018',

            // Text
            textDim: '#484850',
            textSecondary: '#686870'
        };

        // Flow particle system
        this.flowParticles = [];
        this.maxFlowParticles = 500;

        // Iso-contour settings
        this.contourLevels = 12;

        // Bind mouse tracking
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) / rect.width;
        this.mouseY = (e.clientY - rect.top) / rect.height;
    }

    handleMouseLeave() {
        // Smoothly return to center
        this.mouseX = 0.5;
        this.mouseY = 0.5;
    }

    tick() {
        const now = Date.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.animTime += dt;

        // Update flow particles
        this.updateFlowParticles(dt);
    }

    clear() {
        const ctx = this.ctx;

        // Deep obsidian background
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.width, this.height);

        // Parallax grid
        this.drawParallaxGrid();
    }

    drawParallaxGrid() {
        const ctx = this.ctx;
        const spacing = 50;
        const parallaxFactor = 0.015;

        // Calculate parallax offset based on mouse position
        const offsetX = (this.mouseX - 0.5) * spacing * parallaxFactor * 10;
        const offsetY = (this.mouseY - 0.5) * spacing * parallaxFactor * 10;

        // Fading grid from center
        const cx = this.width / 2;
        const cy = this.height / 2;

        // Minor grid lines (1px, very subtle)
        ctx.strokeStyle = this.colors.gridMinor;
        ctx.lineWidth = 1;

        for (let x = spacing + offsetX; x < this.width + spacing; x += spacing) {
            const dist = Math.abs(x - cx) / (this.width / 2);
            ctx.globalAlpha = 0.15 * (1 - dist * 0.7);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + offsetY * 0.3, this.height);
            ctx.stroke();
        }

        for (let y = spacing + offsetY; y < this.height + spacing; y += spacing) {
            const dist = Math.abs(y - cy) / (this.height / 2);
            ctx.globalAlpha = 0.15 * (1 - dist * 0.7);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y + offsetX * 0.3);
            ctx.stroke();
        }

        // Major grid lines (every 5th line)
        ctx.strokeStyle = this.colors.gridMajor;

        for (let x = spacing * 5 + offsetX; x < this.width + spacing; x += spacing * 5) {
            const dist = Math.abs(x - cx) / (this.width / 2);
            ctx.globalAlpha = 0.25 * (1 - dist * 0.5);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + offsetY * 0.3, this.height);
            ctx.stroke();
        }

        for (let y = spacing * 5 + offsetY; y < this.height + spacing; y += spacing * 5) {
            const dist = Math.abs(y - cy) / (this.height / 2);
            ctx.globalAlpha = 0.25 * (1 - dist * 0.5);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y + offsetX * 0.3);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    // LED-style glow effect (subtle, not neon)
    drawIndicatorGlow(x, y, radius, color, intensity = 1) {
        const ctx = this.ctx;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + '44');
        gradient.addColorStop(1, 'transparent');

        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = intensity * 0.3;
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    drawCharge(x, y, charge, radius = 16) {
        const ctx = this.ctx;
        const isPositive = charge >= 0;
        const color = isPositive ? this.colors.positive : this.colors.negative;

        // Subtle indicator glow
        this.drawIndicatorGlow(x, y, radius * 3, color, 0.5);

        // Ring indicator
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = color + '40';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Main charge circle with beveled edge look
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        // Gradient for 3D instrument look
        const gradient = ctx.createLinearGradient(x, y - radius, x, y + radius);
        gradient.addColorStop(0, this.colors.surfaceDark);
        gradient.addColorStop(0.5, '#1E1E26');
        gradient.addColorStop(1, this.colors.surfaceDark);

        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // LED indicator dot at top
        ctx.beginPath();
        ctx.arc(x, y - radius + 4, 2, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Sign label
        ctx.fillStyle = color;
        ctx.font = `bold ${radius * 0.9}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isPositive ? '+' : '−', x, y + 1);
    }

    drawChargeSystem(chargeSystem) {
        for (const charge of chargeSystem.charges) {
            const radius = Math.min(20, Math.max(10, Math.abs(charge.charge) * 1e9 * 4));
            this.drawCharge(charge.x, charge.y, charge.charge, radius);
        }
    }

    drawArrow(x, y, dx, dy, color = this.colors.vectorField, maxLength = this.arrowMaxLength) {
        const ctx = this.ctx;
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length < 1) return;

        const scale = Math.min(maxLength, length * this.arrowScale) / length;
        const endX = x + dx * scale;
        const endY = y + dy * scale;
        const angle = Math.atan2(dy, dx);

        // Clean line (no glow)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'square';
        ctx.stroke();

        // Arrow head
        const headLength = 5;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    drawVectorField(fieldVectors, colormap = null) {
        const maxMag = Math.max(...fieldVectors.map(v => v.magnitude), 1e-10);
        for (const v of fieldVectors) {
            let color = this.colors.vectorField;
            if (colormap) {
                const normalized = Math.min(1, Math.log10(v.magnitude + 1) / Math.log10(maxMag + 1));
                color = colormap(normalized);
            }
            this.drawArrow(v.x, v.y, v.Ex, v.Ey, color);
        }
    }

    // ==========================================
    // FLOW PARTICLES - Replaces solid field lines
    // ==========================================

    initFlowParticles(fieldLines) {
        this.flowParticles = [];

        for (const line of fieldLines) {
            if (line.points.length < 2) continue;

            // Create multiple particles per line
            const particleCount = Math.min(8, Math.ceil(line.points.length / 15));

            for (let i = 0; i < particleCount; i++) {
                this.flowParticles.push({
                    line: line,
                    position: Math.random(), // 0-1 along the path
                    speed: 0.3 + Math.random() * 0.4, // Variable speed
                    fromPositive: line.fromPositive
                });
            }
        }
    }

    updateFlowParticles(dt) {
        for (const particle of this.flowParticles) {
            particle.position += particle.speed * dt;
            if (particle.position > 1) {
                particle.position = 0;
            }
        }
    }

    drawFlowParticles(fieldLines) {
        const ctx = this.ctx;

        // First draw faint path lines
        for (const line of fieldLines) {
            if (line.points.length < 2) continue;

            const color = line.fromPositive ? this.colors.phosphorGreen : this.colors.cobaltBlue;

            ctx.beginPath();
            ctx.moveTo(line.points[0].x, line.points[0].y);
            for (let i = 1; i < line.points.length; i++) {
                ctx.lineTo(line.points[i].x, line.points[i].y);
            }
            ctx.strokeStyle = color + '15'; // Very faint
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // If particles not initialized, do so
        if (this.flowParticles.length === 0 && fieldLines.length > 0) {
            this.initFlowParticles(fieldLines);
        }

        // Draw flow particles as dashes
        for (const particle of this.flowParticles) {
            const line = particle.line;
            const points = line.points;
            if (points.length < 2) continue;

            // Get position along path
            const idx = Math.floor(particle.position * (points.length - 1));
            const nextIdx = Math.min(idx + 1, points.length - 1);
            const t = (particle.position * (points.length - 1)) % 1;

            const x = points[idx].x + (points[nextIdx].x - points[idx].x) * t;
            const y = points[idx].y + (points[nextIdx].y - points[idx].y) * t;

            // Calculate direction for dash
            const angle = Math.atan2(
                points[nextIdx].y - points[idx].y,
                points[nextIdx].x - points[idx].x
            );

            const dashLength = 6;
            const color = line.fromPositive ? this.colors.phosphorGreen : this.colors.cobaltBlue;

            // Draw dash
            ctx.beginPath();
            ctx.moveTo(
                x - Math.cos(angle) * dashLength / 2,
                y - Math.sin(angle) * dashLength / 2
            );
            ctx.lineTo(
                x + Math.cos(angle) * dashLength / 2,
                y + Math.sin(angle) * dashLength / 2
            );
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }

    // Legacy method - now calls flow particles
    drawFieldLines(fieldLines) {
        this.drawFlowParticles(fieldLines);
    }

    // ==========================================
    // TOPOGRAPHIC ISO-CONTOURS
    // ==========================================

    drawPotentialContours(chargeSystem, resolution = 8) {
        const ctx = this.ctx;
        const potentialGrid = [];

        // Sample potential field
        const cols = Math.ceil(this.width / resolution);
        const rows = Math.ceil(this.height / resolution);

        let minV = Infinity, maxV = -Infinity;

        for (let j = 0; j < rows; j++) {
            potentialGrid[j] = [];
            for (let i = 0; i < cols; i++) {
                const x = i * resolution;
                const y = j * resolution;
                let V = chargeSystem.potentialAt(x, y);

                // Clamp extreme values
                if (!isFinite(V)) V = 0;
                V = Math.max(-1e6, Math.min(1e6, V));

                potentialGrid[j][i] = V;
                if (V < minV) minV = V;
                if (V > maxV) maxV = V;
            }
        }

        if (maxV === minV) return;

        // Generate contour levels
        const range = maxV - minV;
        const levels = [];
        for (let i = 1; i < this.contourLevels; i++) {
            levels.push(minV + (range * i) / this.contourLevels);
        }

        // Marching squares for each level
        ctx.lineWidth = 1;
        ctx.lineCap = 'square';

        for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
            const level = levels[levelIdx];
            const normalizedLevel = (level - minV) / range;

            // Color based on level (blue for low, green for high)
            const hue = 120 + (1 - normalizedLevel) * 100; // Green to blue
            ctx.strokeStyle = `hsla(${hue}, 50%, 40%, 0.4)`;

            ctx.beginPath();

            for (let j = 0; j < rows - 1; j++) {
                for (let i = 0; i < cols - 1; i++) {
                    const x = i * resolution;
                    const y = j * resolution;

                    // Cell corner values
                    const v00 = potentialGrid[j][i];
                    const v10 = potentialGrid[j][i + 1];
                    const v01 = potentialGrid[j + 1][i];
                    const v11 = potentialGrid[j + 1][i + 1];

                    // Marching squares index
                    let idx = 0;
                    if (v00 >= level) idx |= 1;
                    if (v10 >= level) idx |= 2;
                    if (v11 >= level) idx |= 4;
                    if (v01 >= level) idx |= 8;

                    // Draw contour segments
                    this.drawContourSegment(ctx, x, y, resolution, idx, level, v00, v10, v01, v11);
                }
            }

            ctx.stroke();
        }
    }

    drawContourSegment(ctx, x, y, size, idx, level, v00, v10, v01, v11) {
        const lerp = (a, b, t) => a + (b - a) * t;

        // Interpolation positions
        const top = lerp(0, size, (level - v00) / (v10 - v00 || 1));
        const bottom = lerp(0, size, (level - v01) / (v11 - v01 || 1));
        const left = lerp(0, size, (level - v00) / (v01 - v00 || 1));
        const right = lerp(0, size, (level - v10) / (v11 - v10 || 1));

        // Marching squares lookup (simplified)
        const segments = {
            1: [[x, y + left, x + top, y]],
            2: [[x + top, y, x + size, y + right]],
            3: [[x, y + left, x + size, y + right]],
            4: [[x + size, y + right, x + bottom, y + size]],
            5: [[x, y + left, x + top, y], [x + size, y + right, x + bottom, y + size]],
            6: [[x + top, y, x + bottom, y + size]],
            7: [[x, y + left, x + bottom, y + size]],
            8: [[x + bottom, y + size, x, y + left]],
            9: [[x + bottom, y + size, x + top, y]],
            10: [[x + top, y, x + size, y + right], [x + bottom, y + size, x, y + left]],
            11: [[x + bottom, y + size, x + size, y + right]],
            12: [[x + size, y + right, x, y + left]],
            13: [[x + size, y + right, x + top, y]],
            14: [[x + top, y, x, y + left]]
        };

        const segs = segments[idx];
        if (segs) {
            for (const seg of segs) {
                ctx.moveTo(seg[0], seg[1]);
                ctx.lineTo(seg[2], seg[3]);
            }
        }
    }

    // Legacy method - now calls contours
    drawPotentialField(chargeSystem, resolution = 8) {
        this.drawPotentialContours(chargeSystem, resolution);
    }

    drawWave1D(fdtd, yOffset, height, showE = true, showH = true) {
        const ctx = this.ctx;
        const fields = fdtd.getNormalizedFields();
        const dx = this.width / fdtd.numCells;

        // Material regions
        for (let i = 0; i < fdtd.numCells; i++) {
            if (fdtd.epsilon_r[i] > 1.01) {
                const alpha = Math.min(0.25, (fdtd.epsilon_r[i] - 1) / 15);
                ctx.fillStyle = `rgba(21, 101, 192, ${alpha})`;
                ctx.fillRect(i * dx, yOffset - height / 2, dx, height);
            }
        }

        // Zero line
        ctx.beginPath();
        ctx.moveTo(0, yOffset);
        ctx.lineTo(this.width, yOffset);
        ctx.strokeStyle = this.colors.gridMajor;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ez wave (Phosphor Green)
        if (showE) {
            ctx.beginPath();
            for (let i = 0; i < fdtd.numCells; i++) {
                const x = i * dx;
                const y = yOffset - fields.Ez[i] * height * 0.4;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = this.colors.phosphorGreen;
            ctx.lineWidth = 2;
            ctx.lineCap = 'square';
            ctx.stroke();

            // Subtle fill
            ctx.lineTo(this.width, yOffset);
            ctx.lineTo(0, yOffset);
            ctx.closePath();
            ctx.fillStyle = this.colors.phosphorGreen + '08';
            ctx.fill();
        }

        // Hy wave (Cobalt Blue)
        if (showH) {
            ctx.beginPath();
            for (let i = 0; i < fdtd.numCells; i++) {
                const x = i * dx;
                const y = yOffset - fields.Hy[i] * height * 0.4;
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            }
            ctx.strokeStyle = this.colors.cobaltBlue;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Source indicator
        const sourceX = fdtd.sourcePosition * dx;
        this.drawIndicatorGlow(sourceX, yOffset + height * 0.45, 20, this.colors.cadmiumOrange, 0.6);

        ctx.beginPath();
        ctx.arc(sourceX, yOffset + height * 0.45, 6, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.cadmiumOrange;
        ctx.fill();

        ctx.fillStyle = this.colors.textDim;
        ctx.font = "600 9px 'Inter', sans-serif";
        ctx.textAlign = 'center';
        ctx.letterSpacing = '0.1em';
        ctx.fillText('SOURCE', sourceX, yOffset + height * 0.45 + 18);
    }

    drawWave2D(fdtd, colormap) {
        const ctx = this.ctx;
        const nx = fdtd.nx, ny = fdtd.ny;
        const cellW = this.width / nx, cellH = this.height / ny;

        let maxE = 0;
        for (let i = 0; i < nx; i++) {
            for (let j = 0; j < ny; j++) {
                maxE = Math.max(maxE, Math.abs(fdtd.Ez[i][j]));
            }
        }
        maxE = Math.max(maxE, 1e-10);

        for (let i = 0; i < nx; i++) {
            for (let j = 0; j < ny; j++) {
                const normalized = (fdtd.Ez[i][j] / maxE + 1) / 2;
                // Scientific gradient: blue -> gray -> green
                const color = colormap ? colormap(normalized) : this.getScientificColor(normalized);
                ctx.fillStyle = color;
                ctx.fillRect(i * cellW, j * cellH, cellW + 1, cellH + 1);
            }
        }
    }

    getScientificColor(t) {
        // Blue (negative) -> Gray (zero) -> Green (positive)
        if (t < 0.5) {
            const s = t * 2;
            const r = Math.round(10 + s * 20);
            const g = Math.round(10 + s * 20);
            const b = Math.round(60 + (1 - s) * 132);
            return `rgb(${r},${g},${b})`;
        } else {
            const s = (t - 0.5) * 2;
            const r = Math.round(30 - s * 20);
            const g = Math.round(30 + s * 145);
            const b = Math.round(30 - s * 10);
            return `rgb(${r},${g},${b})`;
        }
    }

    drawParticle(particle, scale = 100) {
        const ctx = this.ctx;
        const x = this.width / 2 + particle.x * scale;
        const y = this.height / 2 - particle.y * scale;

        // Trail with gradient
        if (particle.trajectory.length > 1) {
            for (let i = 1; i < particle.trajectory.length; i++) {
                const p0 = particle.trajectory[i - 1];
                const p1 = particle.trajectory[i];
                const px0 = this.width / 2 + p0.x * scale;
                const py0 = this.height / 2 - p0.y * scale;
                const px1 = this.width / 2 + p1.x * scale;
                const py1 = this.height / 2 - p1.y * scale;

                const alpha = (i / particle.trajectory.length) * 0.6;
                ctx.beginPath();
                ctx.moveTo(px0, py0);
                ctx.lineTo(px1, py1);
                ctx.strokeStyle = this.colors.phosphorGreen + Math.floor(alpha * 255).toString(16).padStart(2, '0');
                ctx.lineWidth = this.trailWidth * (i / particle.trajectory.length) + 0.5;
                ctx.lineCap = 'square';
                ctx.stroke();
            }
        }

        // Particle glow
        this.drawIndicatorGlow(x, y, this.particleRadius * 3, this.colors.phosphorGreen, 0.5);

        // Main particle (instrument style)
        ctx.beginPath();
        ctx.arc(x, y, this.particleRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.surfaceDark;
        ctx.fill();
        ctx.strokeStyle = this.colors.phosphorGreen;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Center LED
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.phosphorGreenBright;
        ctx.fill();
    }

    drawMagneticFieldIndicator(Bz, x, y, size = 30) {
        const ctx = this.ctx;

        // Outer ring
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.surfaceDark;
        ctx.fill();
        ctx.strokeStyle = this.colors.cobaltBlue;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Direction indicator
        if (Bz > 0) {
            // Into page (X)
            ctx.beginPath();
            ctx.moveTo(x - size * 0.4, y - size * 0.4);
            ctx.lineTo(x + size * 0.4, y + size * 0.4);
            ctx.moveTo(x + size * 0.4, y - size * 0.4);
            ctx.lineTo(x - size * 0.4, y + size * 0.4);
            ctx.strokeStyle = this.colors.cobaltBlue;
            ctx.lineWidth = 2;
            ctx.lineCap = 'square';
            ctx.stroke();
        } else if (Bz < 0) {
            // Out of page (dot)
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fillStyle = this.colors.cobaltBlue;
            ctx.fill();
        }

        // Label
        ctx.fillStyle = this.colors.cobaltBlue;
        ctx.font = "600 11px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';
        ctx.fillText(`B = ${Math.abs(Bz).toFixed(2)} T`, x, y + size + 18);
    }

    drawElectricFieldIndicator(Ex, Ey, x, y) {
        const mag = Math.sqrt(Ex * Ex + Ey * Ey);
        if (mag < 1e-10) return;

        this.drawIndicatorGlow(x, y, 35, this.colors.phosphorGreen, 0.3);
        this.drawArrow(x, y, Ex * 25 / mag, Ey * 25 / mag, this.colors.phosphorGreen, 40);

        this.ctx.fillStyle = this.colors.phosphorGreen;
        this.ctx.font = "600 11px 'JetBrains Mono', monospace";
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`E = ${mag.toExponential(1)} V/m`, x, y + 40);
    }

    drawEnergyGraph(energyHistory, x, y, width, height) {
        const ctx = this.ctx;

        // Background
        ctx.fillStyle = this.colors.surfaceDark;
        ctx.fillRect(x, y, width, height);
        ctx.strokeStyle = this.colors.gridMajor;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        if (energyHistory.length < 2) return;

        const maxEnergy = Math.max(...energyHistory.map(e => e.total), 1e-30);
        const dx = width / (energyHistory.length - 1);

        // Graph line
        ctx.beginPath();
        for (let i = 0; i < energyHistory.length; i++) {
            const px = x + i * dx;
            const py = y + height - (energyHistory[i].total / maxEnergy) * height * 0.85;
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.strokeStyle = this.colors.cadmiumOrange;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Fill
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fillStyle = this.colors.cadmiumOrange + '15';
        ctx.fill();

        // Label
        ctx.fillStyle = this.colors.cadmiumOrange;
        ctx.font = "600 9px 'Inter', sans-serif";
        ctx.fillText('⚡ ENERGY', x + 8, y + 12);
    }

    drawAxes(scale = 100) {
        const ctx = this.ctx;
        const cx = this.width / 2;
        const cy = this.height / 2;

        // Axes lines
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(this.width, cy);
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, this.height);
        ctx.strokeStyle = this.colors.gridMajor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Tick marks and labels
        ctx.fillStyle = this.colors.textDim;
        ctx.font = "9px 'JetBrains Mono', monospace";
        ctx.textAlign = 'center';

        for (let i = -5; i <= 5; i++) {
            if (i === 0) continue;
            const xPos = cx + i * scale * 0.5;
            ctx.beginPath();
            ctx.moveTo(xPos, cy - 3);
            ctx.lineTo(xPos, cy + 3);
            ctx.stroke();
            ctx.fillText(`${(i * 0.5).toFixed(1)}`, xPos, cy + 14);
        }

        // Axis labels
        ctx.fillStyle = this.colors.phosphorGreen;
        ctx.fillText('x (m)', this.width - 30, cy - 10);
        ctx.fillText('y (m)', cx + 20, 14);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EMRenderer };
}
