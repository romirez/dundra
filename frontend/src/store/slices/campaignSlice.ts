import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface Character {
  id: string;
  name: string;
  playerName: string;
  class: string;
  race: string;
  level: number;
  background: string;
  abilityScores: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  skills: string[];
  equipment: string[];
  spells: string[];
  notes: string;
  imageUrl?: string;
  // Legacy compatibility
  stats?: Record<string, number>;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  setting?: string;
  maxPlayers?: number;
  dmId: string;
  characters: Character[];
  createdAt: string;
  updatedAt: string;
}

interface CampaignState {
  campaigns: Campaign[];
  currentCampaign: Campaign | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CampaignState = {
  campaigns: [],
  currentCampaign: null,
  isLoading: false,
  error: null,
};

const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    setCampaigns: (state, action: PayloadAction<Campaign[]>) => {
      state.campaigns = action.payload;
    },
    setCurrentCampaign: (state, action: PayloadAction<Campaign>) => {
      state.currentCampaign = action.payload;
    },
    addCampaign: (state, action: PayloadAction<Campaign>) => {
      state.campaigns.push(action.payload);
    },
    updateCampaign: (state, action: PayloadAction<Campaign>) => {
      const index = state.campaigns.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.campaigns[index] = action.payload;
      }
      if (state.currentCampaign?.id === action.payload.id) {
        state.currentCampaign = action.payload;
      }
    },
    addCharacterToCampaign: (state, action: PayloadAction<{ campaignId: string; character: Character }>) => {
      const { campaignId, character } = action.payload;
      const campaign = state.campaigns.find(c => c.id === campaignId);
      if (campaign) {
        campaign.characters.push(character);
        campaign.updatedAt = new Date().toISOString();
      }
      if (state.currentCampaign?.id === campaignId) {
        state.currentCampaign.characters.push(character);
        state.currentCampaign.updatedAt = new Date().toISOString();
      }
    },
    updateCharacterInCampaign: (state, action: PayloadAction<{ campaignId: string; character: Character }>) => {
      const { campaignId, character } = action.payload;
      const campaign = state.campaigns.find(c => c.id === campaignId);
      if (campaign) {
        const characterIndex = campaign.characters.findIndex(c => c.id === character.id);
        if (characterIndex !== -1) {
          campaign.characters[characterIndex] = character;
          campaign.updatedAt = new Date().toISOString();
        }
      }
      if (state.currentCampaign?.id === campaignId) {
        const characterIndex = state.currentCampaign.characters.findIndex(c => c.id === character.id);
        if (characterIndex !== -1) {
          state.currentCampaign.characters[characterIndex] = character;
          state.currentCampaign.updatedAt = new Date().toISOString();
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCampaigns,
  setCurrentCampaign,
  addCampaign,
  updateCampaign,
  addCharacterToCampaign,
  updateCharacterInCampaign,
  setLoading,
  setError,
} = campaignSlice.actions;

export default campaignSlice.reducer;

// Export types for use in components
export type { Campaign, CampaignState, Character };

