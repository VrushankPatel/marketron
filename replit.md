# TradeFlow 3D - Professional Trading Simulator

## Overview

TradeFlow 3D is a comprehensive, frontend-focused educational trading simulator built with React and TypeScript. The platform simulates a complete trading ecosystem featuring multiple asset classes (Equities, Futures & Options, Forex, Indices) with real-time market simulation, advanced order management, risk analytics, and 3D trade lifecycle visualization. The application is designed as a learning tool for understanding professional trading infrastructure, market mechanics, and risk management principles.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Core Framework:**
- React 18+ with TypeScript for type safety and modern development
- Vite as the build tool and development server
- Path aliases configured (`@/` for client/src, `@shared/` for shared modules)

**State Management:**
- Zustand with subscription middleware for reactive state management
- Multiple specialized stores:
  - `useTradingStore`: UI state, instrument selection, settings, watchlists
  - `useMarketDataStore`: Real-time market data, order books, tick data, OHLCV charts
  - `useOrderStore`: Order lifecycle management, trades, execution reports
  - `usePositionStore`: Position tracking, P&L calculations
  - `useRiskStore`: Risk metrics, limits, breach monitoring
  - `useTutorialStore`: Interactive tutorials, achievements, progress tracking
- Local storage persistence for user preferences and state

**UI Component Library:**
- shadcn/ui (Radix UI primitives) for accessible, customizable components
- Tailwind CSS for styling with custom design tokens
- Dark mode support with theme persistence
- Responsive layouts using CSS Grid and Flexbox

**Data Visualization:**
- Recharts for standard charts (line, area, bar, pie)
- Lightweight Charts (TradingView) integration for professional trading charts
- Three.js with React Three Fiber for 3D visualization of trade lifecycle
- Custom market depth visualizations

**Layout System:**
- Resizable panel groups for flexible workspace customization
- Tab-based navigation (Trading Workstation, Market Overview, Risk Dashboard, 3D Visualization)
- Configurable panel visibility through layout settings

### Backend Architecture

**Server Framework:**
- Express.js server with TypeScript
- Development mode uses Vite middleware for HMR
- Production build separates static assets and server code

**Data Storage:**
- In-memory storage (`MemStorage`) for demo/simulation purposes
- Storage interface abstraction (`IStorage`) allows future database implementation
- Drizzle ORM configured for PostgreSQL (schema defined but not actively used)
- Local storage used for client-side persistence

**API Design:**
- RESTful API structure (routes defined but minimal implementation)
- Designed for future expansion with `/api` prefix
- WebSocket simulation for real-time data feeds (mocked client-side)

### Market Simulation Engine

**Market Data Service:**
- Simulates real-time price updates for multiple instruments
- Generates realistic bid/ask spreads based on volatility profiles
- Maintains order books with multiple price levels
- Produces tick data and OHLCV candles
- Supports multiple asset classes with different characteristics

**Matching Engine:**
- Price-time priority matching algorithm
- Supports various order types (Market, Limit, Stop, Stop-Limit, Iceberg, TWAP, VWAP)
- Handles complex orders (Bracket, OCO, Multi-leg)
- Self-trade prevention logic
- Simulates partial fills and order book depth

**Order Management System:**
- Complete order lifecycle tracking (New → Partially Filled → Filled/Cancelled/Rejected)
- Multiple time-in-force options (DAY, GTC, IOC, FOK, GTD)
- Execution report generation
- Support for FIX and OUCH protocol simulation

### Trading Infrastructure Simulation

**Complex Order Service:**
- Bracket orders with take-profit and stop-loss
- OCO (One-Cancels-Other) order pairs
- Contingent order monitoring and execution
- Multi-leg strategy support for options

**Protocol Services:**
- FIX protocol message simulation (NewOrderSingle, OrderCancelRequest, ExecutionReport)
- OUCH protocol simulation
- ITCH market data feed simulation
- Gateway session management with heartbeat monitoring

**Clearing & Settlement:**
- T+0 to T+3 settlement cycle simulation
- Margin requirement calculations
- Trade confirmation workflow
- Settlement instruction generation

### Risk Management

**Risk Analytics:**
- Value-at-Risk (VaR) calculations using historical, parametric, and Monte Carlo methods
- Expected Shortfall (CVaR) metrics
- Sharpe ratio, maximum drawdown, volatility calculations
- Portfolio-level risk aggregation

**Position Management:**
- Real-time position tracking with P&L attribution
- Average price calculation for position averaging
- Unrealized and realized P&L computation
- Market value updates based on live prices

**Risk Limits:**
- Configurable position size limits
- Daily loss limits with breach monitoring
- Concentration risk tracking
- Pre-trade risk checks

### Options Pricing

**Black-Scholes Model:**
- Call and Put option pricing
- Greeks calculation (Delta, Gamma, Theta, Vega, Rho)
- Intrinsic and time value decomposition
- Option chain generation with multiple strikes and expiries

### Analytics & Reporting

**Backtesting Engine:**
- Historical strategy simulation
- Performance metrics calculation
- Trade-by-trade analysis
- Equity curve generation

**Reporting Service:**
- Trade capture reports
- Execution quality reports
- Position reports with top gainers/losers
- P&L attribution by symbol, sector, strategy

### Educational Features

**Tutorial System:**
- Step-by-step guided tutorials
- Interactive element highlighting with positioning
- Tutorial prerequisites and progression tracking
- Category-based organization (basics, trading, analysis, risk, advanced)

**Achievement System:**
- Unlockable achievements tied to user actions
- Point-based progression system
- Achievement notifications
- Category-based achievement tracking

**Market Event Simulator:**
- Predefined crisis scenarios (2008 Financial Crisis, Flash Crash, etc.)
- Custom market event creation
- Real-time event impact on prices and volatility
- Event history tracking

## External Dependencies

### UI & Visualization
- **Radix UI**: Accessible component primitives (@radix-ui/react-*)
- **Recharts**: Chart library for standard visualizations
- **Three.js**: 3D graphics library
- **React Three Fiber**: React renderer for Three.js
- **React Three Drei**: Helpers for React Three Fiber
- **Framer Motion**: Animation library (referenced in spec, not in package.json)
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

### State & Data Management
- **Zustand**: State management with middleware support
- **TanStack Query**: Server state management and caching
- **Drizzle ORM**: TypeScript ORM for database operations
- **Zod**: Schema validation

### Development Tools
- **Vite**: Build tool and dev server
- **TypeScript**: Type system
- **ESBuild**: JavaScript bundler
- **PostCSS**: CSS processing with Autoprefixer
- **TSX**: TypeScript execution for dev server

### Database (Configured but Optional)
- **@neondatabase/serverless**: Neon serverless PostgreSQL driver
- **Drizzle Kit**: Database migration tool

### Styling Utilities
- **class-variance-authority**: CSS variant management
- **clsx**: Conditional className utility
- **tailwind-merge**: Tailwind class merging

### Fonts
- **@fontsource/inter**: Self-hosted Inter font
- Google Fonts: Inter and JetBrains Mono (via CDN)

### Session Management (Listed but Not Implemented)
- **connect-pg-simple**: PostgreSQL session store
- **express-session**: Session middleware (not in dependencies)

### Other
- **cmdk**: Command menu component
- **date-fns**: Date utility library
- **nanoid**: Unique ID generation
- **@jridgewell/trace-mapping**: Source map support

**Note:** The application is designed as a frontend-heavy simulator. While Drizzle and PostgreSQL are configured, the current implementation uses in-memory storage. Database integration can be added later without significant architectural changes.