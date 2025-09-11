# Pet NFC App - Developer Documentation

This document provides a comprehensive overview of the Pet NFC App project, including its architecture, setup instructions, and guidelines for future development.

## 1. Project Overview

The Pet NFC App is a web application that allows pet owners to create profiles for their pets, which can be accessed by scanning an NFC tag. The application provides features such as pet profiles, posts, lost pet alerts, and contact information for owners.

## 2. Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (with App Router)
-   **Database and Backend**: [Supabase](https://supabase.io/)
    -   **Authentication**: Supabase Auth
    -   **Database**: Supabase Postgres
    -   **Storage**: Supabase Storage
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Validation**: [Zod](https://zod.dev/)

## 3. Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm, yarn, or pnpm
-   A Supabase account

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd pet-nfc-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add the following environment variables. You can get these from your Supabase project settings.

    ```env
    NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
    SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## 4. Project Structure

```
pet-nfc-app/
├── app/                # Next.js App Router pages and API routes
│   ├── api/            # API routes
│   ├── dashboard/      # Protected dashboard pages
│   └── ...
├── components/         # Reusable React components
├── lib/                # Shared libraries and helper functions
│   ├── auth.ts         # Authentication helpers
│   ├── supabase.ts     # Server-side Supabase client
│   └── ...
├── public/             # Static assets
├── server/             # Server-side actions
├── supabase/           # Supabase migrations
└── ...
```

## 5. Backend Architecture

The backend is built using a combination of Next.js API Routes and Supabase.

### API Routes

The API routes in `app/api` handle requests from the client. Currently, they contain direct database queries.

**Recommended Improvement**: Abstract all database logic into a dedicated data access layer (e.g., in `lib/data`). This will decouple the API routes from the database schema and improve code organization and reusability.

### Supabase Client

-   **`lib/supabase.ts`**: Contains functions to get the server-side Supabase client (`getServerSupabaseClient`) and the admin client (`getAdminSupabaseClient`).
-   **`lib/supabase-browser.ts`**: Contains a function to get the client-side Supabase client (`getBrowserSupabaseClient`).

## 6. Authentication and Authorization

Authentication is handled by Supabase Auth. Authorization is enforced using Supabase's Row Level Security (RLS) policies.

**Critical Security Note**: The API routes currently use the admin client (`service_role_key`), which bypasses all RLS policies. This is a major security vulnerability and should be remediated immediately by refactoring the API routes to use the user-level client.

The RLS policies are defined in `supabase/migrations/0002_rls.sql`.

## 7. Database

The database schema is managed through migration files located in the `supabase/migrations` directory. When making schema changes, create a new migration file and apply it to your local and production Supabase databases.

## 8. Testing Strategy

A comprehensive testing strategy is essential for ensuring the application is production-ready.

-   **Unit Tests**: Use `Jest` or `Vitest` to test individual functions and components.
-   **Integration Tests**: Test the interaction between different parts of the application, such as API routes and the data access layer.
-   **End-to-End (E2E) Tests**: Use `Cypress` or `Playwright` to simulate user flows and test the application from the user's perspective.

## 9. Codebase Improvements Summary

-   **Refactor API Routes**: Use the user-level Supabase client to enforce RLS policies.
-   **Create a Data Access Layer**: Abstract database queries into a separate layer.
-   **Implement Input Validation**: Use `Zod` to validate all API inputs.
-   **Enhance Error Handling and Logging**: Implement a centralized error handling and logging solution.
