import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import { PolymarketConfig } from './config';

export interface Market {
  id: string;
  question: string;
  description?: string;
  endDate?: string;
  resolved?: boolean;
  volume?: number;
  liquidity?: number;
}

export interface OrderBook {
  bids: Order[];
  asks: Order[];
}

export interface Order {
  price: string;
  size: string;
  side: 'buy' | 'sell';
}

export interface Position {
  market: string;
  outcome: string;
  size: string;
  price: string;
}

export class PolymarketClient {
  private client: AxiosInstance;
  private dataApiClient: AxiosInstance; // For Gamma/Data-API endpoints
  private config: PolymarketConfig;

  constructor(config: PolymarketConfig) {
    this.config = config;
    
    // CLOB API base URL for trading operations
    const clobBaseURL = config.baseUrl || 'https://clob.polymarket.com';
    
    // Gamma API base URL for market data (based on Polymarket docs)
    // Gamma API is typically accessed via a different endpoint
    // Try common Gamma API URLs - use data-api as primary
    const dataApiBaseURL = 'https://data-api.polymarket.com';
    
    // CLOB client with authentication
    this.client = axios.create({
      baseURL: clobBaseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    
    // Data-API client (no authentication needed for public endpoints)
    this.dataApiClient = axios.create({
      baseURL: dataApiBaseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for authentication and logging
    this.client.interceptors.request.use(
      (requestConfig) => {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        
        // Create the message to sign (method + path + timestamp + body)
        const method = requestConfig.method?.toUpperCase() || 'GET';
        const path = requestConfig.url || '';
        const body = requestConfig.data ? JSON.stringify(requestConfig.data) : '';
        const message = `${method}${path}${timestamp}${body}`;
        
        // Generate HMAC signature
        const signature = crypto
          .createHmac('sha256', config.secret)
          .update(message)
          .digest('hex');
        
        // Add Polymarket authentication headers
        requestConfig.headers = requestConfig.headers || {};
        requestConfig.headers['POLY_API_KEY'] = config.apiKey;
        requestConfig.headers['POLY_PASSPHRASE'] = config.passphrase;
        requestConfig.headers['POLY_TIMESTAMP'] = timestamp;
        requestConfig.headers['POLY_SIGNATURE'] = signature;
        
        if (config.polyAddress) {
          requestConfig.headers['POLY_ADDRESS'] = config.polyAddress;
        }
        
        console.log(`Making ${method} request to ${path}`);
        return requestConfig;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
          console.error('Network Error:', error.request);
        } else {
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get list of markets (uses Gamma API)
   */
  async getMarkets(filters?: {
    active?: boolean;
    closed?: boolean;
    limit?: number;
  }): Promise<Market[]> {
    try {
      const params = new URLSearchParams();
      // Gamma API parameters
      if (filters?.active !== undefined) {
        params.append('active', filters.active.toString());
      }
      if (filters?.closed !== undefined) {
        params.append('closed', filters.closed.toString());
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString());
      }

      // Use Gamma API endpoint for markets
      // According to Polymarket docs, Gamma endpoints are at /gamma/* or /markets
      // Try multiple possible endpoint structures
      const endpoints = [
        `/markets?${params.toString()}`,  // Direct markets endpoint
        `/gamma/markets?${params.toString()}`,  // Gamma-prefixed
        `/core/markets?${params.toString()}`,  // Core endpoint
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await this.dataApiClient.get(endpoint);
          // Handle different response formats
          if (Array.isArray(response.data)) {
            return response.data;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            return response.data.data;
          } else if (response.data?.results && Array.isArray(response.data.results)) {
            return response.data.results;
          } else if (response.data?.markets && Array.isArray(response.data.markets)) {
            return response.data.markets;
          }
        } catch (err: any) {
          // Try next endpoint if this one fails (unless it's the last one)
          if (endpoints.indexOf(endpoint) === endpoints.length - 1) {
            throw err;
          }
          continue;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  /**
   * Get a specific market by ID (uses Gamma API)
   */
  async getMarket(marketId: string): Promise<Market> {
    try {
      // Try Gamma API endpoint
      try {
        const response = await this.dataApiClient.get(`/markets/${marketId}`);
        return response.data?.data || response.data;
      } catch (err: any) {
        // Fallback to core endpoint
        if (err.response?.status === 404) {
          const coreResponse = await this.dataApiClient.get(`/core/markets/${marketId}`);
          return coreResponse.data?.data || coreResponse.data;
        }
        throw err;
      }
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Get order book for a market
   */
  async getOrderBook(marketId: string, tokenId: string): Promise<OrderBook> {
    try {
      const response = await this.client.get(`/book?token_id=${tokenId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching order book for market ${marketId}:`, error);
      throw error;
    }
  }

  /**
   * Get user's positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.get('/positions');
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  /**
   * Get user's orders
   */
  async getOrders(marketId?: string): Promise<any[]> {
    try {
      const url = marketId 
        ? `/orders?market=${marketId}`
        : '/orders';
      const response = await this.client.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  /**
   * Place an order
   * Note: You'll need to sign the order using Polymarket's order signing utilities
   */
  async placeOrder(order: {
    token_id: string;
    price: string;
    side: 'buy' | 'sell';
    size: string;
    // Add other required fields based on Polymarket API
  }): Promise<any> {
    try {
      const response = await this.client.post('/orders', order);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    try {
      await this.client.delete(`/orders/${orderId}`);
    } catch (error) {
      console.error(`Error canceling order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get market prices and stats
   */
  async getMarketPrices(marketId: string): Promise<any> {
    try {
      const response = await this.client.get(`/markets/${marketId}/prices`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching prices for market ${marketId}:`, error);
      throw error;
    }
  }
}

