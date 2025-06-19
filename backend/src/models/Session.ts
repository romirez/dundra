import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interfaces
export interface IEncounter {
  name: string;
  description: string;
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly';
  creatures: {
    name: string;
    count: number;
    challengeRating?: string;
  }[];
  environment?: string;
  objectives?: string[];
  rewards?: string[];
}

export interface IGeneratedCard {
  type: 'npc' | 'location' | 'plot_hook' | 'treasure' | 'encounter' | 'event';
  title: string;
  description: string;
  details?: string;
  tags?: string[];
  used?: boolean;
  usedAt?: Date;
  notes?: string;
}

export interface ISessionParticipant {
  characterId: mongoose.Types.ObjectId;
  characterName: string; // Denormalized for performance
  attended: boolean;
  experienceGained?: number;
  notes?: string;
}

export interface ISessionStats {
  duration: number; // in minutes
  experienceAwarded: number;
  goldAwarded: number;
  itemsAwarded: string[];
  encountersCompleted: number;
  objectivesCompleted: string[];
}

export interface ISession extends Document {
  _id: mongoose.Types.ObjectId;
  schemaVersion: number;
  
  // Basic Information
  title: string;
  campaignId: mongoose.Types.ObjectId;
  sessionNumber: number;
  
  // Date and Time
  scheduledDate: Date;
  actualDate?: Date;
  
  // Session Content
  summary: string;
  notes: string;
  objectives: string[];
  
  // AI Generated Content (subset pattern - limit to 20 cards)
  generatedCards: IGeneratedCard[];
  
  // Encounters (subset pattern - limit to 10 encounters)
  encounters: IEncounter[];
  
  // Participants (subset pattern - limit to 8 characters)
  participants: ISessionParticipant[];
  
  // Session Statistics
  stats: ISessionStats;
  
  // Status
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  
  // Preparation and Planning
  preparationNotes: string;
  dmNotes: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isCompleted: boolean;
  totalParticipants: number;
  averageExperiencePerCharacter: number;
}

// Subdocument schemas
const EncounterSchema = new Schema<IEncounter>({
  name: {
    type: String,
    required: [true, 'Encounter name is required'],
    trim: true,
    maxlength: [100, 'Encounter name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Encounter description is required'],
    trim: true,
    maxlength: [1000, 'Encounter description cannot exceed 1000 characters']
  },
  difficulty: {
    type: String,
    enum: ['trivial', 'easy', 'medium', 'hard', 'deadly'],
    required: true,
    default: 'medium'
  },
  creatures: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Creature name cannot exceed 50 characters']
    },
    count: {
      type: Number,
      required: true,
      min: [1, 'Creature count must be at least 1'],
      max: [50, 'Creature count cannot exceed 50']
    },
    challengeRating: {
      type: String,
      trim: true,
      maxlength: [10, 'Challenge rating cannot exceed 10 characters']
    }
  }],
  environment: {
    type: String,
    trim: true,
    maxlength: [100, 'Environment cannot exceed 100 characters']
  },
  objectives: {
    type: [String],
    validate: {
      validator: function(objectives: string[]) {
        return objectives.length <= 5;
      },
      message: 'Cannot have more than 5 objectives per encounter'
    },
    default: []
  },
  rewards: {
    type: [String],
    validate: {
      validator: function(rewards: string[]) {
        return rewards.length <= 10;
      },
      message: 'Cannot have more than 10 rewards per encounter'
    },
    default: []
  }
}, { _id: false });

const GeneratedCardSchema = new Schema<IGeneratedCard>({
  type: {
    type: String,
    enum: ['npc', 'location', 'plot_hook', 'treasure', 'encounter', 'event'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Card title is required'],
    trim: true,
    maxlength: [100, 'Card title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Card description is required'],
    trim: true,
    maxlength: [1000, 'Card description cannot exceed 1000 characters']
  },
  details: {
    type: String,
    trim: true,
    maxlength: [2000, 'Card details cannot exceed 2000 characters']
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 5;
      },
      message: 'Cannot have more than 5 tags per card'
    },
    default: []
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Card notes cannot exceed 500 characters']
  }
}, { _id: false });

const SessionParticipantSchema = new Schema<ISessionParticipant>({
  characterId: {
    type: Schema.Types.ObjectId,
    ref: 'Character',
    required: [true, 'Character ID is required']
  },
  characterName: {
    type: String,
    required: [true, 'Character name is required'],
    trim: true,
    maxlength: [50, 'Character name cannot exceed 50 characters']
  },
  attended: {
    type: Boolean,
    default: true
  },
  experienceGained: {
    type: Number,
    min: [0, 'Experience gained cannot be negative'],
    default: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Participant notes cannot exceed 500 characters']
  }
}, { _id: false });

const SessionStatsSchema = new Schema<ISessionStats>({
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative'],
    default: 0
  },
  experienceAwarded: {
    type: Number,
    min: [0, 'Experience awarded cannot be negative'],
    default: 0
  },
  goldAwarded: {
    type: Number,
    min: [0, 'Gold awarded cannot be negative'],
    default: 0
  },
  itemsAwarded: {
    type: [String],
    validate: {
      validator: function(items: string[]) {
        return items.length <= 20;
      },
      message: 'Cannot award more than 20 items per session'
    },
    default: []
  },
  encountersCompleted: {
    type: Number,
    min: [0, 'Encounters completed cannot be negative'],
    default: 0
  },
  objectivesCompleted: {
    type: [String],
    validate: {
      validator: function(objectives: string[]) {
        return objectives.length <= 10;
      },
      message: 'Cannot complete more than 10 objectives per session'
    },
    default: []
  }
}, { _id: false });

// Main Session Schema
const SessionSchema = new Schema<ISession>({
  schemaVersion: {
    type: Number,
    default: 1,
    required: true
  },
  
  // Basic Information
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    minlength: [3, 'Session title must be at least 3 characters'],
    maxlength: [100, 'Session title cannot exceed 100 characters'],
    index: true
  },
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign ID is required'],
    index: true
  },
  sessionNumber: {
    type: Number,
    required: true,
    min: [1, 'Session number must be at least 1'],
    index: true
  },
  
  // Date and Time
  scheduledDate: {
    type: Date,
    required: [true, 'Scheduled date is required'],
    index: true
  },
  actualDate: {
    type: Date,
    index: true
  },
  
  // Session Content
  summary: {
    type: String,
    trim: true,
    maxlength: [5000, 'Summary cannot exceed 5000 characters'],
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [10000, 'Notes cannot exceed 10000 characters'],
    default: ''
  },
  objectives: {
    type: [String],
    validate: {
      validator: function(objectives: string[]) {
        return objectives.length <= 10;
      },
      message: 'Cannot have more than 10 objectives per session'
    },
    default: []
  },
  
  // AI Generated Content (subset pattern - limit to 20 cards)
  generatedCards: {
    type: [GeneratedCardSchema],
    validate: {
      validator: function(cards: IGeneratedCard[]) {
        return cards.length <= 20;
      },
      message: 'Cannot have more than 20 generated cards per session'
    },
    default: []
  },
  
  // Encounters (subset pattern - limit to 10 encounters)
  encounters: {
    type: [EncounterSchema],
    validate: {
      validator: function(encounters: IEncounter[]) {
        return encounters.length <= 10;
      },
      message: 'Cannot have more than 10 encounters per session'
    },
    default: []
  },
  
  // Participants (subset pattern - limit to 8 characters)
  participants: {
    type: [SessionParticipantSchema],
    validate: {
      validator: function(participants: ISessionParticipant[]) {
        return participants.length <= 8;
      },
      message: 'Cannot have more than 8 participants per session'
    },
    default: []
  },
  
  // Session Statistics
  stats: {
    type: SessionStatsSchema,
    required: true,
    default: () => ({})
  },
  
  // Status
  status: {
    type: String,
    enum: {
      values: ['planned', 'in_progress', 'completed', 'cancelled'],
      message: 'Status must be one of: planned, in_progress, completed, cancelled'
    },
    default: 'planned',
    required: true,
    index: true
  },
  
  // Preparation and Planning
  preparationNotes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Preparation notes cannot exceed 5000 characters'],
    default: ''
  },
  dmNotes: {
    type: String,
    trim: true,
    maxlength: [5000, 'DM notes cannot exceed 5000 characters'],
    default: ''
  }
}, {
  timestamps: true,
  collection: 'sessions'
});

// Virtual properties
SessionSchema.virtual('isCompleted').get(function(this: ISession) {
  return this.status === 'completed';
});

SessionSchema.virtual('totalParticipants').get(function(this: ISession) {
  return this.participants.filter(p => p.attended).length;
});

SessionSchema.virtual('averageExperiencePerCharacter').get(function(this: ISession) {
  const attendingParticipants = this.participants.filter(p => p.attended);
  if (attendingParticipants.length === 0) return 0;
  
  return Math.round(this.stats.experienceAwarded / attendingParticipants.length);
});

// Middleware
SessionSchema.pre('save', function(this: ISession, next) {
  // Set actualDate when status changes to completed
  if (this.status === 'completed' && !this.actualDate) {
    this.actualDate = new Date();
  }
  
  // Validate that session number is unique per campaign
  if (this.isNew || this.isModified('sessionNumber') || this.isModified('campaignId')) {
    // This validation will be handled by the unique index
  }
  
  next();
});

SessionSchema.pre('findOneAndUpdate', function(next) {
  // Update the updatedAt timestamp on updates
  this.set({ updatedAt: new Date() });
  next();
});

// Instance methods
SessionSchema.methods.addParticipant = function(this: ISession, characterId: mongoose.Types.ObjectId, characterName: string) {
  // Check if participant already exists
  const existingParticipant = this.participants.find(p => p.characterId.equals(characterId));
  if (existingParticipant) {
    throw new Error('Character is already a participant in this session');
  }
  
  if (this.participants.length >= 8) {
    throw new Error('Cannot add more than 8 participants to a session');
  }
  
  this.participants.push({
    characterId,
    characterName,
    attended: true
  });
  
  return this.save();
};

SessionSchema.methods.removeParticipant = function(this: ISession, characterId: mongoose.Types.ObjectId) {
  this.participants = this.participants.filter(p => !p.characterId.equals(characterId));
  return this.save();
};

SessionSchema.methods.addGeneratedCard = function(this: ISession, card: Omit<IGeneratedCard, 'used' | 'usedAt'>) {
  if (this.generatedCards.length >= 20) {
    throw new Error('Cannot add more than 20 generated cards to a session');
  }
  
  this.generatedCards.push({
    ...card,
    used: false
  });
  
  return this.save();
};

SessionSchema.methods.useCard = function(this: ISession, cardIndex: number, notes?: string) {
  if (cardIndex < 0 || cardIndex >= this.generatedCards.length) {
    throw new Error('Invalid card index');
  }
  
  const card = this.generatedCards[cardIndex];
  card.used = true;
  card.usedAt = new Date();
  if (notes) {
    card.notes = notes;
  }
  
  return this.save();
};

SessionSchema.methods.completeSession = function(this: ISession, stats?: Partial<ISessionStats>) {
  this.status = 'completed';
  this.actualDate = new Date();
  
  if (stats) {
    Object.assign(this.stats, stats);
  }
  
  return this.save();
};

// Static methods
SessionSchema.statics.findByCampaign = function(campaignId: string) {
  return this.find({ campaignId }).sort({ sessionNumber: 1 });
};

SessionSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ scheduledDate: -1 });
};

SessionSchema.statics.findUpcoming = function(daysAhead: number = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));
  
  return this.find({
    status: 'planned',
    scheduledDate: { $gte: now, $lte: futureDate }
  }).sort({ scheduledDate: 1 });
};

SessionSchema.statics.findByCharacter = function(characterId: string) {
  return this.find({
    'participants.characterId': characterId,
    'participants.attended': true
  }).sort({ actualDate: -1, scheduledDate: -1 });
};

SessionSchema.statics.getNextSessionNumber = async function(campaignId: string) {
  const lastSession = await this.findOne({ campaignId }).sort({ sessionNumber: -1 });
  return lastSession ? lastSession.sessionNumber + 1 : 1;
};

// Indexes for performance
SessionSchema.index({ title: 'text', summary: 'text', notes: 'text' }); // Text search
SessionSchema.index({ campaignId: 1, sessionNumber: 1 }, { unique: true }); // Unique session number per campaign
SessionSchema.index({ campaignId: 1, scheduledDate: -1 }); // Campaign sessions by date
SessionSchema.index({ status: 1, scheduledDate: -1 }); // Filter by status and sort by date
SessionSchema.index({ actualDate: -1 }); // Sort by actual date
SessionSchema.index({ 'participants.characterId': 1 }); // Find sessions by character participation

// Export the model
export const Session = mongoose.model<ISession>('Session', SessionSchema);
export default Session; 