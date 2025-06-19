import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AudioService, type SpeakerMapping, type TranscriptionResult } from '../services/audioService';
import {
    addSpeakerMapping,
    addTranscription,
    setAudioStatus
} from '../store/slices/gameSlice';
import type { RootState } from '../store/store';

interface AudioCaptureProps {
  campaignId?: string;
  sessionId?: string;
  autoStart?: boolean;
  className?: string;
}

interface DetectedSpeaker {
  id: string;
  name?: string;
  lastActive: number;
}

const AudioCapture: React.FC<AudioCaptureProps> = ({
  campaignId,
  sessionId,
  autoStart = false,
  className = '',
}) => {
  const dispatch = useDispatch();
  const { transcriptions, speakerMappings, audioStatus } = useSelector(
    (state: RootState) => state.game
  );

  const audioServiceRef = useRef<AudioService | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('Not initialized');
  const [error, setError] = useState<string | null>(null);
  const [detectedSpeakers, setDetectedSpeakers] = useState<DetectedSpeaker[]>([]);
  const [showSpeakerMapping, setShowSpeakerMapping] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Initialize audio service
  useEffect(() => {
    const websocketUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3001'}/audio`;
    audioServiceRef.current = new AudioService(websocketUrl);

    // Set up event handlers
    audioServiceRef.current.onTranscription(handleTranscription);
    audioServiceRef.current.onError(handleError);
    audioServiceRef.current.onStatusChange(handleStatusChange);
    audioServiceRef.current.onSpeakerDetected(handleSpeakerDetected);

    // Auto-start if requested
    if (autoStart) {
      startRecording();
    }

    // Cleanup on unmount
    return () => {
      audioServiceRef.current?.dispose();
    };
  }, [campaignId, sessionId]);

  // Audio level monitoring
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      if (audioServiceRef.current) {
        setAudioLevel(audioServiceRef.current.getAudioLevel());
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle transcription results
  const handleTranscription = useCallback((result: TranscriptionResult) => {
    dispatch(addTranscription({
      text: result.text,
      confidence: result.confidence,
      speakerId: result.speakerId,
      timestamp: result.timestamp,
      isFinal: result.isFinal,
      campaignId,
      sessionId,
    }));
  }, [dispatch, campaignId, sessionId]);

  // Handle errors
  const handleError = useCallback((error: Error) => {
    setError(error.message);
    dispatch(setAudioStatus({ status: 'error', message: error.message }));
  }, [dispatch]);

  // Handle status changes
  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    setIsRecording(audioServiceRef.current?.isCurrentlyRecording || false);
    setIsConnected(audioServiceRef.current?.isWebSocketConnected || false);
    dispatch(setAudioStatus({ status: newStatus }));
  }, [dispatch]);

  // Handle speaker detection
  const handleSpeakerDetected = useCallback((speakerId: string) => {
    setDetectedSpeakers(prev => {
      const existing = prev.find(speaker => speaker.id === speakerId);
      if (existing) {
        return prev.map(speaker =>
          speaker.id === speakerId
            ? { ...speaker, lastActive: Date.now() }
            : speaker
        );
      } else {
        return [...prev, { id: speakerId, lastActive: Date.now() }];
      }
    });

    // Show speaker mapping dialog if this is a new speaker
    const existingMapping = speakerMappings.find(mapping => mapping.speakerId === speakerId);
    if (!existingMapping) {
      setShowSpeakerMapping(true);
    }
  }, [speakerMappings]);

  // Start recording
  const startRecording = async () => {
    if (!audioServiceRef.current) return;

    try {
      setError(null);
      await audioServiceRef.current.startRecording();
    } catch (error) {
      handleError(error as Error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (!audioServiceRef.current) return;
    audioServiceRef.current.stopRecording();
  };

  // Pause recording
  const pauseRecording = () => {
    if (!audioServiceRef.current) return;
    audioServiceRef.current.pauseRecording();
  };

  // Resume recording
  const resumeRecording = () => {
    if (!audioServiceRef.current) return;
    audioServiceRef.current.resumeRecording();
  };

  // Map speaker to player name
  const mapSpeaker = async (speakerId: string, playerName: string) => {
    if (!audioServiceRef.current) return;

    try {
      await audioServiceRef.current.updateSpeakerMapping(speakerId, playerName);
      dispatch(addSpeakerMapping({
        speakerId,
        playerName,
        isActive: true,
      }));
      
      // Update detected speakers with name
      setDetectedSpeakers(prev =>
        prev.map(speaker =>
          speaker.id === speakerId
            ? { ...speaker, name: playerName }
            : speaker
        )
      );
    } catch (error) {
      handleError(error as Error);
    }
  };

  // Get status color
  const getStatusColor = () => {
    if (error) return 'text-red-600';
    if (isRecording) return 'text-green-600';
    if (isConnected) return 'text-blue-600';
    return 'text-gray-600';
  };

  // Get record button color
  const getRecordButtonColor = () => {
    if (isRecording) return 'bg-red-600 hover:bg-red-700';
    return 'bg-green-600 hover:bg-green-700';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Audio Transcription</h3>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {status}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          className={`px-4 py-2 text-white font-medium rounded-md transition-colors ${getRecordButtonColor()}`}
          disabled={!!error}
        >
          {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
        </button>

        {isRecording && (
          <>
            <button
              onClick={pauseRecording}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md transition-colors"
            >
              ⏸️ Pause
            </button>
            <button
              onClick={resumeRecording}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              ▶️ Resume
            </button>
          </>
        )}

        <button
          onClick={() => setShowSpeakerMapping(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition-colors"
          disabled={detectedSpeakers.length === 0}
        >
          👥 Map Speakers
        </button>
      </div>

      {/* Audio Level Indicator */}
      {isRecording && (
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Audio Level:</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-100"
                style={{ width: `${Math.min(audioLevel, 100)}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{Math.round(audioLevel)}%</span>
          </div>
        </div>
      )}

      {/* Detected Speakers */}
      {detectedSpeakers.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Speakers:</h4>
          <div className="flex flex-wrap gap-2">
            {detectedSpeakers.map(speaker => (
              <span
                key={speaker.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {speaker.name || `Speaker ${speaker.id}`}
                {Date.now() - speaker.lastActive < 5000 && (
                  <span className="ml-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transcriptions */}
      <div className="max-h-48 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Transcriptions:</h4>
        <div className="space-y-2">
          {transcriptions.slice(-5).map((transcription, index) => (
            <div
              key={transcription.id || index}
              className={`p-2 rounded text-sm ${
                transcription.isFinal
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="flex-1">
                  {transcription.text}
                </span>
                <div className="ml-2 text-xs text-gray-500 flex flex-col items-end">
                  <span>{Math.round(transcription.confidence * 100)}%</span>
                  {transcription.speakerId && (
                    <span className="text-blue-600">
                      {speakerMappings.find((mapping: SpeakerMapping) => mapping.speakerId === transcription.speakerId)?.playerName || 
                       `Speaker ${transcription.speakerId}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {transcriptions.length === 0 && (
            <div className="text-sm text-gray-500 italic">
              No transcriptions yet. Start recording to see transcribed speech here.
            </div>
          )}
        </div>
      </div>

      {/* Speaker Mapping Modal */}
      {showSpeakerMapping && (
        <SpeakerMappingModal
          detectedSpeakers={detectedSpeakers}
          existingMappings={speakerMappings}
          onMapSpeaker={mapSpeaker}
          onClose={() => setShowSpeakerMapping(false)}
        />
      )}
    </div>
  );
};

// Speaker Mapping Modal Component
interface SpeakerMappingModalProps {
  detectedSpeakers: DetectedSpeaker[];
  existingMappings: SpeakerMapping[];
  onMapSpeaker: (speakerId: string, playerName: string) => void;
  onClose: () => void;
}

const SpeakerMappingModal: React.FC<SpeakerMappingModalProps> = ({
  detectedSpeakers,
  existingMappings,
  onMapSpeaker,
  onClose,
}) => {
  const [mappings, setMappings] = useState<{ [speakerId: string]: string }>({});

  useEffect(() => {
    // Initialize with existing mappings
    const initialMappings: { [speakerId: string]: string } = {};
    existingMappings.forEach((mapping: SpeakerMapping) => {
      initialMappings[mapping.speakerId] = mapping.playerName;
    });
    setMappings(initialMappings);
  }, [existingMappings]);

  const handleSave = () => {
    Object.entries(mappings).forEach(([speakerId, playerName]) => {
      if (playerName.trim()) {
        onMapSpeaker(speakerId, playerName.trim());
      }
    });
    onClose();
  };

  const updateMapping = (speakerId: string, playerName: string) => {
    setMappings(prev => ({
      ...prev,
      [speakerId]: playerName,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
        <h3 className="text-lg font-semibold mb-4">Map Speakers to Players</h3>
        
        <div className="space-y-4 mb-6">
          {detectedSpeakers.map(speaker => (
            <div key={speaker.id} className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700 w-20">
                Speaker {speaker.id}:
              </span>
              <input
                type="text"
                value={mappings[speaker.id] || ''}
                onChange={(e) => updateMapping(speaker.id, e.target.value)}
                placeholder="Enter player name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Mappings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioCapture; 