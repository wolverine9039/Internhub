# InternHub Frontend Architecture — Deep Dive

This document provides a comprehensive explanation of the InternHub frontend architecture, designed for scalability, maintainability, and a premium user experience.

## Core Architecture

The project is built as a **Single Page Application (SPA)** using **React 18**, **TypeScript**, and **Vite**. It follows a modular, layer-based architecture that separates concerns between UI, state, logic, and data.

### Key Technologies
- **Vite**: Ultra-fast build tool and dev server.
- **TypeScript**: Ensures type safety across the entire data flow.
- **Axios**: Promised-based HTTP client for API communication.
- **React Router 6**: Declarative routing for navigation.
- **Vanilla CSS**: Global design tokens and component-specific styles for maximum control.

---

## Directory Breakdown

### `src/components/`
Organized by domain and reusability:
- **`Shared/`**: Atomic UI components like `Badge`, `Sidebar`, and `StatCard`. These are agnostic to the business logic.
- **`Admin/`, `Trainer/`, `Intern/`**: Role-specific components exported via barrel files (`index.ts`) for clean imports.

### `src/context/`
Manages global application state.
- **`AuthContext.tsx`**: The primary state holder for user sessions. It handles login/logout logic, persists the JWT token to `localStorage`, and provides a `useAuth` hook for downstream components.

### `src/services/`
Handles all external communications.
- **`api.ts`**: Centralized Axios instance.
    - **Request Interceptors**: Automatically attaches the JWT `Bearer` token to every outgoing request.
    - **Response Interceptors**: Intercepts `401 Unauthorized` errors to trigger automatic logout and redirect to login.

### `src/routes/`
- **`AppRoutes.tsx`**: The central source of truth for navigation. It maps URL paths to page components, ensuring a clean and predictable routing structure.

### `src/types/`
- **`index.ts`**: Centralized TypeScript interfaces and enums. This ensures that every component and service uses the same data models (e.g., `User`, `Project`, `Task`, `Cohort`), preventing data-shape mismatches.

### `src/constants/`
- **`index.ts`**: Holds non-changing configuration values like `API_BASE_URL`, route strings, and role labels. This avoids "magic strings" throughout the codebase.

### `src/styles/`
- **`variables.css`**: Defines the project's design tokens (colors, spacing, shadows, typography) as CSS variables. This ensures a consistent, premium look across all components.

---

## Data & Authentication Flow

1.  **Login**: User submits credentials -> `AuthContext` calls API -> Stores Token/User -> Redirects via `AppRoutes`.
2.  **API Request**: Component calls a service -> `api.ts` attaches Token -> Server validates.
3.  **State Sync**: `AuthContext` listens for `storage` events to sync login state across multiple browser tabs.

---

## Scalability & Best Practices

- **Path Aliases**: Uses `@/` to reference the `src/` directory, avoiding messy relative paths (e.g., `../../../components`).
- **Barrel Exports**: Folders contain `index.ts` files to simplify imports.
- **PascalCase**: All React components and filenames follow strict PascalCase naming.
- **Separation of Concerns**: Components focus on UI; logic is pushed to hooks or services.

---

## Current File Structure

```text
src/
├── components/         # Reusable and role-based components
├── constants/          # App-wide constants and config
├── context/            # Global state (Auth)
├── hooks/              # Custom React hooks
├── pages/              # Top-level route components
├── routes/             # Navigation definitions
├── services/           # API and external integrations
├── styles/             # Global CSS and design tokens
├── types/              # Type definitions and interfaces
└── utils/              # Helper functions
```

---

## Verification
- [x] TypeScript Compilation
- [x] Route Resolution
- [x] API Interceptor Logic
