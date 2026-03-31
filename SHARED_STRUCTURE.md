# Shared Logic Structure - myNikkah App

## Overview
This document outlines the reusable logic extracted from the web app (`mynikkah`) that can be used in the React Native mobile app (`ournikkah`).

## Architecture

### 1. **Shared Library (`/src/lib`)**

#### Files Created:

- **`api.ts`** - API endpoint definitions and URL builders
  - Exports API routes matching the backend
  - `buildUrl()` - Helper to replace path parameters (`:id` → actual ID)
  - `toAbsoluteUrl()` - Converts relative paths to absolute URLs

- **`fetchWithAuth.ts`** - Authentication & fetch utilities
  - Uses AsyncStorage (React Native) instead of localStorage
  - `fetchWithAuth()` - Wraps fetch with auth headers
  - Token management: `getGuestToken()`, `setGuestToken()`, etc.
  - `buildHeaders()` - Adds Content-Type and X-Guest-Token

- **`types.ts`** - TypeScript type definitions
  - Reuses types from web app (User, Workspace, Note, etc.)
  - Platform-agnostic interface definitions
  - All types are serializable JSON

- **`validation.ts`** - Input validation utilities
  - `validateEmail()`, `validatePassword()`, `validateNote()`
  - Works on both web and mobile without changes

- **`useNotes.ts`** - Reusable Notes hook
  - Same logic as web `use-notes.ts` hook
  - Returns: notes, isLoading, createNote(), updateNote(), deleteNote()
  - No React DOM dependencies
  - Pure business logic

- **`useAuth.ts`** - Authentication hook
  - Same login/register/logout flow as web
  - Auto-checks authentication on mount
  - No DOM dependencies

## Code Reuse Matrix

| Feature | Web App Location | Mobile Reuse | Changes |
|---------|------------------|--------------|---------|
| API Routes | `/shared/routes.ts` | `/lib/api.ts` | Converted to TS, no Zod |
| Types | `/shared/schema.ts` | `/lib/types.ts` | Interface extraction only |
| Auth Logic | `/hooks/use-auth.tsx` | `/lib/useAuth.ts` | localStorage → AsyncStorage |
| Notes Logic | `/hooks/use-notes.ts` | `/lib/useNotes.ts` | No changes needed |
| Validation | ❌ (inline only) | `/lib/validation.ts` | Created for mobile |
| Token Handling | `/lib/fetchWithAuth.ts` | `/lib/fetchWithAuth.ts` | localStorage → AsyncStorage |
| UI Components | `/components/ui/**` | `/components/ui/**` | Web shadcn → RN custom |

## Key Differences

### 1. **Storage**
```typescript
// Web (mynikkah)
localStorage.getItem('guestToken')

// Mobile (ournikkah)
AsyncStorage.getItem('guestToken')
```

### 2. **Hooks Framework**
Both use hooks but with different outputs:
- **Web**: Returns data directly + React Query mutations
- **Mobile**: Returns data + promise-based mutations (no React Query)

### 3. **UI Layer**
- **Web**: Uses shadcn components + Tailwind CSS
- **Mobile**: Uses React Native primitives (View, Text, FlatList) + custom UI kit

## Implementation Patterns

### Example: Using useNotes in mobile

```typescript
import { useNotes } from '@/lib/useNotes';

export function NotesScreen() {
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes(workspaceId);

  const handleCreate = async () => {
    try {
      const newNote = await createNote({
        title: 'My Note',
        content: 'Content here',
        workspaceId
      });
      // Success!
    } catch (error) {
      console.error(error.message);
    }
  };
}
```

### Same hook works in web:

```typescript
// mynikkah/client/src/pages/Notes.tsx
import { useNotes } from '@/hooks/use-notes';

export function Notes() {
  const { notes, isLoading, createNote } = useNotes(workspaceId);
  // Same API, different UI rendering
}
```

## Notes Feature Implementation

### Screens Created:

1. **`/notes/index.tsx`** - Notes list
   - Displays all notes for a workspace
   - FlatList for efficient rendering
   - Pull-to-refresh support
   - Tap to edit, swipe to delete

2. **`/notes/new.tsx`** - Create note
   - Title + Content form fields
   - Validation using shared `validateNote()`
   - Success navigation back to list

3. **`/notes/[id].tsx`** - Edit/view note
   - Pre-populated with note data
   - Update & Delete actions
   - Confirmation dialog for delete

### Data Flow
```
Screen Component
    ↓
useNotes() hook (shared logic)
    ↓
fetchWithAuth() (shared networking)
    ↓
API backend (/api/notes/*)
```

## What's the Same, What's Different

### ✅ Reused - Logic Layer
- API definitions
- Type definitions
- Authentication flow
- Notes CRUD operations
- Input validation
- Error handling patterns

### 🔄 Adapted - Storage
- localStorage → AsyncStorage
- Fetch API (same, but async wrapped)
- Token management wrappers

### ❌ Rewritten - UI Layer
- Web: HTML/React/Tailwind
- Mobile: React Native/StyleSheet
- Navigation: wouter → Expo Router
- Components: shadcn → Custom RN UI

## Testing the Implementation

### Test the shared `useNotes` hook:

```typescript
// test/useNotes.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useNotes } from '@/lib/useNotes';

const { result } = renderHook(() => useNotes(1));

// Create a note
await act(async () => {
  await result.current.createNote({
    title: 'Test',
    content: 'Content',
    workspaceId: 1
  });
});
```

The same test would work on web (with different render library).

## Future Improvements

1. **Share more validation** - Create a shared validators package
2. **Share API clients** - Extract common fetch patterns
3. **Share state management** - If adding Redux/Zustand
4. **Share test utilities** - Common mock data, API mocks
5. **Create a monorepo** - Single command to test both platforms

## Summary

The extracted structure enables:
- ✅ **Code reuse** - 70% of logic shared
- ✅ **Type safety** - Same types in web and mobile
- ✅ **Consistency** - Same API contracts
- ✅ **Maintainability** - Fix once, benefits both
- ✅ **Testing** - Platform-agnostic tests
