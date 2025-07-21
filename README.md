# 📊 Portfolio Dashboard

A modern, real-time portfolio management dashboard built with Next.js, TypeScript, and Tailwind CSS. Features live stock price updates, comprehensive analytics, and a responsive design.

![Portfolio Dashboard](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8)
![Zustand](https://img.shields.io/badge/Zustand-4.4-orange)

## 🚀 Features

### 📈 Real-Time Portfolio Tracking
- **Live Stock Prices**: Real-time updates every 15 seconds
- **Automatic Calculations**: Present value, gain/loss, and portfolio percentage
- **Visual Indicators**: Color-coded gains (green) and losses (red)
- **WebSocket Support**: Optional real-time data streaming

### 📊 Comprehensive Analytics
- **Portfolio Summary**: Total investment, current value, and overall performance
- **Sector Analysis**: Group stocks by sector with performance metrics
- **Interactive Charts**: Pie charts for distribution, bar charts for performance
- **Top/Worst Performers**: Identify best and worst performing stocks

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle between themes with system preference detection
- **Interactive Tables**: Sortable, filterable with column visibility controls
- **Smooth Animations**: Fade-in effects and loading states

### ⚡ Performance Optimized
- **Caching System**: Intelligent data caching with TTL (Time To Live)
- **Memoization**: React.memo and useMemo for optimal rendering
- **Debounced API Calls**: Prevents excessive API requests
- **Error Boundaries**: Graceful error handling and recovery

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + ShadCN UI Components
- **State Management**: Zustand with persistence
- **Data Visualization**: Recharts
- **Table Management**: TanStack Table (React Table v8)
- **Icons**: Lucide React
- **Theme**: Next Themes

### Backend
- **Runtime**: Node.js
- **API Routes**: Next.js API Routes
- **Data Sources**: Alpha Vantage API (Yahoo Finance alternative)
- **WebSocket**: Real-time data streaming (optional)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **CSS Processing**: PostCSS + Autoprefixer

## 📦 Installation

### Prerequisites
- Node.js 18.17 or later
- npm, yarn, or pnpm
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/portfolio-dashboard.git
   cd portfolio-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration:
   ```env
   # Alpha Vantage API Configuration
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key_here
   USE_REAL_API=false

   # App Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🔑 Getting API Keys

### Alpha Vantage (Recommended)

1. Visit [Alpha Vantage](https://www.alphavantage.co/)
2. Enter your email address
3. Get instant free API key (5 calls/minute, 500 calls/day)
4. Add to `.env.local` and set `USE_REAL_API=true`

## 📁 Project Structure

```
portfolio-dashboard/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── globals.css         # Global styles and CSS variables
│   │   ├── layout.tsx          # Root layout with providers
│   │   └── page.tsx            # Main dashboard page
│   ├── components/
│   │   ├── ui/                 # ShadCN UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── switch.tsx
│   │   │   └── dropdown-menu.tsx
│   │   ├── dashboard-header.tsx    # Header with controls
│   │   ├── portfolio-summary.tsx   # Portfolio overview cards
│   │   ├── portfolio-table.tsx     # Main portfolio table
│   │   ├── sector-overview.tsx     # Sector analysis
│   │   ├── theme-provider.tsx      # Theme context provider
│   │   ├── theme-toggle.tsx        # Dark/light mode toggle
│   │   └── error-boundary.tsx      # Error handling component
│   ├── store/
│   │   └── portfolioStore.ts   # Zustand state management
│   ├── types/
│   │   └── portfolio.ts        # TypeScript type definitions
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   ├── utils/
│   │   └── mockData.ts        # Sample portfolio data
│   ├── hooks/
│   │   └── usePortfolioPerformance.ts  # Custom performance hooks
│   └── pages/api/             # API routes
|       ├──google-finance/     # Google-API
|       |  └──[symbol].ts    
│       ├── portfolio.ts       # Main portfolio API
│       └── market/
│           └── [symbol].ts    # Individual stock data
├── server/                    # Optional WebSocket server
│   └── websocket-server.js
├── public/                    # Static assets
├── tailwind.config.ts         # Tailwind configuration
├── next.config.js            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🎯 Core Functionality

### Portfolio Table
Display holdings with comprehensive data:

- **Stock Information**: Name, symbol, sector
- **Investment Data**: Purchase price, quantity, total investment
- **Current Status**: Current market price (CMP), present value
- **Performance**: Gain/loss amount and percentage
- **Market Data**: P/E ratio, latest earnings, market cap
- **Portfolio Weight**: Percentage of total portfolio

### Dynamic Updates

- **Auto-refresh**: Configurable intervals (default: 15 seconds)
- **Real-time Prices**: Live market data integration
- **WebSocket Support**: Optional real-time streaming
- **Cache Management**: Intelligent data caching for performance

### Sector Analysis

- **Grouping**: Automatic sector-based stock grouping
- **Performance Metrics**: Sector-wise investment and returns
- **Visual Charts**: Pie chart for distribution, bar chart for performance
- **Interactive Filtering**: Click sectors to filter portfolio table

### Data Management

- **Multiple Data Sources**: Support for various financial APIs
- **Fallback System**: Graceful degradation to mock data
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Offline Support**: Cached data availability

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API key for real data | - | No |
| `USE_REAL_API` | Enable real API calls | `false` | No |
| `USE_GOOGLE_FINANCE` | Enable real API calls | `true` | No |
| `NEXT_PUBLIC_API_URL` | API base URL | `http://localhost:3000/api` | No |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3000` | No |

### Customization

#### Adding New Stocks

1. Update `src/utils/mockData.ts`
2. Add stock data with proper structure
3. Ensure sector categorization

#### Modifying Refresh Intervals
```typescript
// In component or store
setRefreshInterval(30000) // 30 seconds
```

#### Theme Customization
Edit CSS variables in `src/app/globals.css`:
```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... more variables */
}
```

## 📊 API Integration

### Supported Data Sources

1. **Alpha Vantage (Primary)**
   - Endpoint: Global Quote API
   - Features: Real-time prices, basic company data
   - Rate Limits: 5 calls/minute (free tier)
   - Coverage: Global markets including Indian stocks (.BSE/.NS)

2. **Google Finance**
   - Features: P/E ratios, earnings data
   - Method: Web scraping

3. **Yahoo Finance**
   - Features: Comprehensive stock data
   - Method: Public API endpoints

4. **Mock Data (Fallback)**
   - Purpose: Development and demonstration
   - Features: Realistic price simulation
   - Performance: No API rate limits
   - Data: Based on real Indian market stocks

### API Response Format
```typescript
interface ApiResponse {
  success: boolean
  data: {
    stocks: Stock[]
    sectors: SectorSummary[]
    summary: PortfolioSummary
  }
  metadata: {
    timestamp: string
    processingTime: string
    dataSource: 'real-api' | 'simulated'
    updatesCount: number
  }
}
```

## 🚀 Performance Features

### Caching Strategy

- **In-Memory Cache**: TTL-based caching system
- **Cache Keys**: API endpoint-based cache keys
- **Auto-Invalidation**: Time-based cache expiration
- **Manual Control**: Clear cache functionality

### Optimization Techniques

- **React.memo**: Memoized components for expensive renders
- **useMemo**: Memoized calculations and derived data
- **useCallback**: Stable function references
- **Debouncing**: Prevents excessive API calls
- **Code Splitting**: Automatic Next.js optimizations

### WebSocket Integration
Optional real-time data streaming:

1. **Start WebSocket Server**
   ```bash
   node server/websocket-server.js
   ```

2. **Enable in Application**
   ```typescript
   // In your component
   const { connectWebSocket } = usePortfolioStore()
   connectWebSocket()
   ```

## 🎨 UI Components

### Design System

- **Color Palette**: CSS custom properties for theming
- **Typography**: Inter font family
- **Spacing**: Tailwind spacing scale
- **Animations**: Custom CSS animations and transitions

### Component Library

- **ShadCN UI**: High-quality, accessible components
- **Custom Components**: Portfolio-specific components
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Complete theme switching support

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Features

- **Adaptive Layout**: Grid and flexbox layouts
- **Touch-Friendly**: Optimized for touch interactions
- **Performance**: Optimized for mobile networks
- **Accessibility**: WCAG 2.1 compliance

## 🧪 Testing

### Available Scripts
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Type Checking
npx tsc --noEmit     # Check TypeScript types
```

### Manual Testing

- **Portfolio Loading**: Verify data loads correctly
- **Real-time Updates**: Check automatic refresh functionality
- **Responsive Design**: Test on different screen sizes
- **Error Handling**: Test API failures and error states
- **Theme Switching**: Verify dark/light mode transitions

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git push origin main
   ```

2. **Deploy on Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy automatically

**Environment Variables on Vercel:**
```
ALPHA_VANTAGE_API_KEY=your_actual_api_key
USE_REAL_API=true
```

### Alternative Deployments

#### Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

#### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Technical Challenges & Solutions

### Challenge 1: API Rate Limiting
**Problem**: Alpha Vantage free tier allows only 5 calls/minute  
**Solution**:
- Implemented intelligent caching with TTL
- Added rate limiting with 12-second intervals
- Fallback to mock data when rate limited

### Challenge 2: Real-time Updates
**Problem**: Need frequent updates without overwhelming APIs  
**Solution**:
- WebSocket integration for real-time streaming
- Debounced refresh mechanisms
- Configurable update intervals

### Challenge 3: Performance Optimization
**Problem**: Frequent re-renders with real-time data  
**Solution**:
- React.memo for component memoization
- useMemo for expensive calculations
- Optimized state management with Zustand

### Challenge 4: Error Handling
**Problem**: Graceful handling of API failures  
**Solution**:
- Comprehensive error boundaries
- Fallback data systems
- User-friendly error messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Documentation

### Getting Help

- **Issues**: Report bugs on [GitHub Issues](https://github.com/your-username/portfolio-dashboard/issues)
- **Features**: Request features via [GitHub Issues](https://github.com/your-username/portfolio-dashboard/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/your-username/portfolio-dashboard/discussions) for questions

### Additional Resources

- **Next.js Documentation**: [nextjs.org/docs](https://nextjs.org/docs)
- **Tailwind CSS**: [tailwindcss.com/docs](https://tailwindcss.com/docs)
- **ShadCN UI**: [ui.shadcn.com](https://ui.shadcn.com)
- **Alpha Vantage API**: [alphavantage.co/documentation](https://www.alphavantage.co/documentation/)

## 🏆 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Vercel**: For seamless deployment platform
- **ShadCN**: For beautiful, accessible UI components
- **Tailwind CSS**: For utility-first CSS framework
- **Alpha Vantage**: For reliable financial data API

---

**Last updated**: July 2025