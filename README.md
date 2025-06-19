# Dundra - AI-Powered D&D Companion

Dundra is an innovative application that enhances tabletop D&D gameplay by listening to live sessions and generating immersive visual content. The app captures audio during gameplay, transcribes conversations, and uses AI to create personalized character images and descriptive cards of key moments.

## Features

- **Live Audio Transcription**: Real-time capture and transcription of D&D sessions
- **Speaker Attribution**: Identifies who is speaking (players vs DM)
- **Character Sheet Integration**: Upload and parse character sheets
- **AI-Powered Image Generation**: Creates personalized images of players as their characters
- **Descriptive Cards**: Generates rich text descriptions of locations, NPCs, and key moments
- **Campaign Management**: Save, load, and review campaign sessions
- **Character Tracking**: Monitor character stats, inventory, and status changes

## Project Structure

```
dundra/
├── frontend/          # React-based web application
├── backend/           # Node.js/Express API server
├── shared/            # Shared utilities and types
├── docs/              # Project documentation
├── .taskmaster/       # Task management files
└── README.md
```

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Database**: MongoDB (flexible schema for D&D data)
- **Audio Processing**: Web Audio API + Speech-to-Text services
- **AI Integration**: OpenAI GPT for analysis, DALL-E for image generation
- **Development**: ESLint, Prettier, Jest for testing

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- API keys for OpenAI services

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd dundra

# Install dependencies
npm run install:all

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development servers
npm run dev
```

## Development

This project uses a monorepo structure with separate frontend and backend applications.

- `npm run dev` - Start both frontend and backend in development mode
- `npm run test` - Run tests for both applications
- `npm run lint` - Run linting for the entire project
- `npm run build` - Build both applications for production

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

See the `.taskmaster/tasks/` directory for detailed development tasks and progress tracking. 