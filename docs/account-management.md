# Implementation Plan: Authenticated User Module

## Overview
The Shynese Character Flashcard app must be a multi-user platform using Supabase Auth. This ensures users only see and manage their own flashcards.

### 1. Database & Security (Supabase)
Goal: Secure the characters table and link it to the Auth system.
Schema Update: Use the user_id column to the characters table of type uuid, referencing auth.users(id).
Enable RLS: Turn on Row Level Security (RLS) for the characters table.

`Policies: Create the following RLS policies:`

* Select: auth.uid() = user_id (Users can only see their own cards).
* Insert: auth.uid() = user_id (Users can only save cards to their own ID).
* Update/Delete: auth.uid() = user_id.

### 2. Frontend: Authentication UI
Goal: Create a modern, "clean aesthetic" entry point for users.

`A. Login / Sign-up Page`

Components: A single toggleable form for Login and Sign-up.
Fields: Name (for profile), Email (as username), and Password.
Validation: Basic client-side validation (email format, minimum 6 characters for password).
Success States: Redirect to the main dashboard upon successful session creation.

`B. Global Navigation (Top Bar)`

Logged Out: Display "Log In" / "Get Started" buttons.
Logged In: Display a "User Account" button (or an Avatar icon) and a "Logout" button.

### 3. Frontend: User Account Management
Goal: Allow users to maintain their data and privacy.

* View Profile: Display the user's email and name.
* Password Management: A "Change Password" flow using supabase.auth.updateUser().
* Account Deletion: A "Danger Zone" button to remove the account.

Note: Ensure cascading deletes are handled so their flashcards are removed if the account is deleted.

### 4. Logical Implementation Guidelines
Goal: Ensure the agent writes clean, functional code.

Auth State Listener: Implement a global listener (e.g., onAuthStateChange) to manage the user session and protect private routes.

Automatic ID Assignment: When creating a new flashcard, the application must programmatically inject the current session's user.id into the payload before sending it to Supabase.

JavaScript

```javascript
const { data: { user } } = await supabase.auth.getUser();
// Use user.id for the 'user_id' field in the insert query
Error Handling: Provide user-friendly "Toast" notifications for failed logins, weak passwords, or network errors.
```

### 5. Best Practices
Persistence: Use the Supabase client’s built-in session persistence (LocalStorage/Cookies).

Loading States: Show a spinner or skeleton screen while the Auth state is being determined to avoid "flicker."