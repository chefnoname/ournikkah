// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters' };
  }
  return { valid: true };
}

export function validateNote(title: string, content: string): { valid: boolean; message?: string } {
  if (!title.trim()) {
    return { valid: false, message: 'Title is required' };
  }
  if (!content.trim()) {
    return { valid: false, message: 'Content is required' };
  }
  return { valid: true };
}
