import { WorkspaceProvider } from '@/lib/useWorkspace';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <WorkspaceProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="notes/index" options={{ headerShown: true, title: 'Notes', headerBackTitle: 'Back' }} />
        <Stack.Screen name="notes/new" options={{ headerShown: true, title: 'New Note', headerBackTitle: 'Back' }} />
        <Stack.Screen name="notes/[id]" options={{ headerShown: true, title: 'Edit Note', headerBackTitle: 'Back' }} />
      </Stack>
    </WorkspaceProvider>
  );
}
