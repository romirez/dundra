import React from 'react';
import { useParams } from 'react-router-dom';

const CampaignSetup: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-fantasy">Campaign Setup</h1>
        <p className="text-dark-400 mt-2">Configure your campaign settings and character sheets</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="card">
          <h2 className="card-header">Campaign Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Enter campaign name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Description
                </label>
                <textarea
                  className="input-field w-full"
                  rows={4}
                  placeholder="Describe your campaign..."
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Max Players
                </label>
                <input
                  type="number"
                  className="input-field w-full"
                  placeholder="6"
                  min="1"
                  max="8"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Campaign Setting
                </label>
                <select className="input-field w-full">
                  <option>Forgotten Realms</option>
                  <option>Eberron</option>
                  <option>Custom Setting</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-6">
          <h2 className="card-header">Character Sheet Management</h2>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📄</span>
            </div>
            <p className="text-dark-400 mb-4">Upload character sheets to get started</p>
            <button className="btn-primary">Upload Character Sheets</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignSetup; 