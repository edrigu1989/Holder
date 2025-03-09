document.addEventListener('DOMContentLoaded', function() {
    // Load server information
    updateServerInfo();
    
    // Load saved configurations
    loadSavedConfigs();
    
    // Theme selector configuration
    const htmlElement = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    htmlElement.setAttribute('data-theme', savedTheme);
    updateThemeToggleIcon(savedTheme);
    
    // Function to toggle theme
    themeToggle.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        updateThemeToggleIcon(newTheme);
    });
});

function updateThemeToggleIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
}

// Update server information
async function updateServerInfo() {
    try {
        const hostname = window.location.hostname || 'your-domain.com';
        document.getElementById('server-hostname').textContent = hostname;
        document.getElementById('server-hostname-n8n').textContent = hostname;
        
        // Try to get server configuration
        try {
            const response = await fetch('/api/config', {
                headers: {
                    'X-API-Key': localStorage.getItem('api-key') || 'xxxx-xxxx-xxxx-xxxx'
                }
            });
            
            if (response.ok) {
                const config = await response.json();
                
                // Update webhook tokens
                if (config.webhooks.manychat) {
                    const manychatToken = config.webhooks.manychat.token;
                    document.getElementById('manychat-token').textContent = manychatToken;
                    document.getElementById('manychat-token-input').value = manychatToken;
                    localStorage.setItem('manychat-token', manychatToken);
                }
                
                if (config.webhooks.n8n) {
                    const n8nToken = config.webhooks.n8n.token;
                    document.getElementById('n8n-token').textContent = n8nToken;
                    document.getElementById('n8n-token-input').value = n8nToken;
                    localStorage.setItem('n8n-token', n8nToken);
                }
                
                // Update n8n configuration (if exists)
                if (config.n8n) {
                    document.getElementById('n8n-project-name').value = config.n8n.projectName || '';
                    document.getElementById('n8n-workflow-id').value = config.n8n.workflowId || '';
                    document.getElementById('n8n-api-url').value = config.n8n.apiUrl || '';
                    
                    // Don't update API key for security, only use the local one
                    const n8nLocalConfig = JSON.parse(localStorage.getItem('n8n-config') || '{}');
                    document.getElementById('n8n-api-key').value = n8nLocalConfig.apiKey || '';
                }
                
                // Update Supabase configuration (if exists)
                if (config.supabase) {
                    document.getElementById('supabase-url').value = config.supabase.url || '';
                    document.getElementById('supabase-table').value = config.supabase.table || 'messages';
                    
                    // Don't update API key for security, only use the local one
                    const supabaseLocalConfig = JSON.parse(localStorage.getItem('supabase-config') || '{}');
                    document.getElementById('supabase-key').value = supabaseLocalConfig.key || '';
                }
            }
        } catch (serverError) {
            console.warn('Could not get server configuration:', serverError);
            
            // If there's an error, load from localStorage
            loadFromLocalStorage();
        }
    } catch (error) {
        console.error('Error loading server information:', error);
        
        // If there's an error, load from localStorage
        loadFromLocalStorage();
    }
}

// Load configuration from localStorage
function loadFromLocalStorage() {
    try {
        // Load webhook tokens
        const manychatToken = localStorage.getItem('manychat-token') || 'abc123def456';
        const n8nToken = localStorage.getItem('n8n-token') || 'xyz789abc012';
        const apiKey = localStorage.getItem('api-key') || 'xxxx-xxxx-xxxx-xxxx';
        
        document.getElementById('manychat-token').textContent = manychatToken;
        document.getElementById('manychat-token-input').value = manychatToken;
        document.getElementById('n8n-token').textContent = n8nToken;
        document.getElementById('n8n-token-input').value = n8nToken;
        document.getElementById('api-key').textContent = apiKey;
        document.getElementById('api-key-input').value = apiKey;
        
        // Load n8n configuration
        const n8nConfig = JSON.parse(localStorage.getItem('n8n-config') || '{}');
        document.getElementById('n8n-project-name').value = n8nConfig.projectName || '';
        document.getElementById('n8n-workflow-id').value = n8nConfig.workflowId || '';
        document.getElementById('n8n-api-url').value = n8nConfig.apiUrl || '';
        document.getElementById('n8n-api-key').value = n8nConfig.apiKey || '';
        
        // Load Supabase configuration
        const supabaseConfig = JSON.parse(localStorage.getItem('supabase-config') || '{}');
        document.getElementById('supabase-url').value = supabaseConfig.url || '';
        document.getElementById('supabase-key').value = supabaseConfig.key || '';
        document.getElementById('supabase-table').value = supabaseConfig.table || 'messages';
    } catch (error) {
        console.error('Error loading configurations from localStorage:', error);
    }
}

// Copy to clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    let text = '';
    
    if (elementId === 'manychat-webhook-url' || elementId === 'n8n-webhook-url') {
        text = element.innerText.replace('Copy', '').trim();
    } else if (elementId === 'api-key') {
        text = element.innerText.trim();
    } else {
        // If it's a pre element or has complex HTML content
        text = element.innerText.trim();
    }
    
    // Create a temporary element to copy
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    // Show notification
    showNotification('Copied to clipboard!');
}

// Generate a new API Key
function generateApiKey() {
    const apiKey = 'xxxx-xxxx-xxxx-'.replace(/x/g, () => {
        return Math.floor(Math.random() * 16).toString(16);
    }) + Array(4).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    
    document.getElementById('api-key').textContent = apiKey;
    document.getElementById('api-key-input').value = apiKey;
    
    // Save in localStorage
    localStorage.setItem('api-key', apiKey);
    
    // Send the new API Key to the server
    fetch('/api/update-api-key', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': document.getElementById('api-key-input').value
        },
        body: JSON.stringify({ newApiKey: apiKey })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('New API Key generated and applied!');
        } else {
            showNotification('New API Key generated locally! Error applying to server: ' + data.error, 'warning');
        }
    })
    .catch(error => {
        console.error('Error updating API Key on server:', error);
        showNotification('New API Key generated locally! Error applying to server', 'warning');
    });
}

// Generate a new token
function generateToken(type) {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 12; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const tokenElement = document.getElementById(`${type}-token`);
    const tokenInput = document.getElementById(`${type}-token-input`);
    
    tokenElement.textContent = token;
    tokenInput.value = token;
    
    // Save in localStorage
    localStorage.setItem(`${type}-token`, token);
    
    // Send the new token to the server
    fetch('/api/update-webhook-token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': document.getElementById('api-key-input').value
        },
        body: JSON.stringify({ type, token })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('New token generated and applied!');
        } else {
            showNotification('New token generated locally! Error applying to server: ' + data.error, 'warning');
        }
    })
    .catch(error => {
        console.error('Error updating token on server:', error);
        showNotification('New token generated locally! Error applying to server', 'warning');
    });
}

// Confirm regeneration
function confirmRegenerate(type) {
    if (confirm(`Are you sure you want to regenerate the complete URL for ${type}? This could break existing integrations.`)) {
        generateToken(type);
        
        // Simulate a URL change (in production, this would be a server request)
        const hostname = window.location.hostname || 'your-domain.com';
        document.getElementById(`server-hostname${type === 'n8n' ? '-n8n' : ''}`).textContent = hostname;
        
        showNotification('URL regenerated successfully!');
    }
}

// Functions to manage n8n configuration
function saveN8nConfig() {
    const projectName = document.getElementById('n8n-project-name').value.trim();
    const workflowId = document.getElementById('n8n-workflow-id').value.trim();
    const apiUrl = document.getElementById('n8n-api-url').value.trim();
    const apiKey = document.getElementById('n8n-api-key').value.trim();
    
    if (!projectName || !apiUrl) {
        showNotification('Please complete the required fields', 'error');
        return;
    }
    
    // Save in localStorage
    const n8nConfig = {
        projectName,
        workflowId,
        apiUrl,
        apiKey
    };
    
    localStorage.setItem('n8n-config', JSON.stringify(n8nConfig));
    
    // Send configuration to server
    fetch('/api/update-n8n-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': document.getElementById('api-key-input').value
        },
        body: JSON.stringify(n8nConfig)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('n8n configuration saved successfully');
        } else {
            showNotification('Error saving configuration: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving configuration:', error);
        showNotification('Error saving configuration', 'error');
    });
}

// Functions to manage Supabase configuration
function saveSupabaseConfig() {
    const url = document.getElementById('supabase-url').value.trim();
    const key = document.getElementById('supabase-key').value.trim();
    const table = document.getElementById('supabase-table').value.trim();
    
    if (!url || !key) {
        showNotification('Please complete the required fields', 'error');
        return;
    }
    
    // Save in localStorage
    const supabaseConfig = {
        url,
        key,
        table: table || 'messages'
    };
    
    localStorage.setItem('supabase-config', JSON.stringify(supabaseConfig));
    
    // Send configuration to server
    fetch('/api/update-supabase-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': document.getElementById('api-key-input').value
        },
        body: JSON.stringify(supabaseConfig)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Supabase configuration saved successfully');
            if (data.connection === 'error') {
                setTimeout(() => {
                    showNotification('Warning: ' + data.message, 'warning');
                }, 3000);
            }
        } else {
            showNotification('Error saving configuration: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error saving configuration:', error);
        showNotification('Error saving configuration', 'error');
    });
}

// Test Supabase connection
function testSupabaseConnection() {
    const statusElement = document.getElementById('connection-status');
    statusElement.className = '';
    statusElement.textContent = 'Testing connection...';
    
    const url = document.getElementById('supabase-url').value.trim();
    const key = document.getElementById('supabase-key').value.trim();
    const table = document.getElementById('supabase-table').value.trim() || 'messages';
    
    if (!url || !key) {
        statusElement.className = 'connection-error';
        statusElement.textContent = 'Error: Complete the URL and API Key fields';
        return;
    }
    
    // Test connection through the server
    fetch('/api/test-supabase-connection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': document.getElementById('api-key-input').value
        },
        body: JSON.stringify({ url, key, table })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            statusElement.className = 'connection-success';
            statusElement.textContent = '✓ Connection successful';
        } else {
            statusElement.className = 'connection-error';
            statusElement.textContent = `✗ Error: ${data.message || 'Could not connect'}`;
        }
    })
    .catch(error => {
        console.error('Error testing connection:', error);
        statusElement.className = 'connection-error';
        statusElement.textContent = '✗ Error: Could not connect to server';
    });
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// Modified notification function to support types
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification';
    
    if (type === 'error') {
        notification.style.backgroundColor = 'var(--danger)';
    } else if (type === 'warning') {
        notification.style.backgroundColor = 'var(--warning)';
        notification.style.color = 'var(--text-dark)';
    } else {
        notification.style.backgroundColor = 'var(--success)';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Load saved configurations
function loadSavedConfigs() {
    try {
        // Try to load from server first
        updateServerInfo();
    } catch (error) {
        console.error('Error loading saved configurations:', error);
        // If there's an error, load from localStorage
        loadFromLocalStorage();
    }
} 