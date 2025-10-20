# CampusThrive - Student Wellness Tracker

A comprehensive, privacy-focused student wellness tracking web application built with Next.js, TypeScript, and Tailwind CSS. CampusThrive prioritizes student privacy by storing all data locally in the browser's localStorage, ensuring no personal information is sent to external servers.

## 🌟 Key Features

### 🔒 **Privacy-First Design**
- **100% Local Storage**: All data stays on your device - no external servers, no data collection
- **No Analytics**: Zero tracking, analytics, or data collection
- **Client-Side Processing**: All calculations and data processing happen in your browser
- **Complete Data Control**: Export/import your data anytime for backup or migration

### 📊 **Comprehensive Wellness Tracking**
- **4-Dimensional Mood Tracking**: Valence, Energy, Focus, and Stress (0-5 scale)
- **Smart Time Buckets**: Morning, Midday, Evening, and Night tracking
- **Activity Tagging**: Track study sessions, social activities, exercise, sleep, and more
- **Day-End Analytics**: Deep work minutes, tasks completed, sleep hours, recovery actions
- **Social Touchpoints**: Monitor social interactions and connections

### 🧠 **Intelligent Scoring System**
- **Mood Composite (MC)**: Weighted score based on all mood dimensions with z-score normalization
- **Daily Success Score (DSS)**: Multi-dimensional success tracking including:
  - Learning Momentum (LM): Deep work + task completion
  - Recovery Index (RI): Sleep quality + recovery actions
  - Connection (CN): Social touchpoints and positive interactions
- **14-Day Baseline**: Personal baseline comparison for meaningful insights
- **Streak Tracking**: Consecutive days of wellness tracking

### 🤖 **AI-Powered Coaching System**
- **Personalized Tips**: 2-3 contextual tips based on current mood state and patterns
- **Smart Tip Selection**: 50+ tips across 10 categories (stress management, focus, sleep, etc.)
- **Pattern Recognition**: Tips adapt to your recent tags and historical patterns
- **Time-Aware Suggestions**: Different tips for morning, midday, evening, and night
- **Onboarding Support**: Encourages first-time users to start tracking

### 📈 **Advanced Analytics & Visualization**
- **Trends Dashboard**: MC and DSS trends over 14 days with interactive charts
- **Success Compass**: Radar chart showing LM/RI/CN balance
- **Drivers Analysis**: Identify which activities help or hurt your performance
- **Power Hours Heatmap**: Discover your most productive times of day/week
- **Pattern Recognition**: Tag frequency analysis and best/worst day comparisons

### 🎨 **Modern User Experience**
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Themes**: Seamless theme switching with system preference detection
- **Smooth Animations**: 300ms transitions for sidebar, tips, and interactions
- **Accessibility**: Keyboard navigation, ARIA labels, and screen reader support
- **Mobile-First**: Bottom navigation on mobile, sidebar on desktop

### 📱 **Progressive Web App (PWA)**
- **Installable**: Add to home screen on mobile and desktop
- **Offline Capable**: Works without internet connection
- **App-like Experience**: Native feel with custom icons and splash screens
- **Fast Loading**: Optimized performance with Next.js

## 🛠️ Technical Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript with strict mode and comprehensive type safety
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Icons**: Lucide React (comprehensive icon library)
- **Charts**: Recharts for beautiful data visualizations
- **Date Handling**: date-fns for robust date manipulation
- **Theme Management**: next-themes for seamless dark/light mode
- **State Management**: React hooks with localStorage persistence
- **Data Validation**: Comprehensive TypeScript types and runtime validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd CampusThrive
```

2. **Install dependencies:**
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

3. **Run the development server:**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
│   ├── page.tsx           # Main dashboard
│   ├── trends/            # Analytics and trends page
│   ├── patterns/          # Pattern analysis page
│   ├── data/              # Data control and export page
│   └── layout.tsx         # Root layout with theme provider
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components (MoodSlider, etc.)
│   ├── DailyCheckin.tsx   # Main check-in interface
│   ├── ScoresDisplay.tsx  # MC/DSS score display
│   ├── CoachTips.tsx      # AI coaching system
│   ├── TrendsChart.tsx    # Data visualization
│   ├── DriversTable.tsx   # Pattern analysis
│   ├── PowerHours.tsx     # Productivity heatmap
│   ├── DataControl.tsx    # Export/import controls
│   └── Layout.tsx         # Main layout with navigation
├── lib/                    # Core business logic
│   ├── scoring.ts         # MC/DSS calculation algorithms
│   ├── coach.ts           # AI coaching engine
│   ├── storage.ts         # localStorage management
│   └── export.ts          # Data export/import utilities
├── types/                  # TypeScript type definitions
│   └── index.ts           # Comprehensive type system
└── hooks/                  # Custom React hooks
    └── useLocalStorage.ts # localStorage with validation
```

## 🎯 Core Features Deep Dive

### 📊 **Mood Tracking System**
- **4 Sliders**: Valence (happiness), Energy, Focus, and Stress
- **Real-time Scoring**: Live MC and DSS calculation as you adjust sliders
- **Time Context**: Track different times of day for pattern analysis
- **Tag System**: 20+ common student activity tags with smart suggestions
- **Optional Analytics**: Deep work time, tasks completed, sleep hours

### 🧮 **Advanced Scoring Algorithms**
- **Z-Score Normalization**: Personal baseline comparison over 14 days
- **Weighted Formulas**: 
  - MC = 0.4×zV + 0.3×zE + 0.2×zF - 0.2×zS
  - DSS = 0.5×zLM + 0.3×zRI + 0.2×zCN
- **Sigma Floor**: Prevents division by zero with minimum variance
- **Streak Calculation**: Consecutive days with entries

### 🤖 **Intelligent Coaching Engine**
- **50+ Contextual Tips**: Across 10 categories (stress, focus, sleep, etc.)
- **Smart Matching**: Based on current mood, recent tags, and time of day
- **Priority System**: HIGH/MEDIUM/LOW priority with relevance scoring
- **User Preferences**: Favorites, completion tracking, and personalization
- **Onboarding Flow**: Encourages new users to start tracking

### 📈 **Data Visualization Suite**
- **Trends Chart**: Dual-axis line chart for MC and DSS over time
- **Success Compass**: Radar chart for LM/RI/CN balance visualization
- **Drivers Table**: Sortable analysis of which activities help/hurt performance
- **Power Hours**: 7×24 heatmap showing productivity patterns
- **Pattern Insights**: Tag frequency and best/worst day analysis

### 🔧 **Data Management**
- **Export Options**: CSV and JSON formats with complete data structure
- **Import System**: JSON data restoration with validation
- **Storage Monitoring**: Track data size and entry count
- **Data Cleanup**: Automatic removal of entries older than 14 days
- **Backup/Restore**: Complete data control and migration

## 🎨 Design System

### **Color Palette**
- **Primary**: Blue gradient (#3B82F6 → #8B5CF6 → #06B6D4)
- **Semantic Colors**: Green (success), Red (stress), Orange (energy)
- **Neutral Scale**: 50-950 with proper contrast ratios
- **Theme Variables**: CSS custom properties for seamless theme switching

### **Typography**
- **Font**: Inter (Google Fonts) for excellent readability
- **Scale**: Consistent type scale from text-xs to text-6xl
- **Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### **Components**
- **Cards**: Consistent padding, borders, and shadows
- **Buttons**: Primary, secondary, outline, and ghost variants
- **Forms**: Accessible inputs with proper labels and validation
- **Navigation**: Responsive sidebar (desktop) and bottom nav (mobile)

## 🔒 Privacy & Security

CampusThrive is built with privacy as the core principle:

- **Local Storage Only**: All data stored in browser's localStorage
- **No External Servers**: Zero data transmission to external services
- **No Analytics**: No tracking, cookies, or data collection
- **Client-Side Processing**: All calculations happen in your browser
- **Data Ownership**: Complete control over your personal information
- **Export Capability**: Take your data with you anytime

## 📱 Mobile Optimization

- **Touch-Friendly**: Large touch targets and smooth gestures
- **Responsive Layout**: Adapts to all screen sizes
- **Bottom Navigation**: Easy thumb navigation on mobile
- **Swipe Gestures**: Natural mobile interactions
- **Fast Loading**: Optimized for mobile networks
- **PWA Support**: Install as native app on mobile devices

## 🚀 Deployment

Deploy to any static hosting service:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **GitHub Pages**
- **Any static hosting provider**

No backend services required - everything runs client-side!

## 🧪 Demo Mode

Perfect for presentations and testing:
- **Generate Sample Data**: 14 days of realistic mood entries
- **Clear All Data**: Reset to empty state
- **Realistic Patterns**: Demonstrates all features with sample data

## 🤝 Contributing

We welcome contributions! Areas for improvement:
- Additional chart types and visualizations
- More coaching tip categories
- Enhanced pattern recognition algorithms
- Accessibility improvements
- Performance optimizations

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Documentation**: Comprehensive inline documentation and comments
- **Type Safety**: Full TypeScript coverage for better development experience

---

**Remember**: Your data stays on your device. CampusThrive respects your privacy and gives you complete control over your personal information. Start your wellness journey today! 🌟