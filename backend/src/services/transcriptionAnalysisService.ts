import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { env } from '@/config/env';

// Core interfaces for the analysis system
export interface GameContext {
  campaignId: string;
  sessionId: string;
  currentLocation?: string;
  activeCharacters: string[];
  ongoingQuests: string[];
  recentEvents: string[];
  gameState: 'combat' | 'exploration' | 'social' | 'planning' | 'unknown';
  lastUpdated: Date;
}

export interface TranscriptionSegment {
  id: string;
  text: string;
  speaker: string;
  timestamp: Date;
  confidence: number;
}

export interface AnalysisResult {
  keyMoments: KeyMoment[];
  gameStateUpdate: Partial<GameContext>;
  cardGenerationTriggers: CardGenerationTrigger[];
  characterUpdates: CharacterUpdate[];
  contextSummary: string;
}

export interface KeyMoment {
  type: 'combat_start' | 'combat_end' | 'discovery' | 'social_encounter' | 'quest_update' | 'character_development' | 'environmental_change';
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  relatedCharacters: string[];
}

export interface CardGenerationTrigger {
  type: 'npc' | 'location' | 'item' | 'creature' | 'plot_hook' | 'environmental';
  priority: number;
  description: string;
  context: string;
  suggestedContent: string;
}

export interface CharacterUpdate {
  characterName: string;
  updateType: 'damage' | 'healing' | 'status_effect' | 'item_gain' | 'item_loss' | 'skill_use' | 'spell_cast';
  details: string;
  value?: number;
}

export class TranscriptionAnalysisService {
  private llm: ChatOpenAI;
  private gameContexts: Map<string, GameContext> = new Map();
  private outputParser = new StringOutputParser();

  constructor() {
    this.llm = new ChatOpenAI({
      apiKey: env.OPENAI_API_KEY,
      modelName: 'gpt-4o', // Using GPT-4o for analysis
      temperature: 0.1, // Low temperature for consistent analysis
      maxTokens: 2000,
    });
  }

  // Main analysis method - processes transcription segments
  async analyzeTranscription(
    segments: TranscriptionSegment[],
    gameContext: GameContext
  ): Promise<AnalysisResult> {
    // Update stored context
    this.gameContexts.set(gameContext.sessionId, gameContext);

    // Combine segments into analyzable text
    const transcriptionText = segments
      .map(s => `[${s.timestamp.toISOString()}] ${s.speaker}: ${s.text}`)
      .join('\n');

    // Create analysis prompt with game context
    const analysisPrompt = await this.createAnalysisPrompt();
    
    const prompt = await analysisPrompt.format({
      transcription: transcriptionText,
      currentLocation: gameContext.currentLocation || 'Unknown',
      activeCharacters: gameContext.activeCharacters.join(', '),
      ongoingQuests: gameContext.ongoingQuests.join(', '),
      recentEvents: gameContext.recentEvents.join(', '),
      currentGameState: gameContext.gameState,
    });

    // Execute LLM analysis
    const chain = analysisPrompt.pipe(this.llm).pipe(this.outputParser);
    const rawAnalysis = await chain.invoke({
      transcription: transcriptionText,
      currentLocation: gameContext.currentLocation || 'Unknown',
      activeCharacters: gameContext.activeCharacters.join(', '),
      ongoingQuests: gameContext.ongoingQuests.join(', '),
      recentEvents: gameContext.recentEvents.join(', '),
      currentGameState: gameContext.gameState,
    });

    // Parse the structured response
    return this.parseAnalysisResult(rawAnalysis, segments);
  }

  // Real-time analysis for immediate processing
  async analyzeRealTime(
    segment: TranscriptionSegment,
    gameContext: GameContext
  ): Promise<{
    immediateActions: string[];
    triggerCard: boolean;
    urgentUpdates: CharacterUpdate[];
  }> {
    const realtimePrompt = await this.createRealtimePrompt();
    
    const chain = realtimePrompt.pipe(this.llm).pipe(this.outputParser);
    const result = await chain.invoke({
      recentText: segment.text,
      speaker: segment.speaker,
      gameState: gameContext.gameState,
      activeCharacters: gameContext.activeCharacters.join(', '),
    });

    return this.parseRealtimeResult(result);
  }

  // Create comprehensive analysis prompt
  private async createAnalysisPrompt(): Promise<PromptTemplate> {
    return PromptTemplate.fromTemplate(`
You are an expert D&D Game Master assistant analyzing live gameplay transcription. Your task is to identify key moments, track game state, and determine when AI-generated content should be created.

CURRENT GAME CONTEXT:
- Location: {currentLocation}
- Active Characters: {activeCharacters}
- Ongoing Quests: {ongoingQuests}
- Recent Events: {recentEvents}
- Current State: {currentGameState}

TRANSCRIPTION TO ANALYZE:
{transcription}

Please analyze this transcription and provide a structured JSON response with the following sections:

1. KEY_MOMENTS: Identify significant events that should be tracked
2. GAME_STATE_UPDATE: Changes to location, characters, quests, or game state
3. CARD_GENERATION_TRIGGERS: Moments that require AI-generated content (NPCs, locations, items)
4. CHARACTER_UPDATES: Damage, healing, status changes, item gains/losses
5. CONTEXT_SUMMARY: Brief summary of what happened for future context

Use this JSON structure:
{{
  "keyMoments": [
    {{
      "type": "combat_start|combat_end|discovery|social_encounter|quest_update|character_development|environmental_change",
      "description": "Description of what happened",
      "timestamp": "ISO_timestamp_from_transcription",
      "severity": "low|medium|high",
      "relatedCharacters": ["character1", "character2"]
    }}
  ],
  "gameStateUpdate": {{
    "currentLocation": "New location if changed",
    "activeCharacters": ["updated character list"],
    "ongoingQuests": ["updated quest list"],
    "recentEvents": ["new events to add"],
    "gameState": "combat|exploration|social|planning|unknown"
  }},
  "cardGenerationTriggers": [
    {{
      "type": "npc|location|item|creature|plot_hook|environmental",
      "priority": 1-10,
      "description": "What needs to be generated",
      "context": "Context for generation",
      "suggestedContent": "Specific suggestion for the AI generator"
    }}
  ],
  "characterUpdates": [
    {{
      "characterName": "Character name",
      "updateType": "damage|healing|status_effect|item_gain|item_loss|skill_use|spell_cast",
      "details": "Specific details",
      "value": 123
    }}
  ],
  "contextSummary": "Brief summary of events for future reference"
}}

Focus on:
- Combat: Initiative, damage, spells, tactical decisions
- Exploration: New locations, discoveries, environmental details
- Social: NPC interactions, negotiations, roleplay moments
- Items/Equipment: Gains, losses, identification, usage
- Character Development: Level ups, new abilities, story moments
- Environmental: Weather, lighting, atmosphere changes

Be thorough but concise. Only include genuine updates and triggers.
`);
  }

  // Create real-time analysis prompt for immediate processing
  private async createRealtimePrompt(): Promise<PromptTemplate> {
    return PromptTemplate.fromTemplate(`
You are a D&D assistant providing real-time analysis of gameplay. Analyze this single statement for immediate actions needed.

CONTEXT:
- Speaker: {speaker}
- Game State: {gameState}
- Active Characters: {activeCharacters}

STATEMENT TO ANALYZE:
"{recentText}"

Provide a JSON response indicating immediate actions:

{{
  "immediateActions": ["List of immediate actions to take"],
  "triggerCard": true/false,
  "urgentUpdates": [
    {{
      "characterName": "Character name",
      "updateType": "damage|healing|status_effect|item_gain|item_loss",
      "details": "What happened",
      "value": 123
    }}
  ]
}}

Focus on urgent needs:
- Combat damage/healing that should be tracked immediately
- Critical status effects
- Important item acquisitions
- Environmental hazards
- NPC introductions requiring immediate card generation

Only include truly urgent items that need immediate processing.
`);
  }

  // Parse the structured LLM response into typed objects
  private parseAnalysisResult(rawResponse: string, segments: TranscriptionSegment[]): AnalysisResult {
    try {
      const parsed = JSON.parse(rawResponse);
      
      return {
        keyMoments: parsed.keyMoments.map((km: any) => ({
          ...km,
          timestamp: new Date(km.timestamp || segments[0]?.timestamp || new Date()),
        })),
        gameStateUpdate: parsed.gameStateUpdate,
        cardGenerationTriggers: parsed.cardGenerationTriggers,
        characterUpdates: parsed.characterUpdates,
        contextSummary: parsed.contextSummary,
      };
    } catch (error) {
      console.error('Failed to parse analysis result:', error);
      return {
        keyMoments: [],
        gameStateUpdate: {},
        cardGenerationTriggers: [],
        characterUpdates: [],
        contextSummary: 'Analysis parsing failed',
      };
    }
  }

  // Parse real-time analysis result
  private parseRealtimeResult(rawResponse: string): {
    immediateActions: string[];
    triggerCard: boolean;
    urgentUpdates: CharacterUpdate[];
  } {
    try {
      return JSON.parse(rawResponse);
    } catch (error) {
      console.error('Failed to parse realtime result:', error);
      return {
        immediateActions: [],
        triggerCard: false,
        urgentUpdates: [],
      };
    }
  }

  // Get or create game context for a session
  getGameContext(sessionId: string): GameContext | null {
    return this.gameContexts.get(sessionId) || null;
  }

  // Update game context
  updateGameContext(sessionId: string, updates: Partial<GameContext>): void {
    const existing = this.gameContexts.get(sessionId);
    if (existing) {
      this.gameContexts.set(sessionId, {
        ...existing,
        ...updates,
        lastUpdated: new Date(),
      });
    }
  }

  // Create initial context for a new session
  createGameContext(campaignId: string, sessionId: string): GameContext {
    const context: GameContext = {
      campaignId,
      sessionId,
      currentLocation: 'Starting Location',
      activeCharacters: [],
      ongoingQuests: [],
      recentEvents: [],
      gameState: 'unknown',
      lastUpdated: new Date(),
    };
    
    this.gameContexts.set(sessionId, context);
    return context;
  }

  // Clean up old contexts (call periodically)
  cleanupOldContexts(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [sessionId, context] of this.gameContexts.entries()) {
      if (context.lastUpdated < cutoff) {
        this.gameContexts.delete(sessionId);
      }
    }
  }
}