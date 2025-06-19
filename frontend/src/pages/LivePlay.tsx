import React from 'react';
import { useParams } from 'react-router-dom';

const LivePlay: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8 h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white font-fantasy">Live Play Session</h1>
        <p className="text-dark-400 mt-2">Real-time D&D companion with transcription and card generation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Audio Controls & Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card">
            <h2 className="card-header">Audio Control</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <button className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white text-2xl shadow-glow">
                  🎤
                </button>
              </div>
              <div className="text-center">
                <p className="text-sm text-dark-400">Click to start recording</p>
                <p className="text-xs text-dark-500 mt-1">Session: Not Started</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="card-header">Session Info</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-300">Duration</span>
                <span className="text-primary-400">00:00:00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-300">Players</span>
                <span className="text-primary-400">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-300">Cards Generated</span>
                <span className="text-primary-400">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Transcription */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="card-header">Live Transcription</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="text-center text-dark-500 py-8">
                <p>Start recording to see live transcription</p>
              </div>
            </div>
          </div>
        </div>

        {/* Generated Cards */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="card-header">Generated Cards</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="text-center text-dark-500 py-8">
                <div className="w-12 h-12 bg-dark-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">🃏</span>
                </div>
                <p>Cards will appear here during gameplay</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePlay; 