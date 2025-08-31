# Set Track'r 🎵

A full-stack web application for concert enthusiasts to track their live music experiences. Record setlists, discover patterns in your concert history, and connect with other music fans.

## 🌟 Features

- **Concert Tracking**: Search and save concerts you've attended with complete setlists
- **Statistics & Analytics**: View detailed charts of your concert history and favorite songs
- **Social Features**: Follow other users and discover what concerts they've attended
- **Artist Insights**: See how many times you've seen each artist and which songs
- **Public Profiles**: Share your concert history with customizable privacy settings
- **Responsive Design**: Optimized for both desktop and mobile devices

## 🚀 Live Demo

- **Frontend**: [https://set-trackr.onrender.com](https://set-trackr.onrender.com)
- **Backend API**: [https://set-trackr-backend.onrender.com](https://set-trackr-backend.onrender.com)

## 🛠️ Tech Stack

### Frontend
- **React** 19.0.0 - UI framework
- **React Router DOM** 7.2.0 - Client-side routing
- **Auth0 React** 2.3.0 - Authentication and authorization
- **CSS3** - Custom styling with responsive design

### Backend
- **Node.js** - Runtime environment
- **Express.js** 4.18.1 - Web framework
- **MongoDB** with **Mongoose** 8.11.0 - Database and ODM
- **Auth0** - JWT authentication
- **Axios** 1.5.0 - HTTP client for external APIs

### External APIs
- **Setlist.fm API** - Concert and setlist data

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB database
- Auth0 account
- Setlist.fm API key

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/egarcia1868/setTrackR.git
cd setTrackR
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
MONGO_URI=your_mongodb_connection_string
PORT=4000
SETLIST_FM_API_KEY=your_setlist_fm_api_key
AUTH0_DOMAIN=your_auth0_domain
AUTH0_AUDIENCE=your_auth0_audience_url
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
REACT_APP_AUTH0_DOMAIN=your_auth0_domain
REACT_APP_AUTH0_CLIENT_ID=your_auth0_client_id
REACT_APP_AUTH0_AUDIENCE=your_auth0_audience_url
```

## 🚀 Running the Application

### Development Mode

**Backend** (from the backend directory):
```bash
npm run dev  # Uses nodemon for auto-restart
# or
npm start    # Standard start
```

**Frontend** (from the frontend directory):
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Production Mode

**Backend**:
```bash
npm run prod
```

**Frontend**:
```bash
npm run build
```

## 📱 Usage

1. **Sign Up/Login**: Create an account using Auth0 authentication
2. **Search Concerts**: Use the "Find new setlist" feature to search for concerts
3. **Save Concerts**: Add concerts to your personal collection
4. **View Statistics**: Check your dashboard for concert analytics and charts
5. **Profile Management**: Customize your profile and privacy settings
6. **Social Features**: Follow other users and view public profiles

## 🏗️ Project Structure

```
setTrackR/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom hooks
│   │   ├── context/         # React context
│   │   └── utils/           # Utility functions
│   └── public/              # Static files
├── backend/                 # Node.js backend
│   ├── controllers/         # Route controllers
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── server.js           # Express server
└── README.md
```

## 🔐 Authentication

Set Track'r uses Auth0 for secure authentication and authorization. Users can sign up with:
- Google OAuth
- Email/Password
- Other Auth0 supported providers

## 📊 API Endpoints

### Concert Routes
- `GET /api/concerts/user/saved` - Get user's saved concerts
- `POST /api/concerts` - Save a concert
- `DELETE /api/concerts/:artistId/:concertId` - Delete a concert
- `GET /api/concerts` - Search concerts via Setlist.fm

### User Routes
- `GET /api/concerts/profile` - Get current user profile
- `PUT /api/concerts/profile` - Update user profile
- `GET /api/concerts/profile/:username` - Get public profile

### Social Features
- `POST /api/concerts/follow/:displayName` - Follow a user
- `DELETE /api/concerts/follow/:displayName` - Unfollow a user
- `GET /api/concerts/following` - Get following list
- `GET /api/concerts/followers` - Get followers list

## 🌐 Deployment

The application is deployed using:
- **Frontend**: Render
- **Backend**: Render
- **Database**: MongoDB Atlas

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Eric Garcia**
- GitHub: [@egarcia1868](https://github.com/egarcia1868)

## 🙏 Acknowledgments

- [Setlist.fm](https://www.setlist.fm/) for providing concert and setlist data
- [Auth0](https://auth0.com/) for authentication services
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for database hosting
- [Render](https://render.com/) for deployment platform

## 📈 Future Features

- [ ] Spotify integration for song previews
- [ ] Concert recommendations based on listening history
- [ ] Export data functionality
- [ ] Advanced filtering and search options
- [ ] Mobile app development
- [ ] Concert photo uploads
- [ ] Venue information and maps