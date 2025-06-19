// Export all models and their interfaces
export { Campaign, ICampaign, ICampaignMetadata, ICampaignSettings } from './Campaign';
export { Character, IAbilityScores, ICharacter, ICharacterStats, IInventoryItem, ISkills, ISpell } from './Character';
export { IEncounter, IGeneratedCard, ISession, ISessionParticipant, ISessionStats, Session } from './Session';

// Re-export mongoose for convenience
export { default as mongoose } from 'mongoose';

// Database connection utility
import mongoose from 'mongoose';

export const connectDatabase = async (uri: string): Promise<void> => {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB successfully');
  } catch (error) {
    console.error('❌ Failed to disconnect from MongoDB:', error);
    throw error;
  }
};

// Model validation helper
export const validateSchemas = (): boolean => {
  try {
    // Check if all models are properly registered
    const models = mongoose.models;
    const requiredModels = ['Campaign', 'Character', 'Session'];
    
    for (const modelName of requiredModels) {
      if (!models[modelName]) {
        throw new Error(`Model ${modelName} is not registered`);
      }
    }
    
    console.log('✅ All database schemas are valid and registered');
    return true;
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    return false;
  }
}; 