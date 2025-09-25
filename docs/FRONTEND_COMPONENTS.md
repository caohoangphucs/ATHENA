# ATHENA Frontend Components Documentation

## Overview

The ATHENA frontend is built with Next.js 14 using the App Router, TailwindCSS for styling, and Framer Motion for animations. It provides an intuitive interface for companies to manage their reward programs and visualize the network ecosystem.

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Animations**: Framer Motion, React Spring
- **Gestures**: React Use Gesture
- **API Client**: Custom fetch-based client

## Project Structure

```
frontend/
├── app/                    # App Router pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Company dashboard
│   │   └── page.tsx       # Dashboard main page
│   └── network/           # Network visualization
│       └── page.tsx       # Network overview page
├── components/            # Reusable components
│   └── ui/
│       └── Card.tsx       # Card component
├── lib/                   # Utilities and API client
│   └── api.ts            # API client functions
├── package.json          # Dependencies
├── tailwind.config.js    # TailwindCSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Pages

### Landing Page (`/`)

**File**: `app/page.tsx`

**Purpose**: Company onboarding and API key management

**Features**:
- Company signup form
- API key input
- Auto-redirect to dashboard with API key

**Key Components**:
- Company signup form with validation
- API key input field
- Navigation to dashboard

**State Management**:
- `apiKey`: Current API key
- `loading`: Loading state
- `error`: Error messages

### Dashboard (`/dashboard`)

**File**: `app/dashboard/page.tsx`

**Purpose**: Company management and reward configuration

**Features**:
- 4-step onboarding process
- Company profile management
- Services configuration
- Master wallet display
- Contract creation and management

**Onboarding Steps**:
1. **Company Creation/API Key**: Signup or input existing API key
2. **Services Configuration**: Define supported actions and categories
3. **Master Wallet**: View wallet address and balance
4. **Contract Creation**: Create reward contracts

**Key Components**:
- Animated stepper with progress indicators
- Company signup form
- Services configuration form
- Master wallet display
- Contract creation form
- Contract list with management options

**State Management**:
- `apiKey`: Company API key
- `profile`: Company profile data
- `wallet`: Master wallet information
- `contracts`: List of smart contracts
- `loading`: Loading states
- `error`: Error handling

**API Integration**:
- `companySignup()`: Create new company
- `getCompanyProfile()`: Fetch company details
- `updateCompanyProfile()`: Update company services
- `api()`: Generic API calls for wallet and contracts

### Network Visualization (`/network`)

**File**: `app/network/page.tsx`

**Purpose**: Real-time network visualization and analytics

**Features**:
- Interactive network graph
- Real-time transaction animations
- Company and user node management
- Transaction history
- Analytics dashboard

**Key Components**:
- SVG-based network canvas
- Animated node rendering
- Transfer animation system
- Hover tooltips with actions
- Control panel with buttons
- Analytics cards

**State Management**:
- `companies`: List of companies
- `wallets`: All wallet data
- `transfers`: Transaction history
- `visibleTransfers`: Currently animating transfers
- `shownTxs`: Processed transaction tracking
- `loading`: Loading states
- `error`: Error handling

**Interactive Features**:
- **Pan and Zoom**: Drag to pan, scroll to zoom
- **Node Hover**: Show company/user details and actions
- **Transfer Animation**: Animated SOV token transfers
- **Real-time Updates**: Auto-refresh data
- **Fullscreen Mode**: Toggle fullscreen view

**Animation System**:
- **Framer Motion**: Page transitions and UI animations
- **React Spring**: Smooth zoom/pan with physics
- **React Use Gesture**: Drag and wheel interactions
- **Custom Transitions**: Fade-in effects and smooth state changes

## Components

### Card Component

**File**: `components/ui/Card.tsx`

**Purpose**: Reusable card container

**Props**:
- `children`: Card content
- `className`: Additional CSS classes

**Usage**:
```tsx
<Card>
  <CardHeader title="Card Title" />
  <CardBody>
    Card content here
  </CardBody>
</Card>
```

**Features**:
- Consistent styling
- Dark mode support
- Responsive design
- Hover effects

## API Client

### File: `lib/api.ts`

**Purpose**: Centralized API communication

**Key Functions**:
- `api<T>()`: Generic API call function
- `companySignup()`: Company registration
- `getCompanyProfile()`: Fetch company details
- `updateCompanyProfile()`: Update company profile
- `demoPurchase()`: Simulate purchase
- `demoUserPurchase()`: Simulate user purchase

**Features**:
- Type-safe API calls
- Automatic error handling
- API key management
- Request/response typing

**Configuration**:
- Base URL: `NEXT_PUBLIC_API_BASE` or `http://localhost:3000`
- Headers: Automatic `Content-Type` and `X-API-Key`
- Error handling: Throws descriptive errors

## Styling

### TailwindCSS Configuration

**File**: `tailwind.config.js`

**Features**:
- Custom color palette
- Dark mode support
- Responsive breakpoints
- Custom animations

**Custom Classes**:
- `animate-fade-in`: Fade-in animation
- Dark mode variants for all components
- Responsive grid layouts

### Global Styles

**File**: `app/globals.css`

**Features**:
- TailwindCSS imports
- Custom CSS variables
- Dark mode support
- Smooth transitions

## State Management

### Local State
- React `useState` for component state
- `useEffect` for side effects
- `useMemo` for computed values
- `useRef` for DOM references

### Data Flow
1. **API Calls**: Centralized in `lib/api.ts`
2. **State Updates**: Local component state
3. **Error Handling**: Component-level error states
4. **Loading States**: Per-operation loading indicators

## Animation System

### Framer Motion
- Page transitions
- Component animations
- Layout animations
- Gesture handling

### React Spring
- Physics-based animations
- Smooth zoom/pan
- Natural motion
- Performance optimized

### Custom Animations
- Fade-in effects
- Smooth state transitions
- Loading indicators
- Hover effects

## Responsive Design

### Breakpoints
- Mobile: Default (< 768px)
- Tablet: `md:` (768px+)
- Desktop: `lg:` (1024px+)
- Large: `xl:` (1280px+)

### Layout Patterns
- Grid layouts for cards
- Flexbox for navigation
- Responsive text sizing
- Mobile-first approach

## Performance Optimizations

### Code Splitting
- Automatic with Next.js App Router
- Dynamic imports for heavy components
- Lazy loading for images

### Animation Performance
- Hardware acceleration
- Optimized re-renders
- Efficient gesture handling
- Smooth 60fps animations

### API Optimization
- Request caching
- Error boundaries
- Loading states
- Optimistic updates

## Accessibility

### Features
- Semantic HTML
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast

### Implementation
- Proper ARIA labels
- Focus indicators
- Keyboard shortcuts
- High contrast mode

## Browser Support

### Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Features
- Modern JavaScript (ES2020+)
- CSS Grid and Flexbox
- Web Animations API
- Intersection Observer

## Development

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Other Platforms
- Netlify
- AWS Amplify
- Docker
- Static hosting

### Environment Variables
- `NEXT_PUBLIC_API_BASE`: Backend API URL

## Testing

### Testing Strategy
- Component testing with React Testing Library
- Integration testing
- E2E testing with Playwright
- Visual regression testing

### Test Files
- `__tests__/` directory
- `.test.tsx` files
- Mock API responses
- Snapshot testing

## Future Enhancements

### Planned Features
- Real-time WebSocket updates
- Advanced analytics dashboard
- Mobile app
- PWA support
- Offline functionality

### Technical Improvements
- Server-side rendering
- Static site generation
- Edge functions
- Performance monitoring
- Error tracking

## Troubleshooting

### Common Issues
1. **API Connection**: Check `NEXT_PUBLIC_API_BASE`
2. **CORS Errors**: Verify backend CORS settings
3. **Animation Performance**: Reduce animation complexity
4. **Build Errors**: Check TypeScript types

### Debug Tools
- React Developer Tools
- Next.js DevTools
- Browser DevTools
- Network tab for API calls

## Contributing

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component documentation

### Pull Request Process
1. Create feature branch
2. Write tests
3. Update documentation
4. Submit PR with description
5. Code review
6. Merge to main
