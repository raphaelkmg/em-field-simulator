/**
 * DIAL-AND-TRACK SLIDER COMPONENT
 * 
 * Neural-Physical Instrument UI
 * Replaces standard range sliders with tactile dial controls
 */

class DialSlider {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            min: parseFloat(options.min) || 0,
            max: parseFloat(options.max) || 100,
            step: parseFloat(options.step) || 1,
            value: parseFloat(options.value) || 0,
            ticks: options.ticks !== false,
            majorTickInterval: options.majorTickInterval || 5,
            onChange: options.onChange || (() => { }),
            onInput: options.onInput || (() => { })
        };

        this.value = this.options.value;
        this.isDragging = false;

        this.build();
        this.bindEvents();
        this.updatePosition();
    }

    build() {
        this.container.classList.add('dial-slider-container');
        this.container.innerHTML = '';

        // Track
        this.track = document.createElement('div');
        this.track.className = 'dial-track';

        // Track fill
        this.trackFill = document.createElement('div');
        this.trackFill.className = 'dial-track-fill';
        this.track.appendChild(this.trackFill);

        // Thumb
        this.thumb = document.createElement('div');
        this.thumb.className = 'dial-thumb';
        this.thumb.setAttribute('role', 'slider');
        this.thumb.setAttribute('aria-valuemin', this.options.min);
        this.thumb.setAttribute('aria-valuemax', this.options.max);
        this.thumb.setAttribute('aria-valuenow', this.value);
        this.thumb.setAttribute('tabindex', '0');
        this.track.appendChild(this.thumb);

        this.container.appendChild(this.track);

        // Tick marks
        if (this.options.ticks) {
            this.tickContainer = document.createElement('div');
            this.tickContainer.className = 'dial-track-ticks';

            const range = this.options.max - this.options.min;
            const numTicks = Math.min(20, Math.floor(range / this.options.step));

            for (let i = 0; i <= numTicks; i++) {
                const tick = document.createElement('div');
                tick.className = 'dial-tick';
                if (i % this.options.majorTickInterval === 0) {
                    tick.classList.add('major');
                }
                this.tickContainer.appendChild(tick);
            }

            this.container.appendChild(this.tickContainer);
        }
    }

    bindEvents() {
        // Mouse events
        this.thumb.addEventListener('mousedown', this.startDrag.bind(this));
        this.track.addEventListener('click', this.handleTrackClick.bind(this));

        // Touch events
        this.thumb.addEventListener('touchstart', this.startDrag.bind(this), { passive: true });

        // Global events
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.endDrag.bind(this));
        document.addEventListener('touchmove', this.drag.bind(this), { passive: true });
        document.addEventListener('touchend', this.endDrag.bind(this));

        // Keyboard
        this.thumb.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    startDrag(e) {
        this.isDragging = true;
        this.thumb.style.cursor = 'grabbing';
        e.preventDefault?.();
    }

    drag(e) {
        if (!this.isDragging) return;

        const rect = this.track.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let percent = (clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));

        const rawValue = this.options.min + percent * (this.options.max - this.options.min);
        const steppedValue = Math.round(rawValue / this.options.step) * this.options.step;

        if (steppedValue !== this.value) {
            this.setValue(steppedValue, true);
        }
    }

    endDrag() {
        if (this.isDragging) {
            this.isDragging = false;
            this.thumb.style.cursor = 'grab';
            this.options.onChange(this.value);
        }
    }

    handleTrackClick(e) {
        if (e.target === this.thumb) return;

        const rect = this.track.getBoundingClientRect();
        let percent = (e.clientX - rect.left) / rect.width;
        percent = Math.max(0, Math.min(1, percent));

        const rawValue = this.options.min + percent * (this.options.max - this.options.min);
        const steppedValue = Math.round(rawValue / this.options.step) * this.options.step;

        this.setValue(steppedValue);
        this.options.onChange(this.value);
    }

    handleKeyboard(e) {
        let newValue = this.value;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowUp':
                newValue = Math.min(this.options.max, this.value + this.options.step);
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                newValue = Math.max(this.options.min, this.value - this.options.step);
                break;
            case 'Home':
                newValue = this.options.min;
                break;
            case 'End':
                newValue = this.options.max;
                break;
            default:
                return;
        }

        e.preventDefault();
        this.setValue(newValue);
        this.options.onChange(this.value);
    }

    setValue(value, isInput = false) {
        this.value = Math.max(this.options.min, Math.min(this.options.max, value));
        this.updatePosition();
        this.thumb.setAttribute('aria-valuenow', this.value);

        if (isInput) {
            this.options.onInput(this.value);
        }
    }

    updatePosition() {
        const percent = (this.value - this.options.min) / (this.options.max - this.options.min) * 100;
        this.thumb.style.left = `${percent}%`;
        this.trackFill.style.width = `${percent}%`;
    }

    getValue() {
        return this.value;
    }

    destroy() {
        document.removeEventListener('mousemove', this.drag);
        document.removeEventListener('mouseup', this.endDrag);
        document.removeEventListener('touchmove', this.drag);
        document.removeEventListener('touchend', this.endDrag);
    }
}

// Factory function to upgrade existing range inputs
function upgradeToDialSlider(rangeInput, displayElement, formatFn) {
    const container = document.createElement('div');
    rangeInput.parentNode.insertBefore(container, rangeInput);
    rangeInput.style.display = 'none';

    const dial = new DialSlider(container, {
        min: rangeInput.min,
        max: rangeInput.max,
        step: rangeInput.step || 1,
        value: rangeInput.value,
        onInput: (value) => {
            rangeInput.value = value;
            rangeInput.dispatchEvent(new Event('input', { bubbles: true }));

            if (displayElement && formatFn) {
                displayElement.textContent = formatFn(value);
                displayElement.classList.remove('haptic-click');
                void displayElement.offsetWidth;
                displayElement.classList.add('haptic-click');
            }
        },
        onChange: (value) => {
            rangeInput.value = value;
            rangeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    return dial;
}

// Auto-initialize if data attribute present
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-dial-slider]').forEach(el => {
        new DialSlider(el);
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DialSlider, upgradeToDialSlider };
}
