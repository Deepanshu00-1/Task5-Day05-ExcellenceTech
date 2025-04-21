# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# EventHub - Event Management Application

![EventHub Logo](public/logo.png)

EventHub is a modern web application for event management, allowing users to create, browse, and register for events. The application features user authentication, event creation for organizers, and a comprehensive event browsing and registration system for users.

## 🌟 Features

- **User Authentication**: Secure login and registration system
- **Event Management**: 
  - Create and manage events (organizers)
  - Browse events with filtering options
  - View detailed event information
  - Register for events
  - Capacity tracking and management
- **User Profiles**: User profiles with organizer status
- **Interactive UI**: 
  - Favorites system
  - Comments on events
  - Registration tracking
  - Responsive design

## 🛠️ Tech Stack

- **Frontend**: React with TypeScript, Vite
- **Styling**: TailwindCSS, Radix UI components
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Testing**: Vitest for unit tests, Playwright for E2E tests
- **Other**: React Router, React Hook Form, Zod

## 📋 Prerequisites

- Node.js (v18+)
- npm or yarn
- Supabase account (free tier is sufficient)

## 🚀 Setup and Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-username/eventhub.git
cd eventhub
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Supabase Setup

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Create a `.env` file in the root directory with the following content:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Database Setup

1. Navigate to the SQL Editor in your Supabase dashboard
2. Execute the SQL scripts in the following order:
   - `create_all_tables.sql` - Creates all necessary tables and RLS policies
   - `setup_event_registration.sql` - Sets up event registration functionality
   - `fix_registration_count.sql` - Ensures registration counts work correctly

### 5. (Optional) Set up a test organizer account

1. Register an account in the application
2. In the Supabase SQL Editor, run:

```sql
-- Find your user ID
SELECT * FROM auth.users;

-- Make your account an organizer
UPDATE public.profiles 
SET is_organizer = true 
WHERE user_id = 'your-user-id';
```

## 🏃‍♂️ Running the Application

### Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
# or
yarn build
```

## 🧪 Testing

### Running Unit Tests

```bash
npm test
# or
yarn test
```

### Running Tests with UI

```bash
npm run test:ui
# or
yarn test:ui
```

### Running E2E Tests

```bash
npm run test:e2e
# or
yarn test:e2e
```

## 📂 Project Structure

```
eventhub/
├── e2e/                   # End-to-end tests
├── public/                # Public assets
├── src/
│   ├── assets/            # Application assets
│   │   ├── ui/            # UI components
│   │   └── ...            # Feature-specific components
│   ├── context/           # React context providers
│   ├── lib/               # Utility functions and constants
│   ├── pages/             # Page components
│   │   ├── AuthForm.tsx   # Login/Register page
│   │   ├── Events.tsx     # Events listing page
│   │   ├── EventDetails.tsx # Event details page
│   │   ├── Home.tsx       # Home page
│   │   └── MyRegistrations.tsx # User registrations page
│   ├── services/          # API services
│   ├── tests/             # Unit and integration tests
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Application entry point
├── .env                   # Environment variables
├── package.json           # Dependencies and scripts
└── README.md              # Documentation
```

## 🔒 Authentication and Authorization

The application uses Supabase Authentication for user management and implements two key user roles:

- **Regular Users**: Can browse events, register for events, favorite events, and add comments
- **Organizers**: Can do everything regular users can, plus create and manage events

## 🗄️ Database Schema

- **profiles**: User profiles with organizer status
- **events**: Main event information including capacity and registration count
- **registrations**: Records of user event registrations
- **favorites**: User's favorited events
- **event_comments**: User comments on events

## 🌐 Deployment

The application can be deployed to any static hosting service that supports single-page applications:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

Ensure you set the environment variables for your Supabase URL and anon key in your deployment platform.

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Deepanshu - Initial work

## 🙏 Acknowledgments

- Supabase for the backend infrastructure
- React and Vite for the frontend framework
- Radix UI for accessible UI components
- TailwindCSS for styling
