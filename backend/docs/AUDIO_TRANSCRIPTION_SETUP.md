# Audio Transcription Setup Guide

This guide explains how to set up Google Cloud Speech-to-Text for real-time audio transcription in Dundra.

## Prerequisites

1. **Google Cloud Project**: You need a Google Cloud project with the Speech-to-Text API enabled
2. **Authentication**: Either an API key (recommended for development) or service account key file

## Google Cloud Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Speech-to-Text API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Cloud Speech-to-Text API"
3. Click "Enable"

## Authentication Setup

Choose one of the following authentication methods:

### Option A: API Key (Recommended for Development)

This is the simplest method for development and testing.

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API key"
3. Copy the generated API key
4. (Optional) Click "Restrict key" to limit it to Speech-to-Text API only
5. Add to your `.env` file:
   ```bash
   GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
   GOOGLE_CLOUD_API_KEY=your-api-key-here
   ```

### Option B: Service Account Key File (Production/Advanced)

This method provides more granular permissions and is better for production.

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `dundra-transcription`
4. Description: `Service account for Dundra audio transcription`
5. Click "Create and Continue"
6. Grant role: `Cloud Speech Client`
7. Click "Done"
8. Click on the service account, go to "Keys" tab
9. Click "Add Key" > "Create new key" > "JSON"
10. Download and save the key file securely
11. Add to your `.env` file:
    ```bash
    GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
    GOOGLE_CLOUD_KEY_FILE=./config/google-cloud-key.json
    ```

### Option C: Application Default Credentials

If you have the Google Cloud CLI installed:

1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
2. Run: `gcloud auth application-default login`
3. Set only the project ID:
   ```bash
   GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
   ```

## Environment Configuration

The system will automatically detect and use the available authentication method in this order:
1. API Key (`GOOGLE_CLOUD_API_KEY`)
2. Service Account Key File (`GOOGLE_CLOUD_KEY_FILE`)
3. Application Default Credentials

**Required environment variables:**
```bash
# Google Cloud Speech-to-Text Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here

# Choose ONE of the following authentication methods:
GOOGLE_CLOUD_API_KEY=your-api-key-here                    # Option A (Recommended)
# OR
GOOGLE_CLOUD_KEY_FILE=./config/google-cloud-key.json      # Option B
```

**Important**: Never commit API keys or service account key files to version control!

## Testing the Setup

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Look for one of these log messages:
   ```
   ✅ Using Google Cloud API key for authentication
   ☁️  Google Cloud Speech-to-Text configured with API key
   ```
   
   Or:
   ```
   ✅ Using Google Cloud service account key file for authentication
   ☁️  Google Cloud Speech-to-Text configured with service account key file
   ```

3. If you see warnings, check your configuration:
   ```
   ⚠️  Google Cloud Speech-to-Text not configured
   ⚠️  No Google Cloud credentials found
   ```

## Frontend Configuration

The frontend connects to the transcription service via WebSocket:

```bash
# frontend/.env
VITE_WS_URL=ws://localhost:3001
```

## Features

The audio transcription service provides:

- **Real-time transcription**: Speech is transcribed as you speak
- **Speaker diarization**: Distinguishes between different speakers (DM vs players)
- **High accuracy**: Optimized for conversational speech
- **D&D vocabulary**: Enhanced recognition for D&D-specific terms
- **Noise robustness**: Works well in gaming environments

## Pricing

Google Cloud Speech-to-Text pricing (as of 2024):
- Standard model: $0.006 per 15 seconds
- Enhanced model: $0.009 per 15 seconds  
- Speaker diarization: +$0.0005 per 15 seconds

For a typical 4-hour D&D session with enhanced model + diarization:
- Cost: ~$2.76 per session
- Monthly cost (4 sessions): ~$11.04

## Troubleshooting

### "Authentication failed" errors
- **API Key**: Verify the key is correct and has Speech-to-Text API access
- **Service Account**: Check file path and permissions
- Ensure the Speech-to-Text API is enabled in your project

### "Project not found" errors
- Verify your project ID is correct
- Check that the project exists and is active
- Ensure billing is enabled for the project

### WebSocket connection issues
- Ensure the backend server is running
- Check firewall settings
- Verify CORS configuration

### Poor transcription quality
- Check microphone permissions in browser
- Ensure good audio quality (minimal background noise)
- Verify sample rate settings (16kHz recommended)

## Development Mode

For development without Google Cloud setup, the service will log warnings but won't crash. Audio capture will work, but transcription will not be available.

## Security Notes

- **API Keys**: Restrict to specific APIs and consider IP restrictions
- **Service Account Keys**: Never commit to version control, rotate regularly
- Use environment variables for all sensitive configuration
- Consider using Google Cloud IAM for production deployments

## Production Deployment

For production:
1. Use service account keys or Workload Identity instead of API keys
2. Set up proper monitoring and logging
3. Configure appropriate CORS settings
4. Use HTTPS for WebSocket connections (WSS)
5. Implement rate limiting for transcription requests
6. Consider using Google Cloud Secret Manager for credential storage 