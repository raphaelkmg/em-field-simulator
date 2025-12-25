/**
 * UI CONTROLS MODULE
 * 
 * Neural-Physical Instrument Interface
 * Handles all control panel interactions and state management
 */

class UIControls {
    constructor() {
        this.currentMode = 'electrostatic';
        this.isPlaying = false;

        // Mode transition handler
        this.modeTransition = null;

        // Callbacks
        this.onModeChange = null;
        this.onPlayToggle = null;
        this.onStep = null;
        this.onReset = null;
        this.onParameterChange = null;

        this.init();
    }

    init() {
        this.bindModeButtons();
        this.bindPlaybackControls();
        this.bindSliders();
        this.bindCheckboxes();

        // Initialize dial sliders (upgrade from range inputs)
        this.initDialSliders();
    }

    bindModeButtons() {
        const modeButtons = document.querySelectorAll('.mode-btn');
        const panels = {
            electrostatic: document.getElementById('panel-electrostatic'),
            waves: document.getElementById('panel-waves'),
            particles: document.getElementById('panel-particles')
        };

        modeButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const modeId = btn.id.replace('btn-', '');
                if (modeId === this.currentMode) return;

                // Use mechanical shutter if available
                if (window.modeTransition) {
                    await window.modeTransition.transition(() => {
                        this.switchMode(modeId, modeButtons, panels);
                    });
                } else {
                    this.switchMode(modeId, modeButtons, panels);
                }

                if (this.onModeChange) {
                    this.onModeChange(modeId);
                }
            });
        });
    }

    switchMode(modeId, modeButtons, panels) {
        this.currentMode = modeId;

        // Update button states
        modeButtons.forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-${modeId}`).classList.add('active');

        // Switch panels
        Object.keys(panels).forEach(key => {
            if (panels[key]) {
                panels[key].classList.toggle('hidden', key !== modeId);
            }
        });
    }

    bindPlaybackControls() {
        const playBtn = document.getElementById('btn-play');
        const stepBtn = document.getElementById('btn-step');
        const resetBtn = document.getElementById('btn-reset');

        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.isPlaying = !this.isPlaying;
                this.updatePlayButton(playBtn);

                if (this.onPlayToggle) {
                    this.onPlayToggle(this.isPlaying);
                }
            });
        }

        if (stepBtn) {
            stepBtn.addEventListener('click', () => {
                if (this.onStep) {
                    this.onStep();
                }
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.isPlaying = false;
                if (playBtn) this.updatePlayButton(playBtn);

                if (this.onReset) {
                    this.onReset();
                }
            });
        }
    }

    updatePlayButton(btn) {
        const icon = btn.querySelector('.icon');
        const label = btn.querySelector('span:not(.icon)');

        if (this.isPlaying) {
            if (icon) icon.textContent = '⏸';
            if (label) label.textContent = 'Pause';
            btn.classList.add('playing');
        } else {
            if (icon) icon.textContent = '▶';
            if (label) label.textContent = 'Play';
            btn.classList.remove('playing');
        }
    }

    bindSliders() {
        const sliders = document.querySelectorAll('input[type="range"]');

        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                if (this.onParameterChange) {
                    this.onParameterChange(slider.id, parseFloat(e.target.value));
                }
            });
        });
    }

    bindCheckboxes() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (this.onParameterChange) {
                    this.onParameterChange(checkbox.id, e.target.checked);
                }
            });
        });
    }

    initDialSliders() {
        // Upgrade sliders to dial style (if DialSlider is available)
        if (typeof upgradeToDialSlider === 'undefined') return;

        const sliderConfigs = [
            { id: 'speed-slider', displayId: 'speed-value', format: v => Math.round(v) },
            { id: 'charge-magnitude', displayId: 'charge-value', format: v => v.toFixed(1) + ' nC' },
            { id: 'wave-frequency', displayId: 'freq-value', format: v => v + ' THz' },
            { id: 'wave-amplitude', displayId: 'amp-value', format: v => v.toFixed(1) },
            { id: 'magnetic-field-z', displayId: 'bz-value', format: v => v.toFixed(2) + ' T' },
            { id: 'electric-field-x', displayId: 'ex-value', format: v => v.toFixed(1) + ' MV/m' },
            { id: 'electric-field-y', displayId: 'ey-value', format: v => v.toFixed(1) + ' MV/m' }
        ];

        sliderConfigs.forEach(config => {
            const slider = document.getElementById(config.id);
            const display = document.getElementById(config.displayId);

            if (slider && display) {
                // Don't upgrade if already upgraded
                if (!slider.dataset.upgraded) {
                    upgradeToDialSlider(slider, display, config.format);
                    slider.dataset.upgraded = 'true';
                }
            }
        });
    }

    // Getters for current values
    getChargeType() {
        const select = document.getElementById('charge-type');
        return select ? select.value : 'positive';
    }

    getChargeMagnitude() {
        const slider = document.getElementById('charge-magnitude');
        return slider ? parseFloat(slider.value) : 1;
    }

    getSimulationSpeed() {
        const slider = document.getElementById('speed-slider');
        return slider ? parseInt(slider.value) : 10;
    }

    getVisualizationOptions() {
        return {
            showFieldLines: document.getElementById('show-field-lines')?.checked ?? true,
            showVectors: document.getElementById('show-vectors')?.checked ?? false,
            showPotential: document.getElementById('show-potential')?.checked ?? false,
            relativistic: document.getElementById('relativistic')?.checked ?? true
        };
    }

    getWaveParameters() {
        return {
            sourceType: document.getElementById('source-type')?.value ?? 'sinusoidal',
            frequency: parseFloat(document.getElementById('wave-frequency')?.value ?? 500),
            amplitude: parseFloat(document.getElementById('wave-amplitude')?.value ?? 1),
            leftBoundary: document.getElementById('left-boundary')?.value ?? 'abc',
            rightBoundary: document.getElementById('right-boundary')?.value ?? 'abc',
            material: document.getElementById('material-select')?.value ?? 'vacuum'
        };
    }

    getParticleParameters() {
        return {
            type: document.getElementById('particle-type')?.value ?? 'electron',
            Bz: parseFloat(document.getElementById('magnetic-field-z')?.value ?? 1),
            Ex: parseFloat(document.getElementById('electric-field-x')?.value ?? 0),
            Ey: parseFloat(document.getElementById('electric-field-y')?.value ?? 0)
        };
    }

    // HUD Updates
    updateHUD(data) {
        if (data.time !== undefined) {
            const timeEl = document.getElementById('time-display');
            if (timeEl) timeEl.textContent = data.time;
        }

        if (data.energy !== undefined) {
            const energyEl = document.getElementById('energy-display');
            if (energyEl) energyEl.textContent = data.energy;
        }

        if (data.fps !== undefined) {
            const fpsEl = document.getElementById('fps-display');
            if (fpsEl) fpsEl.textContent = data.fps;
        }

        if (data.scale !== undefined) {
            const scaleEl = document.getElementById('scale-display');
            if (scaleEl) scaleEl.textContent = data.scale;
        }
    }

    // Info display
    updateInfo(text) {
        const infoEl = document.getElementById('info-display');
        if (infoEl) {
            if (typeof text === 'string') {
                infoEl.innerHTML = `<div>${text}</div>`;
            } else if (Array.isArray(text)) {
                infoEl.innerHTML = text.map(t => `<div>${t}</div>`).join('');
            }
        }
    }
}

// Global instance
let uiControls = null;

document.addEventListener('DOMContentLoaded', () => {
    uiControls = new UIControls();
    window.uiControls = uiControls;
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIControls };
}
