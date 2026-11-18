# NMSU Study Finder – Studyroom Rating App

A mobile application that allows New Mexico State University students to discover, review, rate, and save study spaces around campus.

## Features

- Browse study locations around NMSU
- View student ratings and reviews
- Create an account and securely log in
- Submit studyroom reviews
- Save favorite study locations
- Recommend new study spaces
- View personal account activity

## Technology Stack

**Frontend**
- React Native
- Expo
- TypeScript
- Expo Router

**Backend**
- Node.js
- Express.js
- MySQL-compatible database (TiDB Cloud)
- JWT authentication

**Hosting**
- Render (backend API)
- TiDB Cloud (database)

## Getting Started

### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Expo Go](https://expo.dev/go) on your mobile device

### 1. Clone the Repository

```bash
git clone https://github.com/nvelappan/RatingApp.git
cd RatingApp
```

### 2. Install Frontend Dependencies

```bash
npm ci
```

### 3. Start the Application

```bash
npx expo start
```

Scan the QR code using Expo Go to open the application.

If you experience network connectivity issues, try:

```bash
npx expo start --tunnel
```

## Backend Architecture

The application communicates with a hosted Express API on Render. The API connects to the TiDB Cloud database.

For normal app usage, team members do not need to install MySQL, create a TiDB account, or configure their own Render service.

### Running the Backend Locally (Optional)

To develop or modify the backend:

```bash
cd backend
npm ci
node server.js
```

A separate backend configuration file (`backend/.env`) is required. Contact the project maintainer for the required configuration. Never commit actual credentials or secrets.

## Project Structure

```text
RatingApp/
├── app/                 # Expo application screens
├── assets/              # Images and application assets
├── backend/             # Express API and database connection
├── components/          # Reusable UI components
├── constants/           # Application constants
├── package.json         # Frontend dependencies
├── package-lock.json    # Frontend dependency lockfile
└── README.md            # Project documentation
```

## Notes

- Use the Node.js version supported by the project's Expo SDK.
- Run `npm ci` after cloning or when dependencies change.
- The backend and database are hosted separately from the mobile application.
- Do not commit `.env` files, database credentials, or authentication secrets.
