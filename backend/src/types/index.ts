import { Request } from 'express';
import { Document } from 'mongoose';

// User types
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign types
export interface ICampaign extends Document {
  _id: string;
  name: string;
  description: string;
  dmId: string;
  players: string[];
  characters: string[];
  sessions: string[];
  settings: {
    maxPlayers: number;
    isPublic: boolean;
    allowSpectators: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Character types
export interface ICharacter extends Document {
  _id: string;
  name: string;
  playerName: string;
  playerId: string;
  campaignId: string;
  class: string;
  level: number;
  race: string;
  background: string;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hitPoints: {
    current: number;
    maximum: number;
    temporary: number;
  };
  armorClass: number;
  proficiencyBonus: number;
  skills: Record<string, number>;
  equipment: string[];
  spells: string[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

// Session types
export interface ISession extends Document {
  _id: string;
  campaignId: string;
  name: string;
  date: Date;
  duration: number; // in minutes
  summary: string;
  transcription: ITranscriptionEntry[];
  generatedCards: IGeneratedCard[];
  participants: string[];
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Transcription types
export interface ITranscriptionEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: Date;
  confidence: number;
  processed: boolean;
}

// Generated card types
export interface IGeneratedCard {
  id: string;
  type: 'location' | 'npc' | 'item' | 'moment' | 'plot';
  title: string;
  description: string;
  imageUrl?: string;
  metadata: Record<string, any>;
  sessionId: string;
  timestamp: Date;
  isApproved: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// Socket.io types
export interface SocketUser {
  id: string;
  name: string;
  campaignId?: string;
}

export interface SocketEvents {
  // Connection events
  'user:join': (data: { campaignId: string; user: SocketUser }) => void;
  'user:leave': (data: { campaignId: string; userId: string }) => void;

  // Transcription events
  'transcription:start': () => void;
  'transcription:stop': () => void;
  'transcription:new': (entry: ITranscriptionEntry) => void;

  // Card generation events
  'card:generated': (card: IGeneratedCard) => void;
  'card:approved': (cardId: string) => void;
  'card:rejected': (cardId: string) => void;

  // Session events
  'session:update': (session: Partial<ISession>) => void;
  'session:participant:join': (participant: string) => void;
  'session:participant:leave': (participant: string) => void;
}

// Environment variables
export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  UPLOAD_DIR: string;
  MAX_FILE_SIZE: number;
  // Google Cloud configuration
  GOOGLE_CLOUD_PROJECT_ID?: string;
  GOOGLE_CLOUD_API_KEY?: string;
  GOOGLE_CLOUD_KEY_FILE?: string; // Optional fallback for service account
}
