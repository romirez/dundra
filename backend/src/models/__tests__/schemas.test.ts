import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Import models directly to avoid circular dependencies
import Campaign from '../Campaign';
import Character from '../Character';
import Session from '../Session';

describe('Database Schemas', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  describe('Campaign Schema', () => {
    it('should create a valid campaign with default values', async () => {
      const campaign = new Campaign({
        name: 'Test Campaign',
        description: 'A test campaign for unit testing'
      });

      const savedCampaign = await campaign.save();
      
      expect(savedCampaign.name).toBe('Test Campaign');
      expect(savedCampaign.status).toBe('planning');
      expect(savedCampaign.schemaVersion).toBe(1);
    });

    it('should validate required fields', async () => {
      const campaign = new Campaign({});
      
      await expect(campaign.save()).rejects.toThrow(/Campaign name is required/);
    });

    it('should validate campaign name length', async () => {
      const campaign = new Campaign({
        name: 'A' // Too short
      });
      
      await expect(campaign.save()).rejects.toThrow(/Campaign name must be at least 2 characters/);
    });
  });

  describe('Character Schema', () => {
    let campaignId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      const campaign = await Campaign.create({
        name: 'Test Campaign'
      });
      campaignId = campaign._id;
    });

    it('should create a valid character with default values', async () => {
      const character = new Character({
        name: 'Test Character',
        campaignId,
        race: 'Human',
        class: 'Fighter',
        background: 'Soldier'
      });

      const savedCharacter = await character.save();
      
      expect(savedCharacter.name).toBe('Test Character');
      expect(savedCharacter.level).toBe(1);
      expect(savedCharacter.experience).toBe(0);
    });

    it('should validate required fields', async () => {
      const character = new Character({
        campaignId
      });
      
      await expect(character.save()).rejects.toThrow(/Character name is required/);
    });
  });

  describe('Session Schema', () => {
    let campaignId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      const campaign = await Campaign.create({
        name: 'Test Campaign'
      });
      campaignId = campaign._id;
    });

    it('should create a valid session with default values', async () => {
      const session = new Session({
        title: 'Test Session',
        campaignId,
        sessionNumber: 1,
        scheduledDate: new Date()
      });

      const savedSession = await session.save();
      
      expect(savedSession.title).toBe('Test Session');
      expect(savedSession.status).toBe('planned');
      expect(savedSession.sessionNumber).toBe(1);
    });

    it('should validate required fields', async () => {
      const session = new Session({
        campaignId
      });
      
      await expect(session.save()).rejects.toThrow(/Session title is required/);
    });
  });

  describe('Model Relationships', () => {
    it('should maintain referential integrity between Campaign and Character', async () => {
      const campaign = await Campaign.create({
        name: 'Test Campaign'
      });

      const character = await Character.create({
        name: 'Test Character',
        campaignId: campaign._id,
        race: 'Human',
        class: 'Fighter',
        background: 'Soldier'
      });

      expect(character.campaignId).toEqual(campaign._id);
    });
  });
}); 