// Token management for React Native using AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_TOKEN_KEY = 'guestToken';
const AUTH_TOKEN_KEY = 'authToken';

export async function getGuestToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(GUEST_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get guest token:', error);
    return null;
  }
}

export async function setGuestToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(GUEST_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to set guest token:', error);
  }
}

export async function clearGuestToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear guest token:', error);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

export async function setAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to set auth token:', error);
  }
}

export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
}

export async function buildHeaders(includeContentType: boolean = false): Promise<HeadersInit> {
  const headers: HeadersInit = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const guestToken = await getGuestToken();
  if (guestToken) {
    headers['X-Guest-Token'] = guestToken;
  }

  return headers;
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...(await buildHeaders(options.body !== undefined)),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}
