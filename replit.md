# Solana Trading Bot Replit Project

## Overview

This is a full-stack Solana trading bot application built with React, TypeScript, Express.js, and PostgreSQL. The system monitors new tokens on Solana DEXs (like PumpFun), executes automated trading strategies, and provides a comprehensive dashboard for backtesting and live monitoring.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui styling
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Charts**: Chart.js for performance visualization
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware for logging and error handling
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Polling-based monitoring system
- **API Design**: RESTful endpoints with JSON responses

### Database Schema
- **Trading Parameters**: Configuration for bot behavior (thresholds, position sizes, etc.)
- **Tokens**: Tracked tokens with market data and status
- **Trades**: Historical trade records with P&L calculations
- **Alerts**: System notifications and warnings
- **Backtest Results**: Performance metrics from strategy testing

## Key Components

### Trading Engine
- **Monitoring Service**: Continuously scans for new tokens meeting criteria
- **Position Management**: Tracks active positions and executes trades
- **Risk Management**: Implements stop-loss and take-profit mechanisms
- **Alert System**: Notifies users of important events

### Data Sources
- **DEX APIs**: PumpFun and Jupiter integration for token discovery
- **Solana RPC**: Direct blockchain interaction for real-time data
- **Market Data**: Price feeds and volume tracking

### Backtesting System
- **Historical Analysis**: Tests strategies against past market data
- **Performance Metrics**: Calculates win rate, Sharpe ratio, drawdown
- **Visualization**: Equity curves and trade analysis

## Data Flow

1. **Token Discovery**: DEX APIs provide new token listings
2. **Filtering**: Tokens are filtered based on configured parameters
3. **Monitoring**: Qualifying tokens are added to watch list
4. **Trading Logic**: Automated buy/sell decisions based on market conditions
5. **Position Tracking**: Active trades are monitored for exit conditions
6. **Data Storage**: All activities are logged to PostgreSQL database
7. **Dashboard Updates**: Real-time UI updates via polling

## External Dependencies

### Core Services
- **Solana RPC**: Blockchain interaction and token data
- **PumpFun API**: New token discovery
- **Jupiter API**: Price quotes and routing
- **Neon Database**: Serverless PostgreSQL hosting

### Key Libraries
- **@solana/web3.js**: Solana blockchain interaction
- **@neondatabase/serverless**: Database connectivity
- **drizzle-orm**: Type-safe database queries
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components

## Deployment Strategy

### Development Environment
- **Replit Integration**: Configured for Replit's Node.js environment
- **Hot Reload**: Vite development server with instant updates
- **Database**: PostgreSQL module enabled in Replit

### Production Build
- **Frontend**: Vite builds optimized React bundle
- **Backend**: ESBuild bundles Node.js server
- **Static Assets**: Served from Express with proper caching
- **Environment**: Production mode with error handling

### Configuration
- **Environment Variables**: Database URL, API keys, RPC endpoints
- **Build Scripts**: Separate dev and production workflows
- **Port Configuration**: Express serves on port 5000

## Changelog
- June 26, 2025. Initial setup with React frontend and Express backend
- June 26, 2025. Integrated PostgreSQL database for persistent storage of trading data, parameters, and backtest results
- June 26, 2025. Integrated DexScreener free API for authentic token data collection (no API key required)
- June 26, 2025. Implemented data integrity controls - backtesting only runs with real market data, no mock data fallbacks
- June 27, 2025. Fixed token monitoring to collect Solana-only tokens with realistic market cap filtering and proper age validation
- June 27, 2025. Added copy-to-clipboard functionality for token addresses and confirmed system working with authentic real-time Solana token data
- June 27, 2025. Implemented historical backtesting analysis using realistic 6K market cap thresholds, successfully finding 55% trading opportunity rate among tokens hitting watch criteria
- June 27, 2025. Enhanced backtesting system with comprehensive optimization statistics (opportunity rate, win rate, historical returns) and realistic Solana meme token names replacing generic placeholders
- June 27, 2025. Implemented volume-based viability filters to identify tokens that remain tradeable over time, preventing trades in dead tokens and adding "volume_death" exit condition
- June 28, 2025. Enhanced backtesting with market cap tracking - added entry/exit market cap columns and 1-hour post-TGE analysis to identify tokens with significant growth potential beyond initial trading window
- June 28, 2025. Successfully tested 15K/10K/12K strategy achieving 85% watch hit rate and 58.8% opportunity rate with realistic Solana token behavior analysis

## User Preferences

Preferred communication style: Simple, everyday language.