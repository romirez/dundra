import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { addCampaign } from '../store/slices/campaignSlice';

// D&D 5e Classes and Races
const D5E_CLASSES = [
  'Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
];

const D5E_RACES = [
  'Dragonborn', 'Dwarf', 'Elf', 'Gnome', 'Half-Elf', 'Half-Orc', 
  'Halfling', 'Human', 'Tiefling'
];

const D5E_BACKGROUNDS = [
  'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier'
];

const ABILITY_SCORES = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];

const SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 'History',
  'Insight', 'Intimidation', 'Investigation', 'Medicine', 'Nature', 'Perception',
  'Performance', 'Persuasion', 'Religion', 'Sleight of Hand', 'Stealth', 'Survival'
];

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
}

interface CampaignFormData {
  name: string;
  description: string;
  setting: string;
  maxPlayers: number;
  characters: Character[];
}

const CampaignSetup: React.FC = () => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCharacterIndex, setSelectedCharacterIndex] = useState<number | null>(null);

  const { 
    register, 
    handleSubmit, 
    control, 
    watch, 
    formState: { errors },
    setValue,
    getValues
  } = useForm<CampaignFormData>({
    defaultValues: {
      name: '',
      description: '',
      setting: 'Forgotten Realms',
      maxPlayers: 6,
      characters: []
    }
  });

  const { fields: characters, append: addCharacter, remove: removeCharacter, update: updateCharacter } = useFieldArray({
    control,
    name: 'characters'
  });

  const handleAddCharacter = () => {
    const newCharacter: Character = {
      id: `char_${Date.now()}`,
      name: '',
      playerName: '',
      class: '',
      race: '',
      level: 1,
      background: '',
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      skills: [],
      equipment: [],
      spells: [],
      notes: ''
    };
    addCharacter(newCharacter);
    setSelectedCharacterIndex(characters.length);
  };

  const onSubmit = (data: CampaignFormData) => {
    const campaign = {
      id: `campaign_${Date.now()}`,
      name: data.name,
      description: data.description,
      dmId: 'current_user', // This would come from auth in a real app
      characters: data.characters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    dispatch(addCampaign(campaign));
    alert('Campaign created successfully!');
  };

  const renderCampaignForm = () => (
    <div className="card">
      <h2 className="card-header">Campaign Configuration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
              <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Campaign Name *
                </label>
                <input
              {...register('name', { required: 'Campaign name is required' })}
              type="text"
              className="input-field w-full"
              placeholder="Enter campaign name"
                />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
              </div>
              <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                <textarea
              {...register('description')}
              className="input-field w-full"
                  rows={4}
              placeholder="Describe your campaign..."
                />
              </div>
            </div>
        <div className="space-y-4">
              <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Max Players</label>
                <input
              {...register('maxPlayers', { min: 1, max: 8 })}
              type="number"
              className="input-field w-full"
              min="1"
              max="8"
                />
              </div>
              <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
                  Campaign Setting
                </label>
            <select {...register('setting')} className="input-field w-full">
              <option value="Forgotten Realms">Forgotten Realms</option>
              <option value="Eberron">Eberron</option>
              <option value="Ravenloft">Ravenloft</option>
              <option value="Custom Setting">Custom Setting</option>
                </select>
              </div>
            </div>
          </div>
        </div>
  );

  const renderCharacterList = () => (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="card-header">Characters ({characters.length})</h2>
        <button
          type="button"
          onClick={handleAddCharacter}
          className="btn-primary"
        >
          + Add Character
        </button>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">👤</span>
          </div>
          <p className="text-dark-400 mb-4">No characters added yet</p>
          <button
            type="button"
            onClick={handleAddCharacter}
            className="btn-primary"
          >
            Add First Character
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character, index) => (
            <div
              key={character.id || index}
              className="bg-dark-800 rounded-lg p-4 border border-dark-600 cursor-pointer hover:border-primary-500 transition-colors"
              onClick={() => setSelectedCharacterIndex(index)}
            >
              <h3 className="font-semibold text-white mb-2">
                {character.name || 'Unnamed Character'}
              </h3>
              <p className="text-sm text-dark-400">
                Player: {character.playerName || 'No player assigned'}
              </p>
              <p className="text-sm text-dark-400">
                {character.race} {character.class} (Level {character.level})
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeCharacter(index);
                }}
                className="mt-2 text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCharacterForm = () => {
    if (selectedCharacterIndex === null) return null;

    const character = characters[selectedCharacterIndex];
    
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="card-header">
            Character Details - {character.name || 'New Character'}
          </h2>
          <button
            type="button"
            onClick={() => setSelectedCharacterIndex(null)}
            className="text-dark-400 hover:text-white"
          >
            ← Back to List
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Character Name *
              </label>
              <input
                {...register(`characters.${selectedCharacterIndex}.name`, { required: true })}
                type="text"
                className="input-field w-full"
                placeholder="Enter character name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Player Name *
              </label>
              <input
                {...register(`characters.${selectedCharacterIndex}.playerName`, { required: true })}
                type="text"
                className="input-field w-full"
                placeholder="Enter player name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Class *</label>
              <select
                {...register(`characters.${selectedCharacterIndex}.class`, { required: true })}
                className="input-field w-full"
              >
                <option value="">Select a class</option>
                {D5E_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Race *</label>
              <select
                {...register(`characters.${selectedCharacterIndex}.race`, { required: true })}
                className="input-field w-full"
              >
                <option value="">Select a race</option>
                {D5E_RACES.map(race => (
                  <option key={race} value={race}>{race}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Level</label>
              <input
                {...register(`characters.${selectedCharacterIndex}.level`, { min: 1, max: 20 })}
                type="number"
                className="input-field w-full"
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Background</label>
              <select
                {...register(`characters.${selectedCharacterIndex}.background`)}
                className="input-field w-full"
              >
                <option value="">Select background</option>
                {D5E_BACKGROUNDS.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Ability Scores */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Ability Scores</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {ABILITY_SCORES.map(ability => (
                <div key={ability}>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    {ability}
                  </label>
                  <input
                    {...register(`characters.${selectedCharacterIndex}.abilityScores.${ability.toLowerCase()}` as any, { 
                      min: 1, 
                      max: 20,
                      valueAsNumber: true 
                    })}
                    type="number"
                    className="input-field w-full"
                    min="1"
                    max="20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Character Notes
            </label>
            <textarea
              {...register(`characters.${selectedCharacterIndex}.notes`)}
              className="input-field w-full"
              rows={4}
              placeholder="Add character background, personality traits, equipment, etc."
            />
          </div>
        </div>
      </div>
    );
  };

  const steps = [
    { number: 1, title: 'Campaign Info', component: renderCampaignForm },
    { number: 2, title: 'Characters', component: renderCharacterList },
    { number: 3, title: 'Character Details', component: renderCharacterForm }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white font-fantasy">Campaign Setup</h1>
        <p className="text-dark-400 mt-2">Configure your campaign settings and character sheets</p>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-4">
          {steps.map((step) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setCurrentStep(step.number)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                currentStep === step.number
                  ? 'bg-primary-600 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              }`}
            >
              {step.number}. {step.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto">
        <div className="space-y-6">
          {currentStep === 1 && renderCampaignForm()}
          {currentStep === 2 && renderCharacterList()}
          {currentStep === 3 && selectedCharacterIndex !== null && renderCharacterForm()}
        </div>

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            className="btn-secondary"
            disabled={currentStep === 1}
          >
            Previous
          </button>
          
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
              className="btn-primary"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="btn-primary"
            >
              Create Campaign
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CampaignSetup;
