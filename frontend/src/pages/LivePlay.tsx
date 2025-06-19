import React, { useState } from 'react';
import AudioCapture from '../components/AudioCapture';

const LivePlay: React.FC = () => {
  const [sessionDuration, setSessionDuration] = useState('00:00:00');
  const [playerCount] = useState(4);
  const [cardsGenerated] = useState(0);

  // Mock campaign and session IDs - in a real app these would come from props or routing
  const campaignId = 'demo-campaign';
  const sessionId = 'demo-session';

  return (
    <div className='p-8 h-full'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-white font-fantasy'>Live Play Session</h1>
        <p className='text-dark-400 mt-2'>
          Real-time D&D companion with transcription and card generation
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 h-full'>
        {/* Audio Transcription */}
        <div className='lg:col-span-2'>
          <AudioCapture 
            campaignId={campaignId}
            sessionId={sessionId}
            autoStart={false}
            className="h-full"
          />
        </div>

        {/* Session Info & Generated Cards */}
        <div className='lg:col-span-1 space-y-6'>
          <div className='card'>
            <h2 className='card-header'>Session Info</h2>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-dark-300'>Duration</span>
                <span className='text-primary-400'>{sessionDuration}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-dark-300'>Players</span>
                <span className='text-primary-400'>{playerCount}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-dark-300'>Cards Generated</span>
                <span className='text-primary-400'>{cardsGenerated}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-dark-300'>Campaign</span>
                <span className='text-primary-400 text-sm truncate'>{campaignId}</span>
              </div>
            </div>
          </div>

          <div className='card h-full'>
            <h2 className='card-header'>Generated Cards</h2>
            <div className='space-y-3 max-h-96 overflow-y-auto'>
              <div className='text-center text-dark-500 py-8'>
                <div className='w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center mx-auto mb-3'>
                  <span className='text-xl'>🃏</span>
                </div>
                <p>Cards will appear here during gameplay</p>
                <p className='text-xs mt-2'>
                  AI will automatically generate NPCs, locations, and items based on your conversation
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='mt-6 flex flex-wrap gap-4'>
        <button className='btn-secondary'>
          🎲 Roll Dice
        </button>
        <button className='btn-secondary'>
          📝 Add Note
        </button>
        <button className='btn-secondary'>
          🗺️ Generate Map
        </button>
        <button className='btn-secondary'>
          👥 Manage Players
        </button>
      </div>
    </div>
  );
};

export default LivePlay;
