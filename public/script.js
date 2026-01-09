// Load panels data and render the sign
async function loadPanels() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        renderPanels(data.panels);
    } catch (error) {
        console.error('Error loading panels:', error);
    }
}

// Render panels into columns
function renderPanels(panels) {
    const column1 = document.getElementById('column1');
    const column2 = document.getElementById('column2');
    
    // Clear existing panels
    column1.innerHTML = '';
    column2.innerHTML = '';
    
    // Filter visible panels and sort by column
    const visiblePanels = panels.filter(panel => panel.visible);
    const column1Panels = visiblePanels.filter(panel => panel.column === 1);
    const column2Panels = visiblePanels.filter(panel => panel.column === 2);
    
    // Render column 1
    column1Panels.forEach(panel => {
        const panelElement = createPanelElement(panel);
        column1.appendChild(panelElement);
    });
    
    // Render column 2
    column2Panels.forEach(panel => {
        const panelElement = createPanelElement(panel);
        column2.appendChild(panelElement);
    });
}

// Create a panel element
function createPanelElement(panel) {
    const panelDiv = document.createElement('div');
    panelDiv.className = 'sign-panel';
    panelDiv.textContent = panel.text;
    
    // Make it clickable if URL exists
    if (panel.url) {
        panelDiv.style.cursor = 'pointer';
        panelDiv.addEventListener('click', () => {
            window.open(panel.url, '_blank');
        });
        
        // Add hover effect
        panelDiv.addEventListener('mouseenter', () => {
            panelDiv.style.backgroundColor = '#f0f0f0';
        });
        panelDiv.addEventListener('mouseleave', () => {
            panelDiv.style.backgroundColor = '#ffffff';
        });
    }
    
    return panelDiv;
}

// Load panels when page loads
document.addEventListener('DOMContentLoaded', loadPanels);
