# Notes Feature: Web vs Mobile Comparison

## 1. API Layer

### Web (mynikkah/client)
```typescript
// mynikkah/client/src/hooks/use-notes.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const queryKey = [api.notes.list.path, workspaceId];
const { data: notes, isLoading } = useQuery({
  queryKey,
  queryFn: async () => {
    const url = buildUrl(api.notes.list.path, { workspaceId });
    const res = await fetchWithAuth(url);
    return await res.json();
  },
});
```

### Mobile (ournikkah)
```typescript
// ournikkah/src/lib/useNotes.ts - EXACT SAME PATTERN
const [notes, setNotes] = useState<Note[] | undefined>();

const fetchNotes = useCallback(async () => {
  const url = buildUrl(api.notes.list.path, { workspaceId });
  const res = await fetchWithAuth(toAbsoluteUrl(url));
  const data = await res.json();
  setNotes(data);
});
```

**Difference**: Web uses React Query (caching), Mobile uses useState (simpler)
**Reused**: `api.notes.list.path`, `buildUrl()`, `fetchWithAuth()`

---

## 2. Mutations (Create/Update/Delete)

### Web Version
```typescript
// mynikkah/client/src/hooks/use-notes.ts
const createNoteMutation = useMutation({
  mutationFn: async (data: CreateNoteRequest) => {
    const res = await fetchWithAuth(api.notes.create.path, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return await res.json();
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey });
    toast({ title: "Note added" });
  },
});
```

### Mobile Version
```typescript
// ournikkah/src/lib/useNotes.ts - SAME LOGIC
const createNote = useCallback(
  async (data: CreateNoteRequest): Promise<Note> => {
    const res = await fetchWithAuth(toAbsoluteUrl(api.notes.create.path), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const newNote = await res.json();
    setNotes((prev) => [...(prev || []), newNote]);
    return newNote;
  },
  []
);
```

**Reused**: Exact same fetch logic, error handling pattern
**Different**: State update mechanism (React Query vs setState)

---

## 3. Component Implementation

### Web - UI Layer
```typescript
// mynikkah/client/src/pages/Notes.tsx (conceptual)
import { useNotes } from '@/hooks/use-notes';
import { Card, CardContent } from '@/components/ui/card';

export function NotesPage() {
  const { notes, createNote } = useNotes(workspaceId);

  return (
    <div className="space-y-4">
      {notes?.map(note => (
        <Card key={note.id}>
          <CardContent>
            <h3 className="text-lg font-semibold">{note.title}</h3>
            <p className="text-gray-600">{note.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Mobile - UI Layer (COMPLETELY DIFFERENT)
```typescript
// ournikkah/src/app/notes/index.tsx
import { useNotes } from '@/lib/useNotes';
import { Card, CardContent } from '@/components/ui/card';
import { FlatList, View, Text } from 'react-native';

export default function NotesScreen() {
  const { notes, createNote } = useNotes(workspaceId);

  return (
    <FlatList
      data={notes}
      renderItem={({ item }) => (
        <Card>
          <CardContent>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.content}>{item.content}</Text>
          </CardContent>
        </Card>
      )}
    />
  );
}
```

**Reused**: `useNotes()` hook, `Card` component logic
**Different**: HTML vs React Native, CSS vs StyleSheet, routing

---

## 4. Full Feature Comparison

| Aspect | Web | Mobile | Shared? |
|--------|-----|--------|---------|
| **API Routes** | `api.notes.*` from shared | `api.notes.*` from lib | ✅ YES |
| **Types** | `Note`, `CreateNoteRequest` | `Note`, `CreateNoteRequest` | ✅ YES |
| **Fetch Logic** | `fetchWithAuth()` from lib | `fetchWithAuth()` from lib | ✅ YES |
| **Business Logic** | `useNotes()` hook | `useNotes()` hook | ✅ YES |
| **State Management** | React Query | useState | ❌ NO |
| **UI Framework** | React + HTML | React Native | ❌ NO |
| **Styling** | Tailwind CSS | StyleSheet | ❌ NO |
| **Routing** | wouter | Expo Router | ❌ NO |

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        SHARED LAYER                         │
│  (api.ts, types.ts, fetchWithAuth.ts, useNotes.ts)         │
│                    Platform Agnostic                        │
└────────────────┬──────────────────────────────┬─────────────┘
                 │                              │
        ┌────────▼─────────┐         ┌──────────▼───────────┐
        │   WEB (React)    │         │  MOBILE (RN)        │
        ├──────────────────┤         ├─────────────────────┤
        │ Pages/Components │         │ Screens/Navigation  │
        │ HTML/Tailwind    │         │ RN/StyleSheet       │
        │ wouter router    │         │ Expo Router         │
        │ React Query      │         │ useState hooks      │
        └────────┬─────────┘         └──────────┬──────────┘
                 │                              │
                 └──────────────┬───────────────┘
                                │
                        ┌───────▼──────────┐
                        │ Backend API      │
                        │ /api/notes/*     │
                        └──────────────────┘
```

---

## 6. Reusable Module Checklist

### ✅ Fully Reusable (No Changes)
- [ ] `api.ts` - API route definitions
- [ ] `types.ts` - TypeScript interfaces
- [ ] `validation.ts` - Input validators
- [ ] Business logic in `useNotes()` hook
- [ ] Error handling patterns

### 🔄 Reusable with Adaptation
- [ ] `fetchWithAuth()` - Adapted storage layer (localStorage → AsyncStorage)
- [ ] `useAuth()` - Same logic, different side effects

### ❌ Platform-Specific (Not Reusable)
- [ ] UI Components (shadcn vs RN)
- [ ] Navigation (wouter vs Expo Router)
- [ ] State management (React Query vs useState)
- [ ] Styling (Tailwind vs StyleSheet)

---

## 7. Benefits of This Approach

✅ **Single Source of Truth** - Business logic defined once
✅ **Type Safety** - Same types across platforms
✅ **Consistency** - API contracts match exactly
✅ **Maintenance** - Fix bugs in one place
✅ **Testing** - Test business logic separately from UI
✅ **Scalability** - Easy to add new features to both platforms
✅ **Team Efficiency** - One engineer can work on both

---

## 8. How to Use in New Features

When implementing a new feature (e.g., Budget):

### Step 1: Create platform-agnostic hook
```typescript
// src/lib/useBudget.ts - PLATFORM AGNOSTIC
export function useBudget(workspaceId: number) {
  const [budgets, setBudgets] = useState<BudgetItem[]>();
  // ... fetch, create, update, delete logic
  return { budgets, createBudget, ... };
}
```

### Step 2: Use in web
```typescript
// mynikkah/client/src/pages/Budget.tsx
import { useBudget } from '@/lib/useBudget';
// Render with HTML/Tailwind
```

### Step 3: Use in mobile
```typescript
// ournikkah/src/app/budget/index.tsx
import { useBudget } from '@/lib/useBudget';
// Render with React Native
```

Same hook, two different UIs!

---

## 9. Testing Strategy

All shared logic can be tested once and used on both platforms:

```typescript
// tests/useNotes.test.ts
describe('useNotes', () => {
  it('should fetch notes', async () => {
    // This test validates the shared hook
    // Works for both web and mobile
  });
});
```

```typescript
// tests/validation.test.ts
describe('validation', () => {
  it('should validate notes', () => {
    // This test validates shared validation
    // Works for both platforms
  });
});
```
