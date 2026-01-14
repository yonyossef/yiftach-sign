let panelsData = [];

// Check authentication on page load
async function checkAuth() {
    try {
        console.log('Checking auth, cookies:', document.cookie);
        const response = await fetch('/api/verify', {
            credentials: 'include'
        });
        const data = await response.json();
        
        console.log('Verify response:', data);
        console.log('Response headers:', response.headers);
        
        if (!data.authenticated) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = '/admin.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/admin.html';
        return false;
    }
}

// Load panels data
async function loadPanels() {
    try {
        const response = await fetch('/api/data', {
            credentials: 'include'
        });
        const data = await response.json();
        panelsData = data.panels;
        renderPanels();
    } catch (error) {
        console.error('Error loading panels:', error);
        showError('שגיאה בטעינת הנתונים');
    }
}

// Render panels for editing
function renderPanels() {
    const panelsList = document.getElementById('panelsList');
    const loadingMessage = document.getElementById('loadingMessage');
    const panelsContainer = document.getElementById('panelsContainer');
    
    panelsList.innerHTML = '';
    
    // Sort panels by column and id
    const sortedPanels = [...panelsData].sort((a, b) => {
        if (a.column !== b.column) return a.column - b.column;
        return a.id - b.id;
    });
    
    sortedPanels.forEach(panel => {
        const panelDiv = createPanelEditor(panel);
        panelsList.appendChild(panelDiv);
    });
    
    loadingMessage.style.display = 'none';
    panelsContainer.style.display = 'block';
}

// Create panel editor element
function createPanelEditor(panel) {
    const panelDiv = document.createElement('div');
    panelDiv.className = 'panel-editor';
    panelDiv.dataset.panelId = panel.id;
    
    panelDiv.innerHTML = `
        <div class="panel-editor-header">
            <span class="panel-number">לוח #${panel.id} (עמודה ${panel.column})</span>
        </div>
        <div class="panel-editor-fields">
            <div class="field-group">
                <label>
                    <input type="checkbox" class="panel-visible" ${panel.visible ? 'checked' : ''}>
                    לוח מוצג
                </label>
            </div>
            <div class="field-group">
                <label>טקסט:</label>
                <input type="text" class="panel-text" value="${escapeHtml(panel.text)}" placeholder="טקסט הלוח">
            </div>
            <div class="field-group">
                <label>קישור לגוגל מפות (URL):</label>
                <input type="url" class="panel-url" value="${escapeHtml(panel.url)}" placeholder="https://maps.google.com/...">
            </div>
        </div>
    `;
    
    return panelDiv;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Save panels data
async function savePanels() {
    // Ask for confirmation before saving
    if (!confirm('האם אתה בטוח שברצונך לשמור את השינויים?')) {
        return;
    }
    
    const panelsList = document.getElementById('panelsList');
    const panelEditors = panelsList.querySelectorAll('.panel-editor');
    
    const updatedPanels = [];
    
    panelEditors.forEach(editor => {
        const panelId = parseInt(editor.dataset.panelId);
        const originalPanel = panelsData.find(p => p.id === panelId);
        
        if (originalPanel) {
            const updatedPanel = {
                ...originalPanel,
                visible: editor.querySelector('.panel-visible').checked,
                text: editor.querySelector('.panel-text').value.trim(),
                url: editor.querySelector('.panel-url').value.trim()
            };
            updatedPanels.push(updatedPanel);
        }
    });
    
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ panels: updatedPanels })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            panelsData = updatedPanels;
            showSuccess('הנתונים נשמרו בהצלחה');
        } else {
            showError(data.error || 'שגיאה בשמירת הנתונים');
        }
    } catch (error) {
        console.error('Save error:', error);
        showError('שגיאה בחיבור לשרת');
    }
}

// Logout
async function logout() {
    try {
        await fetch('/api/logout', { 
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/admin.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = '/admin.html';
    }
}

// Show error message
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
    
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    const isAuthenticated = await checkAuth();
    if (isAuthenticated) {
        await loadPanels();
        
        // Set up save button
        document.getElementById('saveButton').addEventListener('click', savePanels);
        
        // Set up logout button
        document.getElementById('logoutButton').addEventListener('click', logout);
    }
});
