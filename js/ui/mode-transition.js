/**
 * MODE TRANSITION COMPONENT
 * 
 * Neural-Physical Instrument UI
 * Mechanical shutter transition effect for mode switching
 */

class ModeTransition {
    constructor(options = {}) {
        this.options = {
            barCount: options.barCount || 8,
            duration: options.duration || 400,
            stagger: options.stagger || 30,
            easing: options.easing || 'cubic-bezier(0.4, 0, 0.2, 1)'
        };

        this.overlay = null;
        this.isTransitioning = false;
        this.build();
    }

    build() {
        // Check if overlay already exists
        this.overlay = document.getElementById('shutter-overlay');

        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.id = 'shutter-overlay';
            this.overlay.className = 'shutter-overlay';
            this.overlay.setAttribute('aria-hidden', 'true');

            for (let i = 0; i < this.options.barCount; i++) {
                const bar = document.createElement('div');
                bar.className = 'shutter-bar';
                bar.style.transitionDelay = `${i * this.options.stagger}ms`;
                this.overlay.appendChild(bar);
            }

            document.body.appendChild(this.overlay);
        }

        // Apply dynamic styles
        this.applyStyles();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.id = 'mode-transition-styles';

        if (!document.getElementById('mode-transition-styles')) {
            style.textContent = `
                .shutter-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 10000;
                    pointer-events: none;
                    display: flex;
                }
                
                .shutter-bar {
                    flex: 1;
                    background: linear-gradient(180deg, #101018 0%, #0A0A0F 100%);
                    border-right: 1px solid #1A1A22;
                    transform: scaleY(0);
                    transition: transform ${this.options.duration}ms ${this.options.easing};
                }
                
                .shutter-bar:nth-child(odd) {
                    transform-origin: top;
                }
                
                .shutter-bar:nth-child(even) {
                    transform-origin: bottom;
                }
                
                .shutter-bar:last-child {
                    border-right: none;
                }
                
                .shutter-overlay.closing .shutter-bar {
                    transform: scaleY(1);
                }
                
                .shutter-overlay.opening .shutter-bar {
                    transform: scaleY(0);
                }
                
                /* Lock indicator when closed */
                .shutter-overlay.closed::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 24px;
                    height: 24px;
                    border: 2px solid #4CAF50;
                    border-radius: 0;
                    animation: lockPulse 0.3s ease-out;
                }
                
                @keyframes lockPulse {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                    50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Execute transition with callback at midpoint
     * @param {Function} onMidpoint - Called when shutter is fully closed
     * @returns {Promise} - Resolves when transition completes
     */
    async transition(onMidpoint) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        return new Promise((resolve) => {
            // Close shutter
            this.overlay.classList.remove('opening', 'closed');
            this.overlay.classList.add('closing');

            // Wait for close, then execute callback
            const closeDuration = this.options.duration + (this.options.barCount * this.options.stagger);

            setTimeout(() => {
                this.overlay.classList.add('closed');

                // Execute midpoint callback
                if (typeof onMidpoint === 'function') {
                    onMidpoint();
                }

                // Brief hold at closed state
                setTimeout(() => {
                    // Open shutter
                    this.overlay.classList.remove('closing', 'closed');
                    this.overlay.classList.add('opening');

                    // Complete
                    setTimeout(() => {
                        this.overlay.classList.remove('opening');
                        this.isTransitioning = false;
                        resolve();
                    }, closeDuration);

                }, 100);

            }, closeDuration);
        });
    }

    /**
     * Quick close without callback
     */
    close() {
        this.overlay.classList.remove('opening');
        this.overlay.classList.add('closing');
    }

    /**
     * Quick open
     */
    open() {
        this.overlay.classList.remove('closing', 'closed');
        this.overlay.classList.add('opening');

        setTimeout(() => {
            this.overlay.classList.remove('opening');
        }, this.options.duration + (this.options.barCount * this.options.stagger));
    }

    destroy() {
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        const style = document.getElementById('mode-transition-styles');
        if (style) {
            style.parentNode.removeChild(style);
        }
    }
}

// Global instance
let modeTransitionInstance = null;

// Initialize and expose globally
document.addEventListener('DOMContentLoaded', () => {
    modeTransitionInstance = new ModeTransition();
    window.modeTransition = modeTransitionInstance;
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ModeTransition };
}
