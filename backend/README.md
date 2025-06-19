# Dundra Backend API

Node.js/Express backend API for the Dundra D&D companion application with real-time features.

## 🚀 Features

- **RESTful API** - Express.js with TypeScript
- **Real-time Communication** - Socket.io for live session updates
- **Authentication** - JWT-based auth with bcrypt password hashing
- **Database** - MongoDB with Mongoose ODM
- **Security** - Helmet.js, CORS, input validation
- **File Upload** - Multer for character sheet uploads
- **Development Tools** - Hot reload, TypeScript compilation

## 📁 Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.ts  # MongoDB connection
│   └── env.ts       # Environment variables
├── controllers/     # Request handlers
├── middleware/      # Custom middleware (auth, validation)
├── models/          # Mongoose schemas
├── routes/          # Express route definitions
├── services/        # Business logic
├── utils/           # Utility functions
├── types/           # TypeScript interfaces
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- npm 8+
- MongoDB (local or cloud)

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file in the backend directory:

   ```env
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/dundra
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:5173
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=10485760
   ```

3. **Start MongoDB:**
   - Local: `mongod` or use MongoDB Compass
   - Cloud: Use MongoDB Atlas connection string

### Development

```bash
# Development server with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Clean build directory
npm run clean
```

## 🔗 API Endpoints

### Health Check

- `GET /health` - Server health status

### Authentication (Future)

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Campaigns (Future)

- `GET /api/v1/campaigns` - List user's campaigns
- `POST /api/v1/campaigns` - Create new campaign
- `GET /api/v1/campaigns/:id` - Get campaign details
- `PUT /api/v1/campaigns/:id` - Update campaign
- `DELETE /api/v1/campaigns/:id` - Delete campaign

### Characters (Future)

- `GET /api/v1/characters` - List characters
- `POST /api/v1/characters` - Create character
- `PUT /api/v1/characters/:id` - Update character
- `DELETE /api/v1/characters/:id` - Delete character

### Sessions (Future)

- `GET /api/v1/sessions/:campaignId` - List campaign sessions
- `POST /api/v1/sessions` - Create new session
- `PUT /api/v1/sessions/:id` - Update session

## 🔌 Socket.io Events

### Connection Events

- `join-campaign` - Join a campaign room
- `leave-campaign` - Leave a campaign room
- `user-joined` - Broadcast when user joins
- `user-left` - Broadcast when user leaves

### Transcription Events

- `transcription-start` - Start recording
- `transcription-stop` - Stop recording
- `new-transcription` - New transcription entry
- `transcription-update` - Broadcast transcription

### Card Generation Events

- `card-generated` - New card generated
- `new-card` - Broadcast new card to campaign

## 🗄️ Database Schema

### User

```typescript
{
  email: string;
  password: string; // hashed
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Campaign

```typescript
{
  name: string;
  description: string;
  dmId: ObjectId;
  players: ObjectId[];
  characters: ObjectId[];
  sessions: ObjectId[];
  settings: {
    maxPlayers: number;
    isPublic: boolean;
    allowSpectators: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Character

```typescript
{
  name: string;
  playerName: string;
  playerId: ObjectId;
  campaignId: ObjectId;
  class: string;
  level: number;
  race: string;
  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  // ... additional D&D character properties
}
```

## 🔐 Authentication

JWT-based authentication with the following flow:

1. User registers/logs in with email/password
2. Server validates credentials and returns JWT token
3. Client stores token and includes in Authorization header
4. Server validates token on protected routes
5. Token expires after configured time (default: 7 days)

## 🚦 Development Status

### ✅ Completed

- [x] Project structure and TypeScript setup
- [x] Express app configuration with middleware
- [x] Socket.io integration for real-time features
- [x] Environment configuration and validation
- [x] Database connection setup
- [x] Authentication middleware
- [x] Health check endpoint
- [x] Development scripts and hot reload

### 🔄 In Progress

- [ ] User authentication routes
- [ ] Campaign management API
- [ ] Character management API
- [ ] Session management API
- [ ] File upload handling
- [ ] Database models/schemas

### 📋 Planned

- [ ] Input validation middleware
- [ ] Error handling improvements
- [ ] API documentation (Swagger)
- [ ] Unit and integration tests
- [ ] Rate limiting
- [ ] Logging improvements
- [ ] Performance monitoring

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Environment Variables (Production)

Ensure these are set in production:

- `NODE_ENV=production`
- `JWT_SECRET` (strong, unique secret)
- `MONGODB_URI` (production database)
- `CORS_ORIGIN` (production frontend URL)

### Docker (Future)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use meaningful commit messages
3. Add JSDoc comments for functions
4. Update README for new features
5. Ensure all tests pass

## 📝 License

MIT License - see LICENSE file for details.
