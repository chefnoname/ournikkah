// Shared types - mirror of web app types
export interface User {
  id: number;
  email: string;
  createdAt: string;
}

export interface Workspace {
  id: number;
  name: string;
  userName?: string;
  partnerName?: string;
  baseLocation: string;
  ownerId: number | null;
  hasNikah: boolean;
  hasWalima: boolean;
  onboardingCompleted: boolean;
  currentStage: string;
  nikahDate: string | null;
  walimaDate: string | null;
  budgetRange: string | null;
  guestCount: string | null;
  totalBudget: number | null;
  createdAt: string;
}

export interface Note {
  id: number;
  workspaceId: number;
  title: string;
  content: string;
  updatedByEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  workspaceId: number;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

export interface VendorItem {
  id: number;
  workspaceId: number | null;
  section: string;
  vendorCategory: string | null;
  title: string;
  url: string | null;
  location: string | null;
  priceRange: string | null;
  imageUrls: string[];
  status: string;
  source: string;
  description: string | null;
  bio?: string | null;
  specialty?: string | null;
  capacity?: string | null;
  sisterFriendly?: boolean;
  parking?: boolean;
  disabilityAccessible?: boolean;
  features?: string[];
  amenities?: string[];
  contactEmail?: string | null;
  contactPhone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SavedVendor {
  id: number;
  workspaceId: number;
  vendorItemId: number;
  contactStatus: string;
  isFinalized: boolean;
  createdAt: string;
  vendorItem?: VendorItem;
}

export interface BudgetItem {
  id: number;
  workspaceId: number;
  category: string;
  amount: number;
  notes: string | null;
  createdAt: string;
}

export interface GuestInvite {
  id: number;
  workspaceId: number;
  guestName: string;
  rsvpStatus: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: number;
  workspaceId: number;
  userId: number | null;
  role: string;
  joinedAt: string;
  user?: { username?: string; email?: string };
}

export interface SummaryData {
  nikahDisplay?: string;
  nikahCountdownDays: number | null;
  finalizedVenues?: VendorItem[];
  finalizedVendors?: VendorItem[];
  totalBudget: number | null;
  budgetSpent: number;
  budgetItems?: number;
  savedCount: number;
  guestCount?: string | null;
  guestInvites: number;
  guestAttending: number;
  guestPending?: number;
}
