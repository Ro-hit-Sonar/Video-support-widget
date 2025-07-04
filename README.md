# WebRTC Support Call Widget

A plug-and-play support call widget using WebRTC for real-time audio communication between customers and support agents.

## Features

- 🎥 **Floating Support Button**: Always visible widget for customers to initiate calls
- 🔐 **Agent Authentication**: Protected dashboard with login system
- 🎤 **Audio Communication**: Real-time audio calls using WebRTC
- 📹 **Video Preview**: Agents can see their own video feed
- 🔄 **Real-time Signaling**: Socket.IO for WebRTC connection establishment
- 🎛️ **Call Controls**: Mute/unmute, end call functionality
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Quick Start

### Prerequisites

- Node.js 18+
- Modern browser with WebRTC support

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd video-agent-fittrock
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

### For Customers

1. **Access the Widget**: The floating "🎥 Live Support" button appears on the bottom-right of the page
2. **Start a Call**: Click the button and then "Start Call" to initiate a support session
3. **Grant Permissions**: Allow microphone access when prompted
4. **Wait for Agent**: The system will automatically connect you to an available agent
5. **Communicate**: Speak with the agent through your microphone
6. **End Call**: Click "End Call" or close the browser tab to disconnect

### For Support Agents

1. **Login**: Navigate to `/login` and use the demo credentials:

   - Username: `agent`
   - Password: `1234`

2. **Access Dashboard**: After login, you'll be redirected to `/dashboard`

3. **Start Agent Mode**: Click "🎥 Start Agent Call" to activate your camera and microphone

4. **Accept Calls**: When a customer initiates a call, you'll automatically receive it

5. **View Customer**: The customer's audio stream will be available for communication

6. **End Calls**: Use "📞 End Current Call" to disconnect from the current customer

## Technical Architecture

### Phase 1: Basic Widget + Dashboard

- Floating support button with modal interface
- Agent authentication system
- Protected dashboard route

### Phase 2: WebRTC Media Streams

- Microphone access for customers
- Camera + microphone access for agents
- Local video preview for agents
- Mute/unmute functionality

### Phase 3: Real-time Signaling

- Socket.IO server for WebRTC signaling
- Peer-to-peer audio communication
- Automatic connection establishment
- Call state management

## File Structure

```
video-agent-fittrock/
├── app/
│   ├── dashboard/page.tsx      # Agent dashboard with WebRTC
│   ├── login/page.tsx          # Agent login page
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page with widget
├── public/
│   └── widget.js               # Customer widget (vanilla JS)
├── server.js                   # Custom server with Socket.IO
├── package.json                # Dependencies and scripts
└── README.md                   # This file
```

## Development

### Running in Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Socket.IO
- **WebRTC**: Native browser APIs
- **Authentication**: Local storage (demo purposes)

## Browser Support

This application requires modern browsers with WebRTC support:

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## Security Notes

⚠️ **Demo Implementation**: This is a demonstration with basic security:

- Authentication uses localStorage (not secure for production)
- No HTTPS enforcement (required for WebRTC in production)
- No rate limiting or connection limits

For production use, implement:

- Secure session management
- HTTPS enforcement
- Rate limiting
- Input validation
- Proper error handling

## Troubleshooting

### Common Issues

1. **Microphone not working**: Ensure browser permissions are granted
2. **Connection fails**: Check firewall settings and STUN server availability
3. **Agent not receiving calls**: Verify agent is logged in and has started agent mode
4. **Audio quality issues**: Check network connection and microphone settings

### Debug Mode

Open browser developer tools to see detailed connection logs and WebRTC state information.

## License

This project is for demonstration purposes. Please implement proper security measures before production use.
