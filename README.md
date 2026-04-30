# Apartment Management System

A full-stack application for managing apartments, residents, invoices, and complaints.

## Project Structure

- **/backend**: Express/Node.js server with MongoDB.
- **/frontend**: React/Vite application.

## Getting Started

### Prerequisites

- Node.js
- MongoDB

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and add your MongoDB URI.
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Features

- User Authentication & Authorization
- Apartment & Resident Management
- Invoice Tracking & Payments
- Complaint Management
- Notice Board
- Dashboard Statistics

## Tech Stack

- **Backend**: Node.js, Express, MongoDB
- **Frontend**: React, Vite

## Environment Variables

Create a `.env` file in the backend directory with:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
```
