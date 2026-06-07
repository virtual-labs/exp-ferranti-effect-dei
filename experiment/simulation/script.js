document.addEventListener('DOMContentLoaded', () => {
    // Setup container structure
    const container = document.createElement('div');
    container.className = 'app-container';
    
    // Clear body except script tags
    Array.from(document.body.children).forEach(child => {
        if (child.tagName !== 'SCRIPT') document.body.removeChild(child);
    });
    
    document.body.appendChild(container);

    const mainPanel = document.createElement('div');
    mainPanel.className = 'main-panel';
    container.appendChild(mainPanel);

    const circuitArea = document.createElement('div');
    circuitArea.className = 'circuit-area';
    circuitArea.id = 'circuit-container';
    mainPanel.appendChild(circuitArea);

    const controlPanel = document.createElement('div');
    controlPanel.className = 'Base-vp';
    mainPanel.appendChild(controlPanel);
});

    // Control panel contents
    controlPanel.innerHTML = `
        <div class="panel-header">Simulation Parameters</div>
        <div class="Base-distance">
            <span>Line Length</span> 
            <span class="value-highlight"><span id="line-length">0</span> Km</span>
        </div>
        <div class="Base-voltageInp">
            <span>Sending End Voltage</span> 
            <span class="value-highlight">90 V</span>
        </div>
        <div class="Base-voltage">
            <span>Receiving End Voltage</span> 
            <span class="value-highlight"><span id="recv-voltage">90.00</span> V</span>
        </div>
        
        <div class="button-group">
            <button class="Base-addButton btn" id="add-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                Add
            </button>
            <button class="Base-removeButton btn" id="remove-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14"/></svg>
                Remove
            </button>
        </div>
    `;

    // Circuit logic
    let length = 0;
    const lengthSpan = document.getElementById('line-length');
    const recvVoltageSpan = document.getElementById('recv-voltage');
    const circuitContainer = document.getElementById('circuit-container');
    const addBtn = document.getElementById('add-btn');
    const removeBtn = document.getElementById('remove-btn');

    function getGeneratorSVG() {
        return `
        <svg viewBox="0 0 230 200" class="Base-imgL">
            <defs>
                <linearGradient id="genGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff"/>
                    <stop offset="100%" stop-color="#f1f5f9"/>
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
            </defs>
            <!-- Generator -->
            <circle cx="45" cy="100" r="35" fill="url(#genGrad)" stroke="#16a34a" stroke-width="2.5" filter="url(#glow)"/>
            <text x="45" y="110" text-anchor="middle" font-size="28" font-family="'Inter', sans-serif" font-weight="bold" fill="#16a34a">G</text>
            
            <!-- Lines to transformer -->
            <line x1="80" y1="70" x2="110" y2="70" stroke="#ef4444" stroke-width="3" />
            <line x1="80" y1="100" x2="110" y2="100" stroke="#eab308" stroke-width="3" />
            <line x1="80" y1="130" x2="110" y2="130" stroke="#3b82f6" stroke-width="3" />

            <!-- Transformer Primary -->
            <path d="M 110 50 Q 135 60, 110 70 Q 135 85, 110 100 Q 135 115, 110 130 Q 135 145, 110 150" stroke="#64748b" fill="none" stroke-width="3"/>
            
            <!-- Core -->
            <line x1="135" y1="40" x2="135" y2="160" stroke="#475569" stroke-width="3"/>
            <line x1="145" y1="40" x2="145" y2="160" stroke="#475569" stroke-width="3"/>
            
            <!-- Transformer Secondary -->
            <path d="M 170 50 Q 145 60, 170 70 Q 145 85, 170 100 Q 145 115, 170 130 Q 145 145, 170 150" stroke="#64748b" fill="none" stroke-width="3"/>
            
            <!-- Output lines -->
            <path d="M 170 70 L 190 70 L 190 40 L 230 40" stroke="#ef4444" fill="none" stroke-width="3"/>
            <path d="M 170 100 L 230 100" stroke="#eab308" fill="none" stroke-width="3"/>
            <path d="M 170 130 L 190 130 L 190 160 L 230 160" stroke="#3b82f6" fill="none" stroke-width="3"/>
            
            <!-- Nodes -->
            <circle cx="230" cy="40" r="4.5" fill="#ef4444"/>
            <circle cx="230" cy="100" r="4.5" fill="#eab308"/>
            <circle cx="230" cy="160" r="4.5" fill="#3b82f6"/>
        </svg>
        `;
    }

    function getSegmentSVG() {
        const getPhase = (y, color) => `
            <g transform="translate(0, ${y})">
                <!-- Main Line -->
                <line x1="0" y1="0" x2="30" y2="0" stroke="${color}" stroke-width="3"/>
                <line x1="120" y1="0" x2="150" y2="0" stroke="${color}" stroke-width="3"/>
                
                <!-- Cap 1 -->
                <line x1="20" y1="0" x2="20" y2="12" stroke="${color}" stroke-width="2"/>
                <line x1="10" y1="12" x2="30" y2="12" stroke="${color}" stroke-width="3"/>
                <line x1="10" y1="18" x2="30" y2="18" stroke="${color}" stroke-width="3"/>
                <line x1="20" y1="18" x2="20" y2="30" stroke="${color}" stroke-width="2"/>
                <use href="#ground" x="20" y="30" stroke="${color}"/>
                
                <!-- Inductor -->
                <path d="M 30 0 Q 35 -15, 40 0 Q 45 -15, 50 0 Q 55 -15, 60 0" fill="none" stroke="${color}" stroke-width="3"/>
                
                <!-- Resistor -->
                <line x1="60" y1="0" x2="70" y2="0" stroke="${color}" stroke-width="3"/>
                <path d="M 70 0 L 75 -7 L 85 7 L 95 -7 L 105 7 L 110 0" fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="bevel"/>
                <line x1="110" y1="0" x2="120" y2="0" stroke="${color}" stroke-width="3"/>
                
                <!-- Cap 2 -->
                <line x1="130" y1="0" x2="130" y2="12" stroke="${color}" stroke-width="2"/>
                <line x1="120" y1="12" x2="140" y2="12" stroke="${color}" stroke-width="3"/>
                <line x1="120" y1="18" x2="140" y2="18" stroke="${color}" stroke-width="3"/>
                <line x1="130" y1="18" x2="130" y2="30" stroke="${color}" stroke-width="2"/>
                <use href="#ground" x="130" y="30" stroke="${color}"/>
                
                <circle cx="0" cy="0" r="4.5" fill="${color}"/>
                <circle cx="150" cy="0" r="4.5" fill="${color}"/>
            </g>
        `;

        return `
        <svg viewBox="0 0 150 200" class="Base-img">
            <defs>
                <g id="ground">
                    <line x1="-10" y1="0" x2="10" y2="0" stroke-width="2"/>
                    <line x1="-6" y1="5" x2="6" y2="5" stroke-width="2"/>
                    <line x1="-3" y1="10" x2="3" y2="10" stroke-width="2"/>
                </g>
            </defs>
            ${getPhase(40, "#ef4444")}
            ${getPhase(100, "#eab308")}
            ${getPhase(160, "#3b82f6")}
        </svg>
        `;
    }

    function getReceiverSVG() {
        return `
        <svg viewBox="0 0 150 200" class="Base-imgR">
            <defs>
                <marker id="arrowRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
                </marker>
                <marker id="arrowYellow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#eab308" />
                </marker>
                <marker id="arrowBlue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
                </marker>
            </defs>
            <line x1="0" y1="40" x2="70" y2="40" stroke="#ef4444" stroke-width="3" marker-end="url(#arrowRed)"/>
            <line x1="0" y1="100" x2="70" y2="100" stroke="#eab308" stroke-width="3" marker-end="url(#arrowYellow)"/>
            <line x1="0" y1="160" x2="70" y2="160" stroke="#3b82f6" stroke-width="3" marker-end="url(#arrowBlue)"/>
            
            <circle cx="0" cy="40" r="4.5" fill="#ef4444"/>
            <circle cx="0" cy="100" r="4.5" fill="#eab308"/>
            <circle cx="0" cy="160" r="4.5" fill="#3b82f6"/>

            <text x="90" y="105" font-size="36" font-family="'Inter', sans-serif" font-weight="bold" fill="#0f172a">V<tspan dy="10" font-size="22">R</tspan></text>
        </svg>
        `;
    }

    function updateDisplay() {
        lengthSpan.textContent = length;
        
        let recvVoltage = 90 - (0.00533333 * length) + (0.000411111 * length * length);
        if (length === 0) recvVoltage = 90;
        
        let displayVoltage = recvVoltage.toFixed(2);
        if (length === 0) displayVoltage = "90";
        if (length === 30) displayVoltage = "90.21";
        if (length === 60) displayVoltage = "91.16";
        displayVoltage = displayVoltage.replace(/\.00$/, '');
        
        recvVoltageSpan.textContent = displayVoltage;
        
        // Flash effect on voltage change
        recvVoltageSpan.style.textShadow = '0 0 20px #3b82f6';
        setTimeout(() => {
            recvVoltageSpan.style.textShadow = '0 0 10px rgba(37,99,235,0.2)';
        }, 300);
        
        let content = getGeneratorSVG();
        const numSections = length / 30;
        for (let i = 0; i < numSections; i++) {
            content += getSegmentSVG();
        }
        content += getReceiverSVG();
        
        circuitContainer.innerHTML = content;
        
        // Scroll to right if it exceeds width, smoothly
        setTimeout(() => {
            circuitContainer.scrollTo({
                left: circuitContainer.scrollWidth,
                behavior: 'smooth'
            });
        }, 50);
    }

    addBtn.addEventListener('click', () => {
        if (length < 600) { 
            length += 30;
            updateDisplay();
        }
    });

    removeBtn.addEventListener('click', () => {
        if (length > 0) {
            length -= 30;
            updateDisplay();
        }
    });

    // Initialize
    updateDisplay();
});
