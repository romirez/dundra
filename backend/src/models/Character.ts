import mongoose, { Document, Schema } from 'mongoose';

// TypeScript interfaces
export interface IAbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface ISkills {
  acrobatics: number;
  animalHandling: number;
  arcana: number;
  athletics: number;
  deception: number;
  history: number;
  insight: number;
  intimidation: number;
  investigation: number;
  medicine: number;
  nature: number;
  perception: number;
  performance: number;
  persuasion: number;
  religion: number;
  sleightOfHand: number;
  stealth: number;
  survival: number;
}

export interface IInventoryItem {
  name: string;
  description?: string;
  quantity: number;
  weight?: number;
  value?: number; // in gold pieces
  category: 'weapon' | 'armor' | 'tool' | 'consumable' | 'treasure' | 'other';
  equipped?: boolean;
  magical?: boolean;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very rare' | 'legendary' | 'artifact';
}

export interface ISpell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string[];
  duration: string;
  description: string;
  prepared?: boolean;
}

export interface ICharacterStats {
  hitPoints: {
    current: number;
    maximum: number;
    temporary: number;
  };
  armorClass: number;
  speed: number;
  proficiencyBonus: number;
  initiative: number;
  passivePerception: number;
}

export interface ICharacter extends Document {
  _id: mongoose.Types.ObjectId;
  schemaVersion: number;
  
  // Basic Information
  name: string;
  campaignId: mongoose.Types.ObjectId;
  
  // Character Details
  race: string;
  class: string;
  subclass?: string;
  background: string;
  level: number;
  experience: number;
  
  // Ability Scores
  abilityScores: IAbilityScores;
  skills: ISkills;
  
  // Character Stats
  stats: ICharacterStats;
  
  // Equipment (using subset pattern - limit to 50 items)
  inventory: IInventoryItem[];
  
  // Spells (subset pattern - limit to 50 spells)
  spells: ISpell[];
  
  // Additional Details
  personality: {
    traits: string[];
    ideals: string[];
    bonds: string[];
    flaws: string[];
  };
  
  backstory: string;
  notes: string;
  
  // Status
  isActive: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastPlayedAt?: Date;
  
  // Virtual properties
  abilityModifiers: Record<keyof IAbilityScores, number>;
  totalWeight: number;
  isAlive: boolean;
}

// Subdocument schemas
const AbilityScoresSchema = new Schema<IAbilityScores>({
  strength: {
    type: Number,
    required: true,
    min: [1, 'Ability score cannot be less than 1'],
    max: [30, 'Ability score cannot be greater than 30'],
    default: 10
  },
  dexterity: {
    type: Number,
    required: true,
    min: [1, 'Ability score cannot be less than 1'],
    max: [30, 'Ability score cannot be greater than 30'],
    default: 10
  },
  constitution: {
    type: Number,
    required: true,
    min: [1, 'Ability score cannot be less than 1'],
    max: [30, 'Ability score cannot be greater than 30'],
    default: 10
  },
  intelligence: {
    type: Number,
    required: true,
    min: [1, 'Ability score cannot be less than 1'],
    max: [30, 'Ability score cannot be greater than 30'],
    default: 10
  },
  wisdom: {
    type: Number,
    required: true,
    min: [1, 'Ability score cannot be less than 1'],
    max: [30, 'Ability score cannot be greater than 30'],
    default: 10
  },
  charisma: {
    type: Number,
    required: true,
    min: [1, 'Ability score cannot be less than 1'],
    max: [30, 'Ability score cannot be greater than 30'],
    default: 10
  }
}, { _id: false });

const SkillsSchema = new Schema<ISkills>({
  acrobatics: { type: Number, default: 0, min: -5, max: 20 },
  animalHandling: { type: Number, default: 0, min: -5, max: 20 },
  arcana: { type: Number, default: 0, min: -5, max: 20 },
  athletics: { type: Number, default: 0, min: -5, max: 20 },
  deception: { type: Number, default: 0, min: -5, max: 20 },
  history: { type: Number, default: 0, min: -5, max: 20 },
  insight: { type: Number, default: 0, min: -5, max: 20 },
  intimidation: { type: Number, default: 0, min: -5, max: 20 },
  investigation: { type: Number, default: 0, min: -5, max: 20 },
  medicine: { type: Number, default: 0, min: -5, max: 20 },
  nature: { type: Number, default: 0, min: -5, max: 20 },
  perception: { type: Number, default: 0, min: -5, max: 20 },
  performance: { type: Number, default: 0, min: -5, max: 20 },
  persuasion: { type: Number, default: 0, min: -5, max: 20 },
  religion: { type: Number, default: 0, min: -5, max: 20 },
  sleightOfHand: { type: Number, default: 0, min: -5, max: 20 },
  stealth: { type: Number, default: 0, min: -5, max: 20 },
  survival: { type: Number, default: 0, min: -5, max: 20 }
}, { _id: false });

const InventoryItemSchema = new Schema<IInventoryItem>({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Item description cannot exceed 500 characters']
  },
  quantity: {
    type: Number,
    required: true,
    min: [0, 'Quantity cannot be negative'],
    default: 1
  },
  weight: {
    type: Number,
    min: [0, 'Weight cannot be negative'],
    default: 0
  },
  value: {
    type: Number,
    min: [0, 'Value cannot be negative'],
    default: 0
  },
  category: {
    type: String,
    enum: ['weapon', 'armor', 'tool', 'consumable', 'treasure', 'other'],
    required: true,
    default: 'other'
  },
  equipped: {
    type: Boolean,
    default: false
  },
  magical: {
    type: Boolean,
    default: false
  },
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact'],
    default: 'common'
  }
}, { _id: false });

const SpellSchema = new Schema<ISpell>({
  name: {
    type: String,
    required: [true, 'Spell name is required'],
    trim: true,
    maxlength: [100, 'Spell name cannot exceed 100 characters']
  },
  level: {
    type: Number,
    required: true,
    min: [0, 'Spell level cannot be negative'],
    max: [9, 'Spell level cannot exceed 9']
  },
  school: {
    type: String,
    required: true,
    enum: ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation']
  },
  castingTime: {
    type: String,
    required: true,
    maxlength: [50, 'Casting time cannot exceed 50 characters']
  },
  range: {
    type: String,
    required: true,
    maxlength: [50, 'Range cannot exceed 50 characters']
  },
  components: {
    type: [String],
    required: true,
    validate: {
      validator: function(components: string[]) {
        return components.length > 0;
      },
      message: 'At least one component is required'
    }
  },
  duration: {
    type: String,
    required: true,
    maxlength: [50, 'Duration cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: true,
    maxlength: [2000, 'Spell description cannot exceed 2000 characters']
  },
  prepared: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const CharacterStatsSchema = new Schema<ICharacterStats>({
  hitPoints: {
    current: {
      type: Number,
      required: true,
      min: [0, 'Current hit points cannot be negative'],
      default: 8
    },
    maximum: {
      type: Number,
      required: true,
      min: [1, 'Maximum hit points must be at least 1'],
      default: 8
    },
    temporary: {
      type: Number,
      min: [0, 'Temporary hit points cannot be negative'],
      default: 0
    }
  },
  armorClass: {
    type: Number,
    required: true,
    min: [1, 'Armor class must be at least 1'],
    default: 10
  },
  speed: {
    type: Number,
    required: true,
    min: [0, 'Speed cannot be negative'],
    default: 30
  },
  proficiencyBonus: {
    type: Number,
    required: true,
    min: [2, 'Proficiency bonus must be at least 2'],
    max: [6, 'Proficiency bonus cannot exceed 6'],
    default: 2
  },
  initiative: {
    type: Number,
    required: true,
    min: [-5, 'Initiative cannot be less than -5'],
    max: [20, 'Initiative cannot exceed 20'],
    default: 0
  },
  passivePerception: {
    type: Number,
    required: true,
    min: [1, 'Passive perception must be at least 1'],
    default: 10
  }
}, { _id: false });

// Main Character Schema
const CharacterSchema = new Schema<ICharacter>({
  schemaVersion: {
    type: Number,
    default: 1,
    required: true
  },
  
  // Basic Information
  name: {
    type: String,
    required: [true, 'Character name is required'],
    trim: true,
    minlength: [2, 'Character name must be at least 2 characters'],
    maxlength: [50, 'Character name cannot exceed 50 characters'],
    index: true
  },
  campaignId: {
    type: Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign ID is required'],
    index: true
  },
  
  // Character Details
  race: {
    type: String,
    required: [true, 'Race is required'],
    trim: true,
    maxlength: [50, 'Race cannot exceed 50 characters'],
    index: true
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true,
    maxlength: [50, 'Class cannot exceed 50 characters'],
    index: true
  },
  subclass: {
    type: String,
    trim: true,
    maxlength: [50, 'Subclass cannot exceed 50 characters']
  },
  background: {
    type: String,
    required: [true, 'Background is required'],
    trim: true,
    maxlength: [50, 'Background cannot exceed 50 characters']
  },
  level: {
    type: Number,
    required: true,
    min: [1, 'Level must be at least 1'],
    max: [20, 'Level cannot exceed 20'],
    default: 1,
    index: true
  },
  experience: {
    type: Number,
    required: true,
    min: [0, 'Experience cannot be negative'],
    default: 0
  },
  
  // Ability Scores and Skills
  abilityScores: {
    type: AbilityScoresSchema,
    required: true,
    default: () => ({})
  },
  skills: {
    type: SkillsSchema,
    required: true,
    default: () => ({})
  },
  
  // Character Stats
  stats: {
    type: CharacterStatsSchema,
    required: true,
    default: () => ({})
  },
  
  // Equipment (subset pattern - limit to 50 items)
  inventory: {
    type: [InventoryItemSchema],
    validate: {
      validator: function(inventory: IInventoryItem[]) {
        return inventory.length <= 50;
      },
      message: 'Cannot have more than 50 items in inventory'
    },
    default: []
  },
  
  // Spells (subset pattern - limit to 50 spells)
  spells: {
    type: [SpellSchema],
    validate: {
      validator: function(spells: ISpell[]) {
        return spells.length <= 50;
      },
      message: 'Cannot have more than 50 spells'
    },
    default: []
  },
  
  // Personality
  personality: {
    traits: {
      type: [String],
      validate: {
        validator: function(traits: string[]) {
          return traits.length <= 5;
        },
        message: 'Cannot have more than 5 personality traits'
      },
      default: []
    },
    ideals: {
      type: [String],
      validate: {
        validator: function(ideals: string[]) {
          return ideals.length <= 5;
        },
        message: 'Cannot have more than 5 ideals'
      },
      default: []
    },
    bonds: {
      type: [String],
      validate: {
        validator: function(bonds: string[]) {
          return bonds.length <= 5;
        },
        message: 'Cannot have more than 5 bonds'
      },
      default: []
    },
    flaws: {
      type: [String],
      validate: {
        validator: function(flaws: string[]) {
          return flaws.length <= 5;
        },
        message: 'Cannot have more than 5 flaws'
      },
      default: []
    }
  },
  
  backstory: {
    type: String,
    trim: true,
    maxlength: [5000, 'Backstory cannot exceed 5000 characters'],
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    default: ''
  },
  
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  lastPlayedAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true,
  collection: 'characters'
});

// Virtual properties
CharacterSchema.virtual('abilityModifiers').get(function(this: ICharacter) {
  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);
  
  return {
    strength: calculateModifier(this.abilityScores.strength),
    dexterity: calculateModifier(this.abilityScores.dexterity),
    constitution: calculateModifier(this.abilityScores.constitution),
    intelligence: calculateModifier(this.abilityScores.intelligence),
    wisdom: calculateModifier(this.abilityScores.wisdom),
    charisma: calculateModifier(this.abilityScores.charisma)
  };
});

CharacterSchema.virtual('totalWeight').get(function(this: ICharacter) {
  return this.inventory.reduce((total, item) => {
    return total + (item.weight || 0) * item.quantity;
  }, 0);
});

CharacterSchema.virtual('isAlive').get(function(this: ICharacter) {
  return this.stats.hitPoints.current > 0;
});

// Middleware
CharacterSchema.pre('save', function(this: ICharacter, next) {
  // Ensure current HP doesn't exceed maximum HP
  if (this.stats.hitPoints.current > this.stats.hitPoints.maximum) {
    this.stats.hitPoints.current = this.stats.hitPoints.maximum;
  }
  
  // Calculate proficiency bonus based on level
  this.stats.proficiencyBonus = Math.ceil(this.level / 4) + 1;
  
  next();
});

// Instance methods
CharacterSchema.methods.addItem = function(this: ICharacter, item: Partial<IInventoryItem>) {
  if (this.inventory.length >= 50) {
    throw new Error('Cannot add more than 50 items to inventory');
  }
  
  // Check if item already exists
  const existingItem = this.inventory.find(i => i.name === item.name);
  if (existingItem) {
    existingItem.quantity += item.quantity || 1;
  } else {
    this.inventory.push(item as IInventoryItem);
  }
  
  return this.save();
};

CharacterSchema.methods.removeItem = function(this: ICharacter, itemName: string, quantity: number = 1) {
  const item = this.inventory.find(i => i.name === itemName);
  if (!item) {
    throw new Error(`Item "${itemName}" not found in inventory`);
  }
  
  if (item.quantity <= quantity) {
    this.inventory = this.inventory.filter(i => i.name !== itemName);
  } else {
    item.quantity -= quantity;
  }
  
  return this.save();
};

CharacterSchema.methods.takeDamage = function(this: ICharacter, damage: number) {
  this.stats.hitPoints.current = Math.max(0, this.stats.hitPoints.current - damage);
  return this.save();
};

CharacterSchema.methods.heal = function(this: ICharacter, healing: number) {
  this.stats.hitPoints.current = Math.min(
    this.stats.hitPoints.maximum,
    this.stats.hitPoints.current + healing
  );
  return this.save();
};

CharacterSchema.methods.levelUp = function(this: ICharacter) {
  if (this.level >= 20) {
    throw new Error('Character is already at maximum level');
  }
  
  this.level += 1;
  // Note: HP increase would typically be handled by the application logic
  // based on class hit die and constitution modifier
  
  return this.save();
};

// Static methods
CharacterSchema.statics.findByCampaign = function(campaignId: string) {
  return this.find({ campaignId, isActive: true }).sort({ name: 1 });
};

CharacterSchema.statics.findByClass = function(characterClass: string) {
  return this.find({ class: characterClass, isActive: true }).sort({ level: -1 });
};

CharacterSchema.statics.findByLevel = function(minLevel: number, maxLevel?: number) {
  const query: any = { level: { $gte: minLevel }, isActive: true };
  if (maxLevel) {
    query.level.$lte = maxLevel;
  }
  return this.find(query).sort({ level: -1 });
};

// Indexes for performance
CharacterSchema.index({ name: 'text', backstory: 'text' }); // Text search
CharacterSchema.index({ campaignId: 1, isActive: 1 }); // Find active characters in campaign
CharacterSchema.index({ class: 1, race: 1 }); // Filter by class and race
CharacterSchema.index({ level: -1 }); // Sort by level
CharacterSchema.index({ lastPlayedAt: -1 }); // Sort by last played

// Export the model
export const Character = mongoose.model<ICharacter>('Character', CharacterSchema);
export default Character; 