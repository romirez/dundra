import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-fantasy">Dashboard</h1>
        <p className="text-dark-400 mt-2">Welcome to your D&D campaign management hub</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="card-header">Quick Actions</h2>
          <div className="space-y-3">
            <button className="btn-primary w-full">Create New Campaign</button>
            <button className="btn-secondary w-full">Join Existing Campaign</button>
            <button className="btn-secondary w-full">Import Character Sheets</button>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="card">
          <h2 className="card-header">Recent Campaigns</h2>
          <div className="space-y-3">
            <div className="p-3 bg-dark-700 rounded border border-dark-600">
              <h3 className="font-medium text-white">The Dragon's Hoard</h3>
              <p className="text-sm text-dark-400">Last played 2 days ago</p>
            </div>
            <div className="p-3 bg-dark-700 rounded border border-dark-600">
              <h3 className="font-medium text-white">Curse of Strahd</h3>
              <p className="text-sm text-dark-400">Last played 1 week ago</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="card">
          <h2 className="card-header">Campaign Stats</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-dark-300">Total Campaigns</span>
                <span className="text-primary-400 font-semibold">2</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-dark-300">Active Players</span>
                <span className="text-primary-400 font-semibold">8</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center">
                <span className="text-dark-300">Sessions Played</span>
                <span className="text-primary-400 font-semibold">24</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 