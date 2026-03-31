# Quick Reference: Shared Code

## 📦 Shared Modules Summary

### Module: `api.ts`
**Purpose**: API endpoint definitions and helpers
**Depends On**: None (pure TypeScript)
**Exports**:
```typescript
api                    // Object with all API routes
buildUrl()            // Replaces :param in paths
toAbsoluteUrl()       // Adds API_BASE_URL prefix
API_BASE_URL          // Config variable
```

**Used By**:
- `useNotes()` hook
- `useAuth()` hook
- Any API call

---

### Module: `types.ts`
**Purpose**: TypeScript type definitions
**Depends On**: None
**Exports**:
```typescript
interface User
interface Workspace
interface Note
interface VendorItem
interface BudgetItem
interface CreateNoteRequest
interface UpdateNoteRequest
```

**Used By**:
- Screens for type safety
- Hooks for function signatures
- API responses

---

### Module: `fetchWithAuth.ts`
**Purpose**: HTTP requests with authentication
**Depends On**: `@react-native-async-storage/async-storage`
**Exports**:
```typescript
fetchWithAuth()       // Main fetch wrapper
getGuestToken()       // Retrieve guest token
setGuestToken()       // Store guest token
clearGuestToken()     // Clear guest token
getAuthToken()        // Retrieve auth token
setAuthToken()        // Store auth token
buildHeaders()        // Build request headers
```

**Used By**:
- `useNotes()` hook
- `useAuth()` hook
- Any API call

---

### Module: `validation.ts`
**Purpose**: Input validation utilities
**Depends On**: None
**Exports**:
```typescript
validateEmail()       // Email validation
validatePassword()    // Password validation
validateNote()        // Note validation (title + content)
```

**Used By**:
- Note creation/edit screens
- Auth screens
- Form validation logic

---

### Hook: `useNotes.ts`
**Purpose**: Notes CRUD operations
**Depends On**: `api.ts`, `types.ts`, `fetchWithAuth.ts`
**Returns**:
```typescript
{
  notes: Note[] | undefined
  isLoading: boolean
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  error: Error | null
  createNote: (data: CreateNoteRequest) => Promise<Note>
  updateNote: (id: number, data: UpdateNoteRequest) => Promise<Note>
  deleteNote: (id: number) => Promise<void>
  refresh: () => Promise<void>
}
```

**Used By**:
- `/app/notes/index.tsx` - List screen
- `/app/notes/new.tsx` - Create screen
- `/app/notes/[id].tsx` - Edit screen

---

### Hook: `useAuth.ts`
**Purpose**: Authentication logic
**Depends On**: `api.ts`, `types.ts`, `fetchWithAuth.ts`
**Returns**:
```typescript
{
  user: User | null
  isLoading: boolean
  error: Error | null
  login: (email: string, password: string) => Promise<User>
  register: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}
```

**Used By**:
- Auth screens (not yet implemented in mobile)
- Protected screens for auth checks

---

## 🎯 Import Patterns

### Importing from shared library
```typescript
// ✅ DO THIS
import { useNotes, api, validateNote } from '@/lib';
import type { Note, CreateNoteRequest } from '@/lib/types';

// ✅ OR THIS (direct imports)
import { useNotes } from '@/lib/useNotes';
import { api } from '@/lib/api';
import type { Note } from '@/lib/types';

// ❌ DON'T DO THIS
import { useNotes } from '@/lib/useNotes.ts'; // No .ts
import { useNotes } from '../lib/useNotes';   // Use absolute paths
```

---

## 📋 Feature Requirements Checklist

### To implement a new feature:

- [ ] **Create types** in `/lib/types.ts`
- [ ] **Add API routes** to `/lib/api.ts`
- [ ] **Create hook** in `/lib/useFeature.ts`
- [ ] **Create screens** in `/app/feature/`
- [ ] **Use shared logic** in screens
- [ ] **Add validation** if needed in `/lib/validation.ts`

### Example: Adding Budget Feature

1. **Types**
```typescript
// /lib/types.ts
export interface BudgetItem {
  id: number;
  workspaceId: number;
  category: string;
  amount: number;
  notes?: string;
  createdAt: string;
}
```

2. **API Routes**
```typescript
// /lib/api.ts
budget: {
  list: { method: 'GET' as const, path: '/api/workspaces/:workspaceId/budget' },
  create: { method: 'POST' as const, path: '/api/budget' },
  update: { method: 'PUT' as const, path: '/api/budget/:id' },
  delete: { method: 'DELETE' as const, path: '/api/budget/:id' },
}
```

3. **Hook**
```typescript
// /lib/useBudget.ts
export function useBudget(workspaceId: number) {
  const [budgets, setBudgets] = useState<BudgetItem[]>();
  // ... implement fetch, create, update, delete
  return { budgets, createBudget, updateBudget, deleteBudget };
}
```

4. **Screens**
```typescript
// /app/budget/index.tsx
export default function BudgetScreen() {
  const { budgets, createBudget } = useBudget(workspaceId);
  // ... React Native UI
}
```

---

## 🔐 Authentication Flow

The `useAuth()` hook handles:
1. **Initialize**: Checks if user is logged in on app start
2. **Login**: POST to `/api/login` with email/password
3. **Register**: POST to `/api/register` with email/password
4. **Logout**: POST to `/api/logout` and clear tokens
5. **Maintain**: Stores guest token in AsyncStorage

```typescript
const { user, login, register, logout, isLoading } = useAuth();

// User is automatically fetched on app start
// Tokens are persisted across app restarts
```

---

## 🚨 Error Handling

All shared hooks follow this pattern:

```typescript
try {
  const result = await someOperation();
  return result;
} catch (error) {
  const errorMessage = error instanceof Error
    ? error.message
    : 'Unknown error occurred';
  throw new Error(errorMessage);
}
```

**Usage in screens**:
```typescript
try {
  await createNote(data);
} catch (error) {
  Alert.alert('Error', error.message);
}
```

---

## 🔄 State Management Pattern

### Shared Hooks Use Simple State:
```typescript
const [data, setData] = useState<T>();
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<Error | null>(null);
```

### No External Dependencies:
- ❌ No Redux required
- ❌ No Context API needed
- ✅ Just React hooks + fetch
- ✅ Lightweight and portable

---

## 📱 Mobile-Specific Setup

These packages are required:
```json
{
  "@react-native-async-storage/async-storage": "^1.x",
  "expo": "^51.x",
  "expo-router": "^3.x",
  "react-native": "^0.73.x"
}
```

The shared lib works with these - no additional dependencies for business logic!

---

## 🧪 Testing Shared Code

All modules can be tested independently:

```typescript
import { validateNote } from '@/lib/validation';
import { useNotes } from '@/lib/useNotes';

describe('Shared validation', () => {
  it('validates notes', () => {
    const result = validateNote('', '');
    expect(result.valid).toBe(false);
  });
});

describe('Shared useNotes hook', () => {
  it('fetches notes', async () => {
    // Test implementation
  });
});
```

Tests written here can be shared with web team!

---

## 🎁 Benefits Summary

| Benefit | Why It Matters |
|---------|--------|
| **Shared Types** | Prevents misalignment between platforms |
| **Shared Logic** | Same bugs fixed once, not twice |
| **Shared Validation** | Consistent validation rules |
| **Shared API Contract** | Backend only needs one endpoint spec |
| **No Type Duplication** | DRY principle |
| **Easy Testing** | Test logic once, use everywhere |

---

## 🚀 Performance Notes

- **No bloat**: Shared code is tree-shakeable
- **Light**: No heavy dependencies in core logic
- **Fast**: AsyncStorage is optimized for mobile
- **Efficient**: Only fetch when needed
- **Minimal rerenders**: useState patterns are efficient

---

## 📖 File-by-File Dependencies

```
api.ts
  ↓ (no dependencies)
  └─ Pure TypeScript

types.ts
  ↓ (no dependencies)
  └─ Pure TypeScript

validation.ts
  ↓ (no dependencies)
  └─ Pure TypeScript

fetchWithAuth.ts
  ↓ (depends on)
  └─ AsyncStorage

useNotes.ts
  ↓ (depends on)
  ├─ api.ts
  ├─ types.ts
  ├─ fetchWithAuth.ts
  └─ React hooks

useAuth.ts
  ↓ (depends on)
  ├─ api.ts
  ├─ types.ts
  ├─ fetchWithAuth.ts
  └─ React hooks
```

---

## 💾 Persistence

**What gets persisted**:
- Guest token (AsyncStorage)
- Auth token (AsyncStorage)
- User data (from API, not persisted by default)
- Notes (from API, not persisted by default)

To persist notes locally, add:
```typescript
// Example: Save notes to AsyncStorage
await AsyncStorage.setItem('notes', JSON.stringify(notes));
```

But the shared hook keeps them in memory - fine for this app!
