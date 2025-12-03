import { useState, useEffect } from 'react';
import Head from 'next/head';
import Script from 'next/script';

declare global {
  interface Window {
    ethereum?: any;
    ethers?: any;
  }
}

interface Market {
  id: string;
  question?: string;
  description?: string;
  volume?: number;
  liquidity?: number;
  resolved?: boolean;
  endDate?: string;
}

interface Position {
  market: string;
  outcome: string;
  size: string;
  price: string;
}

interface Order {
  id: string;
  side: string;
  size: string;
  price: string;
  status: string;
}

export default function Home() {
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<{ markets: boolean; positions: boolean; orders: boolean }>({
    markets: false,
    positions: false,
    orders: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [marketFilter, setMarketFilter] = useState('active');
  const [ethersLoaded, setEthersLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      checkConnection();
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const checkConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!ethersLoaded || typeof window.ethers === 'undefined') {
      setError('Ethers.js is not loaded yet. Please wait...');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new window.ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      setError(null);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet: ' + error.message);
    }
  };

  const disconnectWallet = () => {
    setUserAddress(null);
    setPositions([]);
    setOrders([]);
  };

  const loadMarkets = async () => {
    setLoading({ ...loading, markets: true });
    setError(null);
    try {
      const params = new URLSearchParams();
      if (marketFilter === 'active') {
        params.append('active', 'true');
      }
      params.append('limit', '20');

      const response = await fetch(`/api/markets?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error || !Array.isArray(data)) {
        throw new Error(data.message || data.error || 'Invalid response format');
      }

      setMarkets(data);
    } catch (error: any) {
      console.error('Error loading markets:', error);
      setError('Error loading markets: ' + error.message);
    } finally {
      setLoading({ ...loading, markets: false });
    }
  };

  const loadPositions = async () => {
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading({ ...loading, positions: true });
    setError(null);
    try {
      const response = await fetch('/api/positions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error || !Array.isArray(data)) {
        throw new Error(data.message || data.error || 'Invalid response format');
      }

      setPositions(data);
    } catch (error: any) {
      console.error('Error loading positions:', error);
      setError('Error loading positions: ' + error.message);
    } finally {
      setLoading({ ...loading, positions: false });
    }
  };

  const loadOrders = async () => {
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading({ ...loading, orders: true });
    setError(null);
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error || !Array.isArray(data)) {
        throw new Error(data.message || data.error || 'Invalid response format');
      }

      setOrders(data);
    } catch (error: any) {
      console.error('Error loading orders:', error);
      setError('Error loading orders: ' + error.message);
    } finally {
      setLoading({ ...loading, orders: false });
    }
  };

  const truncate = (str: string, length: number) => {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };

  return (
    <>
      <Head>
        <title>Polynuts - Polymarket Dashboard</title>
        <meta name="description" content="Polymarket API integration dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Script
        src="https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js"
        onLoad={() => setEthersLoaded(true)}
        onError={() => {
          // Try fallback
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js';
          script.onload = () => setEthersLoaded(true);
          script.onerror = () => setError('Failed to load ethers.js library');
          document.head.appendChild(script);
        }}
      />

      <div className="container">
        <header>
          <h1>🧠 Polynuts</h1>
          <p className="subtitle">Polymarket Dashboard</p>
          <div className="wallet-section">
            {!userAddress ? (
              <button
                className="btn btn-primary"
                onClick={connectWallet}
                disabled={!ethersLoaded || typeof window?.ethereum === 'undefined'}
              >
                {typeof window !== 'undefined' && typeof window.ethereum === 'undefined'
                  ? 'MetaMask Not Installed'
                  : 'Connect MetaMask'}
              </button>
            ) : (
              <div className="wallet-info">
                <span className="wallet-address">
                  {`${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`}
                </span>
                <button className="btn btn-secondary" onClick={disconnectWallet}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </header>

        {error && <div className="error">{error}</div>}

        <main>
          <section className="section">
            <h2>Markets</h2>
            <div className="controls">
              <button
                className="btn btn-primary"
                onClick={loadMarkets}
                disabled={loading.markets}
              >
                {loading.markets ? 'Loading...' : 'Load Active Markets'}
              </button>
              <select
                className="select"
                value={marketFilter}
                onChange={(e) => {
                  setMarketFilter(e.target.value);
                  loadMarkets();
                }}
              >
                <option value="active">Active Markets</option>
                <option value="all">All Markets</option>
              </select>
            </div>
            <div className="markets-grid">
              {markets.length === 0 && !loading.markets ? (
                <div className="loading">Click &quot;Load Active Markets&quot; to fetch markets...</div>
              ) : (
                markets.map((market) => (
                  <div key={market.id} className="market-card">
                    <h3>{market.question || market.id}</h3>
                    {market.description && <p>{truncate(market.description, 100)}</p>}
                    <div className="market-meta">
                      {market.volume && (
                        <div className="meta-item">
                          <span className="meta-label">Volume</span>
                          <span className="meta-value">${formatNumber(market.volume)}</span>
                        </div>
                      )}
                      {market.liquidity && (
                        <div className="meta-item">
                          <span className="meta-label">Liquidity</span>
                          <span className="meta-value">${formatNumber(market.liquidity)}</span>
                        </div>
                      )}
                      <div className="meta-item">
                        <span className="meta-label">Status</span>
                        <span className="meta-value">
                          <span className={`status-badge ${market.resolved ? 'status-closed' : 'status-active'}`}>
                            {market.resolved ? 'Closed' : 'Active'}
                          </span>
                        </span>
                      </div>
                    </div>
                    {market.endDate && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Ends: {new Date(market.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {userAddress && (
            <>
              <section className="section">
                <h2>Your Positions</h2>
                <button
                  className="btn btn-primary"
                  onClick={loadPositions}
                  disabled={loading.positions}
                >
                  {loading.positions ? 'Loading...' : 'Load Positions'}
                </button>
                <div className="positions-list">
                  {positions.length === 0 && !loading.positions ? (
                    <div className="loading">Connect your wallet and click &quot;Load Positions&quot;...</div>
                  ) : (
                    positions.map((position, idx) => (
                      <div key={idx} className="position-item">
                        <h3>Market: {position.market || 'N/A'}</h3>
                        <p><strong>Outcome:</strong> {position.outcome || 'N/A'}</p>
                        <p><strong>Size:</strong> {position.size || '0'}</p>
                        <p><strong>Price:</strong> ${position.price || '0'}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="section">
                <h2>Your Orders</h2>
                <button
                  className="btn btn-primary"
                  onClick={loadOrders}
                  disabled={loading.orders}
                >
                  {loading.orders ? 'Loading...' : 'Load Orders'}
                </button>
                <div className="orders-list">
                  {orders.length === 0 && !loading.orders ? (
                    <div className="loading">Connect your wallet and click &quot;Load Orders&quot;...</div>
                  ) : (
                    orders.map((order) => (
                      <div key={order.id} className="order-item">
                        <h3>Order {order.id || 'N/A'}</h3>
                        <p><strong>Side:</strong> {order.side || 'N/A'}</p>
                        <p><strong>Size:</strong> {order.size || '0'}</p>
                        <p><strong>Price:</strong> ${order.price || '0'}</p>
                        <p><strong>Status:</strong> {order.status || 'N/A'}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </>
  );
}

