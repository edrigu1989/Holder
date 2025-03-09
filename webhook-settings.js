// Global variables
let serverSettings = {
    hostname: window.location.hostname || 'your-domain.com',
    manychatToken: 'abc123def456',
    n8nWebhookUrl: '',
    apiKey: 'xxxx-xxxx-xxxx-xxxx'
};

// Check if user is logged in
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = JSON.parse(sessionStorage.getItem('m5v_current_user'));
    if (!currentUser) {
        // Redirect to login page if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Only allow admin access
    if (currentUser.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // Initialize theme
    initTheme();
    
    // Load saved settings
    loadSettings();
    
    // Update webhook URLs
    updateWebhookURLs();
});

// Initialize theme settings
function initTheme() {
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
}

// Update theme toggle icon
function updateThemeToggleIcon(theme) {
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.innerHTML = theme === 'light' ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
}

// Load saved settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('webhookSettings');
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        serverSettings = { ...serverSettings, ...parsedSettings };
    }
    
    // Load values into input fields
    document.getElementById('manychat-token-input').value = serverSettings.manychatToken;
    
    // Cargar la URL del webhook de n8n si existe
    if (serverSettings.n8nWebhookUrl) {
        document.getElementById('n8n-webhook-input').value = serverSettings.n8nWebhookUrl;
    }
    
    document.getElementById('api-key-input').value = serverSettings.apiKey;
    
    // Load n8n settings if they exist
    const n8nConfig = localStorage.getItem('n8nConfig');
    if (n8nConfig) {
        const config = JSON.parse(n8nConfig);
        document.getElementById('n8n-project-name').value = config.projectName || '';
        document.getElementById('n8n-workflow-id').value = config.workflowId || '';
        document.getElementById('n8n-api-url').value = config.apiUrl || '';
        document.getElementById('n8n-api-key').value = config.apiKey || '';
    }
    
    // Load Supabase settings if they exist
    const supabaseConfig = localStorage.getItem('supabaseConfig');
    if (supabaseConfig) {
        const config = JSON.parse(supabaseConfig);
        document.getElementById('supabase-url').value = config.url || '';
        document.getElementById('supabase-key').value = config.key || '';
        document.getElementById('supabase-table').value = config.table || 'messages';
    }
}

// Update the webhook URLs with current settings
function updateWebhookURLs() {
    // Update hostname spans
    const hostnameElements = document.querySelectorAll('[id^="server-hostname"]');
    hostnameElements.forEach(el => {
        el.textContent = serverSettings.hostname;
    });
    
    // Update token spans
    document.getElementById('manychat-token').textContent = serverSettings.manychatToken;
    document.getElementById('n8n-token').textContent = serverSettings.n8nToken;
    document.getElementById('api-key').textContent = serverSettings.apiKey;
}

// Generate a random token
function generateRandomToken(length = 16) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// Generate a new token for the specified service
function generateToken(service) {
    const token = generateRandomToken();
    
    if (service === 'manychat') {
        serverSettings.manychatToken = token;
        document.getElementById('manychat-token-input').value = token;
        document.getElementById('manychat-token').textContent = token;
    } else if (service === 'n8n') {
        serverSettings.n8nToken = token;
        document.getElementById('n8n-token-input').value = token;
        document.getElementById('n8n-token').textContent = token;
    }
    
    // Save to localStorage
    localStorage.setItem('webhookSettings', JSON.stringify(serverSettings));
    
    // Show notification
    showNotification('Token generated successfully!');
}

// Generate a new API key
function generateApiKey() {
    // Format: xxxx-xxxx-xxxx-xxxx
    const segments = [];
    for (let i = 0; i < 4; i++) {
        segments.push(generateRandomToken(4));
    }
    const apiKey = segments.join('-');
    
    serverSettings.apiKey = apiKey;
    document.getElementById('api-key-input').value = apiKey;
    document.getElementById('api-key').textContent = apiKey;
    
    // Save to localStorage
    localStorage.setItem('webhookSettings', JSON.stringify(serverSettings));
    
    // Show notification
    showNotification('API Key generated successfully!');
}

// Confirm regeneration of complete URL
function confirmRegenerate(service) {
    if (confirm(`Are you sure you want to regenerate the ${service} webhook URL? This will invalidate the existing URL.`)) {
        // Generate a new token
        generateToken(service);
        
        // Update the hostname if needed
        serverSettings.hostname = window.location.hostname || 'your-domain.com';
        updateWebhookURLs();
        
        // Show notification
        showNotification('Webhook URL regenerated successfully!');
    }
}

// Copy to clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    
    if (!element) return;
    
    // Create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = element.textContent;
    document.body.appendChild(textarea);
    
    // Select and copy the text
    textarea.select();
    document.execCommand('copy');
    
    // Clean up
    document.body.removeChild(textarea);
    
    // Show notification
    showNotification('Copied to clipboard!');
}

// Save n8n configuration
function saveN8nConfig() {
    const config = {
        projectName: document.getElementById('n8n-project-name').value,
        workflowId: document.getElementById('n8n-workflow-id').value,
        apiUrl: document.getElementById('n8n-api-url').value,
        apiKey: document.getElementById('n8n-api-key').value
    };
    
    // Save to localStorage
    localStorage.setItem('n8nConfig', JSON.stringify(config));
    
    // Show notification
    showNotification('n8n configuration saved successfully!');
    
    // In a real application, you would also send this to your server:
    // saveConfigToServer('n8n', config);
}

// Save Supabase configuration
function saveSupabaseConfig() {
    const config = {
        url: document.getElementById('supabase-url').value,
        key: document.getElementById('supabase-key').value,
        table: document.getElementById('supabase-table').value
    };
    
    // Save to localStorage
    localStorage.setItem('supabaseConfig', JSON.stringify(config));
    
    // Show notification
    showNotification('Supabase configuration saved successfully!');
    
    // In a real application, you would also send this to your server:
    // saveConfigToServer('supabase', config);
}

// Test Supabase connection (simulated)
function testSupabaseConnection() {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = 'Testing connection...';
    statusElement.className = '';
    
    const supabaseUrl = document.getElementById('supabase-url').value;
    const supabaseKey = document.getElementById('supabase-key').value;
    
    if (!supabaseUrl || !supabaseKey) {
        statusElement.textContent = 'Error: URL and API Key are required';
        statusElement.className = 'connection-error';
        return;
    }
    
    // Simulate API call
    setTimeout(() => {
        // 80% chance of success for demo purposes
        if (Math.random() > 0.2) {
            statusElement.textContent = 'Connection successful!';
            statusElement.className = 'connection-success';
        } else {
            statusElement.textContent = 'Error: Could not connect to Supabase';
            statusElement.className = 'connection-error';
        }
    }, 1500);
    
    // In a real application, you would make an actual API call to verify the connection
}

// Toggle password visibility
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

// Show notification
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Simulate API call to save config to server (would be implemented in a real app)
function saveConfigToServer(configType, configData) {
    console.log(`Saving ${configType} configuration to server:`, configData);
    
    // This would be a real API call in a production environment
    // Simulating a successful response for demo purposes
    return Promise.resolve({ success: true });
}

// Nueva función para guardar la URL del webhook de n8n
function saveN8nWebhook() {
    const webhookUrl = document.getElementById('n8n-webhook-input').value.trim();
    
    if (!webhookUrl) {
        showNotification('Error: Please enter a valid webhook URL');
        return;
    }
    
    // Validación básica de URL
    if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
        showNotification('Error: URL must start with http:// or https://');
        return;
    }
    
    // Guardar la URL
    serverSettings.n8nWebhookUrl = webhookUrl;
    localStorage.setItem('webhookSettings', JSON.stringify(serverSettings));
    
    // Mostrar notificación
    showNotification('n8n webhook URL saved successfully!');
    
    // En una aplicación real, también enviarías esto a tu servidor:
    // saveConfigToServer('n8nWebhook', { url: webhookUrl });
}

// ManyChat API Integration Functions
function saveManyChat() {
    const apiKey = document.getElementById('manychat-api-key').value;
    const pageId = document.getElementById('manychat-page-id').value;
    
    if (!apiKey) {
        alert('Please enter your ManyChat API Key');
        return;
    }
    
    // Guardar en localStorage (en producción, considerar opciones más seguras)
    localStorage.setItem('manychat_api_key', apiKey);
    localStorage.setItem('manychat_page_id', pageId);
    
    showNotification('ManyChat API configuration saved successfully!');
}

function testManyChat() {
    const apiKey = document.getElementById('manychat-api-key').value;
    const statusElement = document.getElementById('manychat-api-status');
    
    if (!apiKey) {
        statusElement.textContent = 'Please enter your ManyChat API Key';
        statusElement.style.color = 'var(--danger)';
        return;
    }
    
    statusElement.textContent = 'Testing connection...';
    statusElement.style.color = '';
    
    // Simulación de prueba de conexión a ManyChat API
    // En una implementación real, aquí se haría una llamada a la API de ManyChat
    setTimeout(() => {
        statusElement.textContent = 'Connection successful!';
        statusElement.style.color = 'var(--success)';
    }, 1500);
}

function getSubscribers() {
    const apiKey = document.getElementById('manychat-api-key').value;
    const responseElement = document.getElementById('api-response');
    
    if (!apiKey) {
        responseElement.textContent = 'Please enter your ManyChat API Key';
        return;
    }
    
    responseElement.textContent = 'Loading subscribers...';
    
    // Simulación de obtención de suscriptores
    // En una implementación real, aquí se haría una llamada a la API de ManyChat
    setTimeout(() => {
        const mockResponse = {
            success: true,
            data: {
                subscribers: [
                    { id: '123456789', name: 'John Doe', status: 'active' },
                    { id: '987654321', name: 'Jane Smith', status: 'active' },
                    { id: '456789123', name: 'Robert Johnson', status: 'inactive' }
                ],
                total: 3
            }
        };
        
        responseElement.textContent = JSON.stringify(mockResponse, null, 2);
    }, 1500);
}

function getTags() {
    const apiKey = document.getElementById('manychat-api-key').value;
    const responseElement = document.getElementById('api-response');
    
    if (!apiKey) {
        responseElement.textContent = 'Please enter your ManyChat API Key';
        return;
    }
    
    responseElement.textContent = 'Loading tags...';
    
    // Simulación de obtención de etiquetas
    // En una implementación real, aquí se haría una llamada a la API de ManyChat
    setTimeout(() => {
        const mockResponse = {
            success: true,
            data: {
                tags: [
                    { id: '1', name: 'Customer', count: 120 },
                    { id: '2', name: 'Lead', count: 45 },
                    { id: '3', name: 'VIP', count: 12 }
                ],
                total: 3
            }
        };
        
        responseElement.textContent = JSON.stringify(mockResponse, null, 2);
    }, 1500);
}

function getFlows() {
    const apiKey = document.getElementById('manychat-api-key').value;
    const responseElement = document.getElementById('api-response');
    
    if (!apiKey) {
        responseElement.textContent = 'Please enter your ManyChat API Key';
        return;
    }
    
    responseElement.textContent = 'Loading flows...';
    
    // Simulación de obtención de flujos
    // En una implementación real, aquí se haría una llamada a la API de ManyChat
    setTimeout(() => {
        const mockResponse = {
            success: true,
            data: {
                flows: [
                    { id: '101', name: 'Welcome Flow', status: 'active' },
                    { id: '102', name: 'Lead Nurturing', status: 'active' },
                    { id: '103', name: 'Abandoned Cart', status: 'paused' }
                ],
                total: 3
            }
        };
        
        responseElement.textContent = JSON.stringify(mockResponse, null, 2);
    }, 1500);
}

// Cargar valores guardados de ManyChat API
function loadManyChatAPISettings() {
    const savedApiKey = localStorage.getItem('manychat_api_key');
    const savedPageId = localStorage.getItem('manychat_page_id');
    
    if (savedApiKey) {
        document.getElementById('manychat-api-key').value = savedApiKey;
    }
    
    if (savedPageId) {
        document.getElementById('manychat-page-id').value = savedPageId;
    }
}

// Añadir event listeners para los botones de ManyChat API
document.addEventListener('DOMContentLoaded', function() {
    // Cargar configuración guardada
    loadManyChatAPISettings();
    
    // Botón para guardar configuración de ManyChat API
    const saveManyChatAPIBtn = document.getElementById('save-manychat-api');
    if (saveManyChatAPIBtn) {
        saveManyChatAPIBtn.addEventListener('click', saveManyChat);
    }
    
    // Botón para probar conexión con ManyChat API
    const testManyChatAPIBtn = document.getElementById('test-manychat-api');
    if (testManyChatAPIBtn) {
        testManyChatAPIBtn.addEventListener('click', testManyChat);
    }
    
    // Botones para acciones de API
    const getSubscribersBtn = document.getElementById('get-subscribers');
    if (getSubscribersBtn) {
        getSubscribersBtn.addEventListener('click', getSubscribers);
    }
    
    const getTagsBtn = document.getElementById('get-tags');
    if (getTagsBtn) {
        getTagsBtn.addEventListener('click', getTags);
    }
    
    const getFlowsBtn = document.getElementById('get-flows');
    if (getFlowsBtn) {
        getFlowsBtn.addEventListener('click', getFlows);
    }
}); 