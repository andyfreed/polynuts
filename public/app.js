// API Base URL - uses current domain
const API_BASE = window.location.origin;

// State
let provider = null;
let signer = null;
let userAddress = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
        console.log('MetaMask is installed!');
        
        // Check if already connected
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Error checking wallet connection:', error);
        }
    } else {
        document.getElementById('connectBtn').textContent = 'MetaMask Not Installed';
        document.getElementById('connectBtn').disabled = true;
        showError('Please install MetaMask to use this dashboard');
    }

    // Event listeners
    document.getElementById('connectBtn').addEventListener('click', connectWallet);
    document.getElementById('disconnectBtn').addEventListener('click', disconnectWallet);
    document.getElementById('loadMarketsBtn').addEventListener('click', loadMarkets);
    document.getElementById('loadPositionsBtn').addEventListener('click', loadPositions);
    document.getElementById('loadOrdersBtn').addEventListener('click', loadOrders);
    document.getElementById('marketFilter').addEventListener('change', loadMarkets);
}

async function connectWallet() {
    try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Initialize ethers provider
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        userAddress = await signer.getAddress();
        
        // Update UI
        document.getElementById('connectBtn').classList.add('hidden');
        document.getElementById('walletInfo').classList.remove('hidden');
        document.getElementById('walletAddress').textContent = 
            `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
        
        // Show authenticated sections
        document.getElementById('positionsSection').classList.remove('hidden');
        document.getElementById('ordersSection').classList.remove('hidden');
        
        showSuccess(`Connected to ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                connectWallet();
            }
        });
        
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showError('Failed to connect wallet: ' + error.message);
    }
}

function disconnectWallet() {
    provider = null;
    signer = null;
    userAddress = null;
    
    document.getElementById('connectBtn').classList.remove('hidden');
    document.getElementById('walletInfo').classList.add('hidden');
    document.getElementById('positionsSection').classList.add('hidden');
    document.getElementById('ordersSection').classList.add('hidden');
    
    document.getElementById('positionsContainer').innerHTML = 
        '<div class="loading">Connect your wallet and click "Load Positions"...</div>';
    document.getElementById('ordersContainer').innerHTML = 
        '<div class="loading">Connect your wallet and click "Load Orders"...</div>';
}

async function loadMarkets() {
    const container = document.getElementById('marketsContainer');
    const filter = document.getElementById('marketFilter').value;
    
    container.innerHTML = '<div class="loading">Loading markets...</div>';
    
    try {
        const params = new URLSearchParams();
        if (filter === 'active') {
            params.append('active', 'true');
        }
        params.append('limit', '20');
        
        const response = await fetch(`${API_BASE}/api/markets?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if response is an error object
        if (data.error || !Array.isArray(data)) {
            throw new Error(data.message || data.error || 'Invalid response format');
        }
        
        const markets = data;
        
        if (markets.length === 0) {
            container.innerHTML = '<div class="loading">No markets found</div>';
            return;
        }
        
        container.innerHTML = markets.map(market => `
            <div class="market-card">
                <h3>${market.question || market.id}</h3>
                ${market.description ? `<p>${truncate(market.description, 100)}</p>` : ''}
                <div class="market-meta">
                    ${market.volume ? `
                        <div class="meta-item">
                            <span class="meta-label">Volume</span>
                            <span class="meta-value">$${formatNumber(market.volume)}</span>
                        </div>
                    ` : ''}
                    ${market.liquidity ? `
                        <div class="meta-item">
                            <span class="meta-label">Liquidity</span>
                            <span class="meta-value">$${formatNumber(market.liquidity)}</span>
                        </div>
                    ` : ''}
                    <div class="meta-item">
                        <span class="meta-label">Status</span>
                        <span class="meta-value">
                            <span class="status-badge ${market.resolved ? 'status-closed' : 'status-active'}">
                                ${market.resolved ? 'Closed' : 'Active'}
                            </span>
                        </span>
                    </div>
                </div>
                ${market.endDate ? `<p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">Ends: ${new Date(market.endDate).toLocaleDateString()}</p>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading markets:', error);
        container.innerHTML = `<div class="error">Error loading markets: ${error.message}</div>`;
    }
}

async function loadPositions() {
    const container = document.getElementById('positionsContainer');
    
    if (!userAddress) {
        container.innerHTML = '<div class="error">Please connect your wallet first</div>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading positions...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/positions`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if response is an error object
        if (data.error || !Array.isArray(data)) {
            throw new Error(data.message || data.error || 'Invalid response format');
        }
        
        const positions = data;
        
        if (positions.length === 0) {
            container.innerHTML = '<div class="loading">No positions found</div>';
            return;
        }
        
        container.innerHTML = positions.map(position => `
            <div class="position-item">
                <h3>Market: ${position.market || 'N/A'}</h3>
                <p><strong>Outcome:</strong> ${position.outcome || 'N/A'}</p>
                <p><strong>Size:</strong> ${position.size || '0'}</p>
                <p><strong>Price:</strong> $${position.price || '0'}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading positions:', error);
        container.innerHTML = `<div class="error">Error loading positions: ${error.message}</div>`;
    }
}

async function loadOrders() {
    const container = document.getElementById('ordersContainer');
    
    if (!userAddress) {
        container.innerHTML = '<div class="error">Please connect your wallet first</div>';
        return;
    }
    
    container.innerHTML = '<div class="loading">Loading orders...</div>';
    
    try {
        const response = await fetch(`${API_BASE}/api/orders`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if response is an error object
        if (data.error || !Array.isArray(data)) {
            throw new Error(data.message || data.error || 'Invalid response format');
        }
        
        const orders = data;
        
        if (orders.length === 0) {
            container.innerHTML = '<div class="loading">No orders found</div>';
            return;
        }
        
        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <h3>Order ${order.id || 'N/A'}</h3>
                <p><strong>Side:</strong> ${order.side || 'N/A'}</p>
                <p><strong>Size:</strong> ${order.size || '0'}</p>
                <p><strong>Price:</strong> $${order.price || '0'}</p>
                <p><strong>Status:</strong> ${order.status || 'N/A'}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = `<div class="error">Error loading orders: ${error.message}</div>`;
    }
}

// Utility functions
function truncate(str, length) {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = message;
    document.body.insertBefore(errorDiv, document.body.firstChild);
    setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success';
    successDiv.textContent = message;
    document.body.insertBefore(successDiv, document.body.firstChild);
    setTimeout(() => successDiv.remove(), 3000);
}

