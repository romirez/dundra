import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { io, Socket } from 'socket.io-client';
import AudioCapture from '../components/AudioCapture';
import { RootState } from '../store/store';
import { setCurrentCampaign } from '../store/slices/campaignSlice';

interface GeneratedCard {
  id: string;
  type: 'npc' | 'location' | 'item' | 'creature' | 'plot_hook' | 'environmental';
  title: string;
  description: string;
  imageUrl?: string;
  priority: number;
  timestamp: number;
  context: string;
}

interface GameContext {
  campaignId: string;
  sessionId: string;
  currentLocation?: string;
  activeCharacters: string[];
  ongoingQuests: string[];
  recentEvents: string[];
  gameState: 'combat' | 'exploration' | 'social' | 'planning' | 'unknown';
  lastUpdated: Date;
}

interface AnalysisResult {
  keyMoments: any[];
  gameStateUpdate: Partial<GameContext>;
  cardGenerationTriggers: any[];
  characterUpdates: any[];
  contextSummary: string;
}

interface LivePlayError {
  message: string;
  type: 'connection' | 'analysis' | 'audio' | 'general';
  timestamp: number;
}

const LivePlay: React.FC = () => {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCampaign, campaigns } = useSelector((state: RootState) => state.campaign);
  const { transcriptions } = useSelector((state: RootState) => state.game);

  // Real-time state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [gameContext, setGameContext] = useState<GameContext>({
    campaignId: campaignId || '',
    sessionId: '',
    activeCharacters: [],
    ongoingQuests: [],
    recentEvents: [],
    gameState: 'unknown',
    lastUpdated: new Date()
  });
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GeneratedCard | null>(null);
  const [commandInput, setCommandInput] = useState('');
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);
  const [errors, setErrors] = useState<LivePlayError[]>([]);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'error'>('idle');

  // Refs
  const sessionStartTime = useRef<number | null>(null);
  const cardsEndRef = useRef<HTMLDivElement>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // Error handling
  const addError = (message: string, type: LivePlayError['type'] = 'general') => {
    const error: LivePlayError = {
      message,
      type,
      timestamp: Date.now()
    };
    setErrors((prev: LivePlayError[]) => [...prev.slice(-4), error]); // Keep last 5 errors
  };

  const clearErrors = () => setErrors([]);

  // Initialize campaign data
  useEffect(() => {
    if (campaignId && !currentCampaign) {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        dispatch(setCurrentCampaign(campaign));
        setGameContext(prev => ({
          ...prev,
          campaignId,
          sessionId,
          activeCharacters: campaign.characters.map(c => c.name),
          lastUpdated: new Date()
        }));
      } else {
        navigate('/dashboard');
      }
    }
  }, [campaignId, currentCampaign, campaigns, dispatch, navigate, sessionId]);

  // Initialize Socket.IO connection with enhanced error handling
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    try {
      const newSocket = io(backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        console.log('Connected to Dundra server');
        clearErrors();
        
        // Join analysis session
        newSocket.emit('analysis:join_session', { 
          sessionId, 
          campaignId: campaignId || 'default' 
        });
      });

      newSocket.on('disconnect', (reason) => {
        setIsConnected(false);
        console.log('Disconnected from server:', reason);
        addError(`Disconnected from server: ${reason}`, 'connection');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        addError('Failed to connect to Dundra server', 'connection');
      });

      // Enhanced analysis event listeners
      newSocket.on('analysis:complete', (data: { analysisResult: AnalysisResult; context: GameContext }) => {
        console.log('Analysis complete:', data);
        setAnalysisStatus('idle');
        handleAnalysisResult(data.analysisResult);
        if (data.context) {
          setGameContext(data.context);
        }
      });

      newSocket.on('cards:generate_triggers', (data: { triggers: any[] }) => {
        console.log('Card generation triggers:', data);
        generateCardsFromTriggers(data.triggers, 'AI Analysis');
      });

      newSocket.on('cards:immediate_trigger', (data: { segment: any; actions: string[] }) => {
        console.log('Immediate card trigger:', data);
        if (data.actions.length > 0) {
          const quickCard: GeneratedCard = {
            id: `immediate_${Date.now()}`,
            type: 'environmental',
            title: 'Real-time Event',
            description: data.actions.join(', '),
            priority: 8,
            timestamp: Date.now(),
            context: 'Real-time analysis'
          };
          setGeneratedCards(prev => [...prev, quickCard]);
        }
      });

      newSocket.on('characters:updates', (data: { updates: any[] }) => {
        console.log('Character updates:', data);
        // Handle character updates here
      });

      newSocket.on('analysis:error', (data: { error: string }) => {
        console.error('Analysis error:', data.error);
        setAnalysisStatus('error');
        addError(`Analysis failed: ${data.error}`, 'analysis');
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          newSocket.emit('analysis:leave_session', { sessionId });
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      addError('Failed to initialize real-time connection', 'connection');
    }
  }, [sessionId, campaignId]);

  // Initialize game context with backend
  useEffect(() => {
    if (socket && isConnected && currentCampaign && campaignId) {
      const initializeContext = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/analysis/context/${sessionId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaignId,
              activeCharacters: currentCampaign.characters.map(c => c.name),
              currentLocation: 'Starting Location',
              ongoingQuests: [],
              gameState: 'exploration'
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const result = await response.json();
          if (result.success && result.data) {
            setGameContext(result.data);
          }
        } catch (error) {
          console.error('Failed to initialize game context:', error);
          addError('Failed to initialize game context', 'analysis');
        }
      };

      initializeContext();
    }
  }, [socket, isConnected, currentCampaign, sessionId, campaignId]);

  // Session duration timer
  useEffect(() => {
    if (isSessionActive && sessionStartTime.current) {
      durationInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime.current!) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;
        setSessionDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isSessionActive]);

  // Auto-scroll to latest card
  useEffect(() => {
    cardsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [generatedCards]);

  // Handle analysis results and update game context
  const handleAnalysisResult = (result: AnalysisResult) => {
    if (result.gameStateUpdate) {
      setGameContext(prev => ({ ...prev, ...result.gameStateUpdate }));
    }
  };

  // Generate cards from analysis triggers
  const generateCardsFromTriggers = (triggers: any[], context: string) => {
    const newCards: GeneratedCard[] = triggers.map(trigger => ({
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: trigger.type || 'scene',
      title: trigger.description || 'Generated Content',
      description: trigger.suggestedContent || trigger.context || 'AI-generated content based on gameplay',
      priority: trigger.priority || 5,
      timestamp: Date.now(),
      context: context || 'Live analysis'
    }));

    setGeneratedCards(prev => [...prev, ...newCards]);
  };

  // Start/Stop session
  const toggleSession = () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      sessionStartTime.current = null;
    } else {
      setIsSessionActive(true);
      sessionStartTime.current = Date.now();
    }
  };

  // Process manual commands
  const processCommand = async () => {
    if (!commandInput.trim() || !socket || isProcessingCommand) return;

    setIsProcessingCommand(true);
    const command = commandInput.trim();
    
    try {
      // Check if it's a card generation command
      if (command.toLowerCase().startsWith('dundra, create') || command.toLowerCase().startsWith('create')) {
        const cardType = extractCardType(command);
        const description = extractDescription(command);
        
        const newCard: GeneratedCard = {
          id: `manual_${Date.now()}`,
          type: cardType,
          title: `Manual ${cardType.charAt(0).toUpperCase() + cardType.slice(1)}`,
          description: description || `Generated ${cardType} based on manual command`,
          priority: 9,
          timestamp: Date.now(),
          context: 'Manual command'
        };

        setGeneratedCards(prev => [...prev, newCard]);
      }
    } catch (error) {
      console.error('Error processing command:', error);
    } finally {
      setCommandInput('');
      setIsProcessingCommand(false);
    }
  };

  // Extract card type from command
  const extractCardType = (command: string): GeneratedCard['type'] => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('npc') || lowerCommand.includes('character')) return 'npc';
    if (lowerCommand.includes('location') || lowerCommand.includes('place')) return 'location';
    if (lowerCommand.includes('item') || lowerCommand.includes('object')) return 'item';
    if (lowerCommand.includes('quest') || lowerCommand.includes('hook')) return 'plot_hook';
    return 'scene';
  };

  // Extract description from command
  const extractDescription = (command: string): string => {
    const patterns = [
      /create (?:an? |the )?(.+)/i,
      /dundra,? create (?:an? |the )?(.+)/i
    ];
    
    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return command;
  };

  // Get card icon
  const getCardIcon = (type: GeneratedCard['type']) => {
    switch (type) {
      case 'npc': return '👤';
      case 'location': return '🏰';
      case 'item': return '⚔️';
      case 'plot_hook': return '📜';
      case 'scene': return '🎭';
      default: return '🃏';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: GeneratedCard['priority']) => {
    switch (priority) {
      case 9: return 'border-red-500 bg-red-50';
      case 8: return 'border-yellow-500 bg-yellow-50';
      case 5: return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  if (!currentCampaign) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Campaign Not Found</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col bg-dark-900">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white font-fantasy">
              {currentCampaign.name} - Live Play
            </h1>
            <p className="text-dark-400 mt-1">
              Real-time D&D companion with AI analysis and card generation
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
            <button
              onClick={toggleSession}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isSessionActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isSessionActive ? '⏹️ End Session' : '▶️ Start Session'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        {/* Main Content - Audio and Cards */}
        <div className="lg:col-span-3 flex flex-col space-y-6 min-h-0">
          {/* Audio Transcription */}
          <div className="flex-1">
            <AudioCapture 
              campaignId={campaignId}
              sessionId={sessionId}
              autoStart={isSessionActive}
              className="h-full"
            />
          </div>

          {/* Command Input */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-3">Manual Commands</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && processCommand()}
                placeholder="Try: 'Dundra, create an NPC' or 'Create a mystical sword'"
                className="flex-1 input-field"
                disabled={isProcessingCommand}
              />
              <button
                onClick={processCommand}
                disabled={!commandInput.trim() || isProcessingCommand}
                className="btn-primary"
              >
                {isProcessingCommand ? '...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Generated Cards */}
          <div className="card flex-1">
            <h3 className="text-lg font-semibold text-white mb-4">
              Generated Cards ({generatedCards.length})
            </h3>
            <div className="h-64 overflow-y-auto space-y-3">
              {generatedCards.length === 0 ? (
                <div className="text-center text-dark-500 py-8">
                  <div className="w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-xl">🃏</span>
                  </div>
                  <p>Cards will appear here during gameplay</p>
                  <p className="text-xs mt-2">
                    AI will automatically generate content based on your conversation
                  </p>
                </div>
              ) : (
                generatedCards.map((card, index) => (
                  <div
                    key={card.id}
                    className={`border-l-4 p-4 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-lg ${getPriorityColor(card.priority)}`}
                    onClick={() => setSelectedCard(card)}
                    style={{
                      animation: `slideIn 0.5s ease-out ${index * 0.1}s both`
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getCardIcon(card.type)}</span>
                        <div>
                          <h4 className="font-semibold text-dark-900">{card.title}</h4>
                          <p className="text-sm text-dark-600 line-clamp-2">{card.description}</p>
                          <div className="flex items-center space-x-2 mt-2 text-xs text-dark-500">
                            <span className="capitalize">{card.type}</span>
                            <span>•</span>
                            <span>{new Date(card.timestamp).toLocaleTimeString()}</span>
                            <span>•</span>
                            <span className="capitalize">{card.priority}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={cardsEndRef} />
            </div>
          </div>
        </div>

        {/* Sidebar - Session Info & Characters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Session Info */}
          <div className="card">
            <h3 className="card-header">Session Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-300">Status</span>
                <span className={`text-sm font-medium ${isSessionActive ? 'text-green-400' : 'text-dark-400'}`}>
                  {isSessionActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-300">Duration</span>
                <span className="text-primary-400 font-mono">{sessionDuration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-300">Location</span>
                <span className="text-primary-400 text-sm">{gameContext.currentLocation || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-300">Cards</span>
                <span className="text-primary-400">{generatedCards.length}</span>
              </div>
            </div>
          </div>

          {/* Active Characters */}
          <div className="card">
            <h3 className="card-header">Characters</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentCampaign.characters.map((character) => (
                <div key={character.id} className="bg-dark-800 rounded-lg p-3">
                  <h4 className="font-semibold text-white text-sm">{character.name}</h4>
                  <p className="text-xs text-dark-400">
                    {character.race} {character.class} (Level {character.level})
                  </p>
                  <p className="text-xs text-dark-500 mt-1">
                    Player: {character.playerName}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Key Events */}
          {gameContext.recentEvents.length > 0 && (
            <div className="card">
              <h3 className="card-header">Recent Events</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {gameContext.recentEvents.slice(-3).map((event, index) => (
                  <div key={index} className="text-xs text-dark-400 bg-dark-800 rounded p-2">
                    {event}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card">
            <h3 className="card-header">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-2">
              <button className="btn-secondary text-sm">🎲 Roll Dice</button>
              <button className="btn-secondary text-sm">📝 Add Note</button>
              <button className="btn-secondary text-sm">🗺️ Show Map</button>
              <button 
                onClick={() => setGeneratedCards([])}
                className="btn-secondary text-sm"
              >
                🗑️ Clear Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getCardIcon(selectedCard.type)}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedCard.title}</h3>
                    <p className="text-sm text-gray-600 capitalize">{selectedCard.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 text-sm">{selectedCard.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Priority:</span>
                    <span className="ml-2 capitalize">{selectedCard.priority}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Generated:</span>
                    <span className="ml-2">{new Date(selectedCard.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600 text-sm">Context:</span>
                  <p className="text-gray-500 text-xs mt-1">{selectedCard.context}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default LivePlay;
