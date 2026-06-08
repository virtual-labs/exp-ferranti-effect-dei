document.addEventListener('DOMContentLoaded', () => {
    // Setup container structure
    const container = document.createElement('div');
    container.className = 'app-container';
    
    // Clear body except script tags
    Array.from(document.body.children).forEach(child => {
        if (child.tagName !== 'SCRIPT') document.body.removeChild(child);
    });
    
    document.body.appendChild(container);

    // Header
    const header = document.createElement('header');
    header.innerHTML = `
        <h1>Simulation of Experiment - 9</h1>
        <p>Ferranti Effect and Voltage Regulation of Three-Phase Transmission Line</p>
    `;
    container.appendChild(header);

    // Circuit Diagram Card
    const circuitCard = document.createElement('div');
    circuitCard.className = 'circuit-card';
    circuitCard.innerHTML = `<svg id="circuit-svg" height="250" style="min-width: 600px;"></svg>`;
    container.appendChild(circuitCard);

    // Lower Interactive Section
    const lowerSection = document.createElement('div');
    lowerSection.className = 'lower-section';
    container.appendChild(lowerSection);

    // Control Panel Box
    const controlPanel = document.createElement('div');
    controlPanel.className = 'Base-vp';
    lowerSection.appendChild(controlPanel);

    // Control panel contents
    controlPanel.innerHTML = `
        <div class="Base-distance">Line Length: <span id="line-length">30</span> Km</div>
        <div class="Base-voltageInp">Sending End Voltage: <span id="send-voltage">90</span> V</div>
        <div class="Base-voltage">Receiving End Voltage: <span id="recv-voltage">90.34</span> V</div>
        
        <div class="button-group">
            <button class="Base-addButton" id="add-btn">Add</button>
            <button class="Base-removeButton" id="remove-btn">Remove</button>
            <button class="record-btn" id="record-btn">Record Data</button>
        </div>
    `;

    // Observation Table Container
    const tableContainer = document.createElement('div');
    tableContainer.className = 'observation-table-container';
    tableContainer.innerHTML = `
        <div class="table-header">
            <h2>Observation Table</h2>
            <button class="clear-btn" id="clear-btn">Clear Table</button>
        </div>
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width: 10%">S.No.</th>
                        <th style="width: 25%">Line Length (Km)</th>
                        <th style="width: 25%">Sending Voltage V<sub>S</sub> (V)</th>
                        <th style="width: 25%">Receiving Voltage V<sub>R</sub> (V)</th>
                        <th style="width: 15%">Regulation (%)</th>
                    </tr>
                </thead>
                <tbody id="table-body">
                    <tr class="empty-row">
                        <td colspan="5">No readings recorded yet. Click "Record Data" to save readings.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
    lowerSection.appendChild(tableContainer);

    // Simulation State Variables
    let length = 30;
    const sendVoltage = 90;
    let tableRecords = [];

    const lengthSpan = document.getElementById('line-length');
    const recvVoltageSpan = document.getElementById('recv-voltage');
    const addBtn = document.getElementById('add-btn');
    const removeBtn = document.getElementById('remove-btn');
    const recordBtn = document.getElementById('record-btn');
    const clearBtn = document.getElementById('clear-btn');
    const tableBody = document.getElementById('table-body');
    const svgArea = document.getElementById('circuit-svg');

    // SVG templates and helpers
    function getDefs() {
        return `
        <defs>
            <marker id="arrowRed" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ff0000" />
            </marker>
            <marker id="arrowYellow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffaa00" />
            </marker>
            <marker id="arrowBlue" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0077ff" />
            </marker>
            
            <g id="groundSymbol">
                <line x1="-15" y1="0" x2="15" y2="0" stroke="currentColor" stroke-width="2"/>
                <line x1="-10" y1="0" x2="-15" y2="10" stroke="currentColor" stroke-width="2"/>
                <line x1="-2" y1="0" x2="-7" y2="10" stroke="currentColor" stroke-width="2"/>
                <line x1="6" y1="0" x2="1" y2="10" stroke="currentColor" stroke-width="2"/>
                <line x1="14" y1="0" x2="9" y2="10" stroke="currentColor" stroke-width="2"/>
            </g>
        </defs>
        `;
    }

    function drawGeneratorAndTransformer() {
        return `
            <!-- Generator -->
            <circle cx="60" cy="120" r="30" stroke="black" fill="white" stroke-width="2"/>
            <text x="60" y="130" text-anchor="middle" font-size="28" font-family="'Inter', sans-serif" font-weight="bold">G</text>
            
            <!-- Lines to transformer -->
            <line x1="90" y1="95" x2="140" y2="95" stroke="#ff0000" stroke-width="2" />
            <line x1="90" y1="120" x2="140" y2="120" stroke="#ffaa00" stroke-width="2" />
            <line x1="90" y1="145" x2="140" y2="145" stroke="#0077ff" stroke-width="2" />

            <!-- Transformer Primary (stacked coils) -->
            <path d="M 140 70 Q 155 82.5, 140 95 Q 155 107.5, 140 120 Q 155 132.5, 140 145 Q 155 157.5, 140 170" stroke="black" fill="none" stroke-width="2"/>
            
            <!-- Core -->
            <line x1="160" y1="70" x2="160" y2="170" stroke="black" stroke-width="2.5"/>
            <line x1="168" y1="70" x2="168" y2="170" stroke="black" stroke-width="2.5"/>
            
            <!-- Transformer Secondary -->
            <path d="M 188 70 Q 173 82.5, 188 95 Q 173 107.5, 188 120 Q 173 132.5, 188 145 Q 173 157.5, 188 170" stroke="black" fill="none" stroke-width="2"/>
            
            <!-- Output lines to first node -->
            <path d="M 188 95 L 205 95 L 205 40 L 230 40" stroke="#ff0000" fill="none" stroke-width="2"/>
            <path d="M 188 120 L 230 120" stroke="#ffaa00" fill="none" stroke-width="2"/>
            <path d="M 188 145 L 205 145 L 205 200 L 230 200" stroke="#0077ff" fill="none" stroke-width="2"/>
        `;
    }

    function drawSection(startX, y_p, color) {
        return `
            <!-- Input dot -->
            <circle cx="${startX}" cy="${y_p}" r="4.5" fill="${color}"/>
            
            <!-- Line to cap 1 -->
            <line x1="${startX}" y1="${y_p}" x2="${startX+40}" y2="${y_p}" stroke="${color}" stroke-width="2"/>
            
            <!-- Cap 1 and ground -->
            <line x1="${startX+40}" y1="${y_p}" x2="${startX+40}" y2="${y_p+15}" stroke="${color}" stroke-width="2"/>
            <line x1="${startX+25}" y1="${y_p+15}" x2="${startX+55}" y2="${y_p+15}" stroke="${color}" stroke-width="2.5"/>
            <line x1="${startX+25}" y1="${y_p+21}" x2="${startX+55}" y2="${y_p+21}" stroke="${color}" stroke-width="2.5"/>
            <line x1="${startX+40}" y1="${y_p+21}" x2="${startX+40}" y2="${y_p+30}" stroke="${color}" stroke-width="2"/>
            <use href="#groundSymbol" x="${startX+40}" y="${y_p+30}" color="${color}" />

            <!-- Line to Inductor -->
            <line x1="${startX+40}" y1="${y_p}" x2="${startX+70}" y2="${y_p}" stroke="${color}" stroke-width="2"/>
            
            <!-- Inductor (3 loops) -->
            <path d="M ${startX+70} ${y_p} 
                     C ${startX+70} ${y_p-12} ${startX+78} ${y_p-12} ${startX+78} ${y_p} 
                     C ${startX+78} ${y_p-12} ${startX+86} ${y_p-12} ${startX+86} ${y_p} 
                     C ${startX+86} ${y_p-12} ${startX+94} ${y_p-12} ${startX+94} ${y_p}" 
                   fill="none" stroke="${color}" stroke-width="2"/>
            
            <!-- Line between Inductor and Resistor -->
            <line x1="${startX+94}" y1="${y_p}" x2="${startX+110}" y2="${y_p}" stroke="${color}" stroke-width="2"/>

            <!-- Resistor (zigzag) -->
            <path d="M ${startX+110} ${y_p} L ${startX+114} ${y_p-6} L ${startX+122} ${y_p+6} L ${startX+130} ${y_p-6} L ${startX+138} ${y_p+6} L ${startX+142} ${y_p}" 
                  fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="miter"/>
            
            <!-- Line to Cap 2 -->
            <line x1="${startX+142}" y1="${y_p}" x2="${startX+170}" y2="${y_p}" stroke="${color}" stroke-width="2"/>

            <!-- Cap 2 and ground -->
            <line x1="${startX+170}" y1="${y_p}" x2="${startX+170}" y2="${y_p+15}" stroke="${color}" stroke-width="2"/>
            <line x1="${startX+155}" y1="${y_p+15}" x2="${startX+185}" y2="${y_p+15}" stroke="${color}" stroke-width="2.5"/>
            <line x1="${startX+155}" y1="${y_p+21}" x2="${startX+185}" y2="${y_p+21}" stroke="${color}" stroke-width="2.5"/>
            <line x1="${startX+170}" y1="${y_p+21}" x2="${startX+170}" y2="${y_p+30}" stroke="${color}" stroke-width="2"/>
            <use href="#groundSymbol" x="${startX+170}" y="${y_p+30}" color="${color}" />

            <!-- Line to output node -->
            <line x1="${startX+170}" y1="${y_p}" x2="${startX+190}" y2="${y_p}" stroke="${color}" stroke-width="2"/>
            <circle cx="${startX+190}" cy="${y_p}" r="4.5" fill="${color}"/>
        `;
    }

    function updateDisplay() {
        lengthSpan.textContent = length;
        
        // Exact formula matching reference screenshot values
        let recvVoltage = 90 + (0.00733 * length) + (0.0001333 * length * length);
        if (length === 0) recvVoltage = 90;
        
        let displayVoltage = recvVoltage.toFixed(2);
        if (length === 0) displayVoltage = "90";
        recvVoltageSpan.textContent = displayVoltage;
        
        // Draw dynamically structured SVG
        const numSections = length / 30;
        const sectionWidth = 190;
        const baseWidth = 230; 
        const tailWidth = 120;
        const totalWidth = baseWidth + (numSections * sectionWidth) + tailWidth;
        
        let svgContent = `<svg height="250" width="${totalWidth}" id="circuit-svg">`;
        svgContent += getDefs();
        svgContent += drawGeneratorAndTransformer();
        
        let currentX = baseWidth;
        for (let i = 0; i < numSections; i++) {
            svgContent += drawSection(currentX, 40, "#ff0000"); // Red
            svgContent += drawSection(currentX, 120, "#ffaa00"); // Yellow
            svgContent += drawSection(currentX, 200, "#0077ff"); // Blue
            currentX += sectionWidth;
        }
        
        // Draw tail (arrows and VR label)
        svgContent += `
            <line x1="${currentX}" y1="40" x2="${currentX+40}" y2="40" stroke="#ff0000" stroke-width="2" marker-end="url(#arrowRed)"/>
            <line x1="${currentX}" y1="120" x2="${currentX+40}" y2="120" stroke="#ffaa00" stroke-width="2" marker-end="url(#arrowYellow)"/>
            <line x1="${currentX}" y1="200" x2="${currentX+40}" y2="200" stroke="#0077ff" stroke-width="2" marker-end="url(#arrowBlue)"/>
            
            <text x="${currentX+55}" y="128" font-size="30" font-family="'Inter', sans-serif" font-weight="bold">V<tspan dy="8" font-size="20">R</tspan></text>
        </svg>`;
        
        circuitCard.innerHTML = svgContent;
        
        // Smoothly scroll to the end of the circuit diagram
        setTimeout(() => {
            circuitCard.scrollTo({
                left: circuitCard.scrollWidth,
                behavior: 'smooth'
            });
        }, 50);
    }

    function renderTable() {
        if (tableRecords.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">No readings recorded yet. Click "Record Data" to save readings.</td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = '';
        tableRecords.forEach((record, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${record.length}</td>
                <td>${record.vs.toFixed(2)}</td>
                <td>${record.vr.toFixed(2)}</td>
                <td style="color: ${record.regulation < 0 ? '#dc2626' : '#16a34a'}">${record.regulation.toFixed(2)}%</td>
            `;
            tableBody.appendChild(tr);
        });
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

    recordBtn.addEventListener('click', () => {
        let vs = 90;
        let vr = 90 + (0.00733 * length) + (0.0001333 * length * length);
        if (length === 0) vr = 90;

        // Regulation % = ((Vs - Vr) / Vr) * 100
        let regulation = ((vs - vr) / vr) * 100;

        // Check duplicate length to avoid redundant entries
        const exists = tableRecords.some(rec => rec.length === length);
        if (!exists) {
            tableRecords.push({ length, vs, vr, regulation });
            tableRecords.sort((a, b) => a.length - b.length);
            renderTable();
        }
    });

    clearBtn.addEventListener('click', () => {
        tableRecords = [];
        renderTable();
    });

    // Initialize layout
    updateDisplay();
});
