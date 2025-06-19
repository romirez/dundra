import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interfaces
export interface ICampaignSettings {
  systemType: 'dnd5e' | 'pathfinder' | 'custom';
  difficultyLevel: 'easy' | 'normal' | 'hard' | 'nightmare';
  houseRules: string[];
  allowedSourceBooks: string[];
  startingLevel: number;
  maxLevel: number;
}

export interface ICampaignMetadata {
  totalSessions: number;
  totalCharacters: number;
  totalPlayTime: number; // in minutes
  averageSessionLength: number; // in minutes
  lastCalculated: Date;
}

export interface ICampaign extends Document {
  _id: mongoose.Types.ObjectId;
  schemaVersion: number;
  
  // Basic Information
  name: string;
  description: string;
  status: 'planning' | 'active' | 'paused' | 'completed' | 'archived';
  
  // Dates
  createdAt: Date;
  updatedAt: Date;
  lastPlayedAt?: Date;
  plannedStartDate?: Date;
  
  // Campaign Settings
  settings: ICampaignSettings;
  
  // Metadata (computed/cached values)
  metadata: ICampaignMetadata;
  
  // Notes and additional info
  notes: string;
  tags: string[];
  
  // Virtual properties
  isActive: boolean;
  daysSinceLastPlayed?: number;
}

// Subdocument schemas
const CampaignSettingsSchema = new Schema<ICampaignSettings>({
  systemType: {
    type: String,
    enum: ['dnd5e', 'pathfinder', 'custom'],
    default: 'dnd5e',
    required: true
  },
  difficultyLevel: {
    type: String,
    enum: ['easy', 'normal', 'hard', 'nightmare'],
    default: 'normal',
    required: true
  },
  houseRules: {
    type: [String],
    default: [],
    validate: {
      validator: function(rules: string[]) {
        return rules.length <= 20; // Reasonable limit
      },
      message: 'Cannot have more than 20 house rules'
    }
  },
  allowedSourceBooks: {
    type: [String],
    default: ['Player\'s Handbook'],
    validate: {
      validator: function(books: string[]) {
        return books.length > 0;
      },
      message: 'At least one source book must be allowed'
    }
  },
  startingLevel: {
    type: Number,
    min: 1,
    max: 20,
    default: 1,
    required: true
  },
  maxLevel: {
    type: Number,
    min: 1,
    max: 20,
    default: 20,
    required: true,
    validate: {
      validator: function(this: ICampaignSettings, maxLevel: number) {
        return maxLevel >= this.startingLevel;
      },
      message: 'Max level must be greater than or equal to starting level'
    }
  }
}, { _id: false });

const CampaignMetadataSchema = new Schema<ICampaignMetadata>({
  totalSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCharacters: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPlayTime: {
    type: Number,
    default: 0,
    min: 0
  },
  averageSessionLength: {
    type: Number,
    default: 0,
    min: 0
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Main Campaign Schema
const CampaignSchema = new Schema<ICampaign>({
  schemaVersion: {
    type: Number,
    default: 1,
    required: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    trim: true,
    minlength: [2, 'Campaign name must be at least 2 characters'],
    maxlength: [100, 'Campaign name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: {
      values: ['planning', 'active', 'paused', 'completed', 'archived'],
      message: 'Status must be one of: planning, active, paused, completed, archived'
    },
    default: 'planning',
    required: true,
    index: true
  },
  
  // Dates
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  lastPlayedAt: {
    type: Date,
    index: true
  },
  plannedStartDate: {
    type: Date,
    validate: {
      validator: function(date: Date) {
        return !date || date >= new Date();
      },
      message: 'Planned start date cannot be in the past'
    }
  },
  
  // Campaign Settings
  settings: {
    type: CampaignSettingsSchema,
    required: true,
    default: () => ({})
  },
  
  // Metadata
  metadata: {
    type: CampaignMetadataSchema,
    required: true,
    default: () => ({})
  },
  
  // Additional Information
  notes: {
    type: String,
    trim: true,
    maxlength: [5000, 'Notes cannot exceed 5000 characters'],
    default: ''
  },
  tags: {
    type: [String],
    validate: {
      validator: function(tags: string[]) {
        return tags.length <= 10;
      },
      message: 'Cannot have more than 10 tags'
    },
    default: []
  }
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'campaigns'
});

// Virtual properties
CampaignSchema.virtual('isActive').get(function(this: ICampaign) {
  return this.status === 'active';
});

CampaignSchema.virtual('daysSinceLastPlayed').get(function(this: ICampaign) {
  if (!this.lastPlayedAt) return undefined;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.lastPlayedAt.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Middleware
CampaignSchema.pre('save', function(this: ICampaign, next) {
  // Update the updatedAt timestamp
  this.updatedAt = new Date();
  
  // Validate that maxLevel >= startingLevel
  if (this.settings.maxLevel < this.settings.startingLevel) {
    return next(new Error('Max level must be greater than or equal to starting level'));
  }
  
  next();
});

CampaignSchema.pre('findOneAndUpdate', function(next) {
  // Update the updatedAt timestamp on updates
  this.set({ updatedAt: new Date() });
  next();
});

// Instance methods
CampaignSchema.methods.updateMetadata = function(this: ICampaign, sessionCount?: number, characterCount?: number, totalPlayTime?: number) {
  if (sessionCount !== undefined) this.metadata.totalSessions = sessionCount;
  if (characterCount !== undefined) this.metadata.totalCharacters = characterCount;
  if (totalPlayTime !== undefined) {
    this.metadata.totalPlayTime = totalPlayTime;
    this.metadata.averageSessionLength = this.metadata.totalSessions > 0 
      ? Math.round(totalPlayTime / this.metadata.totalSessions) 
      : 0;
  }
  this.metadata.lastCalculated = new Date();
  return this.save();
};

CampaignSchema.methods.markAsPlayed = function(this: ICampaign) {
  this.lastPlayedAt = new Date();
  if (this.status === 'planning') {
    this.status = 'active';
  }
  return this.save();
};

// Static methods
CampaignSchema.statics.findActive = function() {
  return this.find({ status: 'active' }).sort({ lastPlayedAt: -1 });
};

CampaignSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ updatedAt: -1 });
};

CampaignSchema.statics.searchByName = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm }
  }, {
    score: { $meta: 'textScore' }
  }).sort({
    score: { $meta: 'textScore' }
  });
};

// Indexes for performance
CampaignSchema.index({ name: 'text', description: 'text' }); // Text search
CampaignSchema.index({ status: 1, lastPlayedAt: -1 }); // Filter by status and sort by last played
CampaignSchema.index({ createdAt: -1 }); // Sort by creation date
CampaignSchema.index({ tags: 1 }); // Filter by tags

// Export the model
export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
export default Campaign; 