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

# Event Creation Application Fix

This document provides instructions to fix the event creation functionality in the application.

## Issues Fixed

1. **Missing Database Tables**: The errors showed that required tables like `favorites` and proper RLS policies weren't set up.
2. **Row Level Security Issues**: Event creation was blocked by RLS policies.
3. **Type Error in EventDetails**: Fixed a type mismatch in the comment loading.

## Setup Instructions

### 1. Create Database Tables and Policies

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `create_all_tables.sql` and run it
   - This creates all required tables with correct constraints and relationships
   - Sets up Row Level Security (RLS) policies
   - Creates triggers for automatic profile creation and capacity checking

### 2. Make Your User an Organizer

1. Run the first query in `make_user_organizer.sql` to find your user ID
2. Copy your user ID from the results 
3. Paste it into the second query, replacing 'USER_ID'
4. Run the modified query to make yourself an organizer

### 3. Testing Event Creation

After completing steps 1 and 2, you should be able to:
1. Log in to your application
2. Create events through the form
3. See events stored in the Supabase database

## Database Schema

The setup includes the following tables:
- `profiles`: User profiles including organizer status
- `events`: Main event information
- `event_questions`: Custom questions for events
- `favorites`: User's favorite events
- `registrations`: Event registrations
- `event_comments`: User comments on events

## Troubleshooting

If you still encounter issues:
1. Check the browser console for specific error messages
2. Verify your user is marked as an organizer in the profiles table
3. Confirm that all tables were created successfully
4. Make sure your Supabase client is properly configured
