# ClubSphere Server

Backend API for ClubSphere - Membership & Event Management Platform

## Features

- RESTful API with Express.js
- MongoDB with Mongoose ODM
- Firebase Authentication integration
- Stripe payment processing
- Role-based access control
- Comprehensive error handling
- CORS enabled for cross-origin requests

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

### Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `GET /auth/me` - Get current user profile

#### Clubs
- `GET /clubs` - Get all approved clubs with search/filter/sort
- `GET /clubs/featured` - Get featured clubs for homepage
- `GET /clubs/:id` - Get single club details
- `POST /clubs` - Create new club (Club Manager only)
- `PUT /clubs/:id` - Update club (Club Manager only)
- `GET /clubs/manager/my-clubs` - Get manager's clubs
- `GET /clubs/admin/all` - Get all clubs for admin
- `PATCH /clubs/:id/status` - Approve/reject club (Admin only)

#### Events
- `GET /events` - Get all events with search/sort
- `GET /events/upcoming` - Get upcoming events
- `GET /events/:id` - Get single event
- `POST /events` - Create event (Club Manager only)
- `PUT /events/:id` - Update event (Club Manager only)
- `DELETE /events/:id` - Delete event (Club Manager only)
- `GET /events/manager/my-events` - Get manager's events

#### Memberships
- `POST /memberships/join/:clubId` - Join a club
- `GET /memberships/my-memberships` - Get user's memberships
- `GET /memberships/club/:clubId` - Get club members

#### Payments
- `POST /payments/create-membership-payment` - Create membership payment intent
- `POST /payments/create-event-payment` - Create event payment intent
- `POST /payments/confirm-payment` - Confirm payment success
- `GET /payments/my-payments` - Get user's payment history
- `GET /payments/admin/all` - Get all payments (Admin only)

#### Users
- `GET /users` - Get all users (Admin only)
- `PATCH /users/:id/role` - Update user role (Admin only)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with required environment variables

3. Start development server:
```bash
npm run dev
```

4. Start production server:
```bash
npm start
```

## Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/clubsphere
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project.iam.gserviceaccount.com
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

## Database Models

### User
- name, email, photoURL, role, firebaseUID
- Roles: admin, clubManager, member

### Club
- clubName, description, category, location, bannerImage
- membershipFee, status, managerEmail, memberCount

### Event
- clubId, title, description, eventDate, location
- isPaid, eventFee, maxAttendees, currentAttendees

### Membership
- userEmail, clubId, status, paymentId, expiresAt

### EventRegistration
- eventId, userEmail, clubId, status, paymentId

### Payment
- userEmail, amount, type, clubId, eventId
- stripePaymentIntentId, status

## Deployment

### Heroku Deployment
1. Create Heroku app
2. Set environment variables
3. Deploy via Git or GitHub integration

### MongoDB Atlas
1. Create cluster
2. Add connection string to MONGODB_URI
3. Whitelist Heroku IP addresses

## Security

- Firebase token verification middleware
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Environment variable protection