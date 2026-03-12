# 📍 Location System Documentation

## Overview

The location system enables real-time location sharing and discovery between active users in the Spark messaging platform. Users can:

1. **Share their location** with other users
2. **Discover nearby users** and view distances
3. **Send location messages** in chats
4. **Control location privacy** with sharing toggles

---

## System Architecture

### Backend Components

#### 1. **Database Model** - `user-location.model.js`
Stores user location data with the following fields:
- `userId` (UUID, FK to User)
- `latitude` (DECIMAL(10,8)) - Geographic latitude
- `longitude` (DECIMAL(11,8)) - Geographic longitude
- `address` (String) - Human-readable address
- `city` (String) - City name
- `country` (String) - Country name
- `isShared` (Boolean, default: false) - Location sharing consent
- `isActive` (Boolean, default: true) - Active status
- `lastUpdated` (TIMESTAMP) - Last update time

**Indexes:** `userId` (unique), `(latitude, longitude)` for geographic queries

#### 2. **Location Service** - `location.service.js`
Implements core location logic:
- `updateUserLocation(userId, location)` - Create/update location
- `getUserLocation(userId)` - Fetch user's location
- `calculateDistance(lat1, lon1, lat2, lon2)` - Haversine formula
- `findNearbyUsers(userId, radius, limit)` - Find users within radius
- `getActiveUsers()` - Get all active users
- `toggleLocationSharing(userId, isShared)` - Toggle sharing status
- `setUserActive(userId)` - Mark user as active
- `setUserInactive(userId)` - Mark user as inactive
- `deleteUserLocation(userId)` - Remove location data

#### 3. **Location Controller** - `location.controller.js`
Handles HTTP requests:
- `PUT /api/location/update` - Update user location
- `GET /api/location/me` - Get current user's location
- `GET /api/location/nearby` - Find nearby users
- `GET /api/location/active-users` - Get all active users
- `PATCH /api/location/toggle-sharing` - Toggle sharing
- `PATCH /api/location/set-inactive` - Mark user inactive
- `DELETE /api/location/delete` - Delete location data

#### 4. **Message Location Fields** - `message.model.js`
Messages can optionally contain location data:
- `locationLatitude` (DECIMAL, nullable)
- `locationLongitude` (DECIMAL, nullable)
- `locationAddress` (String, nullable)

---

### Frontend Components

#### 1. **Hooks**

**`useLocation`** - Geolocation functionality
```javascript
const { 
  getCurrentPosition,    // Acquire current location
  watchPosition,        // Continuous tracking
  clearWatch,           // Stop tracking
  getAddressFromCoords, // Reverse geocoding
  error                 // Error state
} = useLocation();
```

**`useDistance`** - Distance calculations
```javascript
const { 
  calculateDistance,      // Haversine formula (meters)
  formatDistance,        // Format to "m" or "km"
  getDistanceCategory,   // Proximity classification
  sortByDistance,        // Sort users by distance
  filterByRadius         // Filter by distance radius
} = useDistance();
```

#### 2. **Components**

**`LocationPicker`** - UI for selecting and sharing location
- Acquires current GPS coordinates
- Shows latitude, longitude, accuracy
- Reverse geocodes to address via OpenStreetMap
- Button to share location to API

**`NearbyUsers`** - Discovery component
- API: `GET /api/location/nearby`
- Displays user cards with:
  - Avatar and name
  - City and distance from current user
  - Color-coded distance badges (Very Close/Close/Nearby/Far)
  - Auto-refresh every 30 seconds
  - "Chat" button to start conversation

**`LocationMessage`** - Display location in chat
- Shows map preview with pin icon
- Displays address and coordinates
- "Open Map" button links to Google Maps
- "Directions" button for navigation

**`LocationSharingToggle`** - Privacy control
- Toggle switch for location sharing
- Fetches current sharing status
- Updates API with new preference

**`LocationSendButton`** - Chat location attachment
- Map pin icon in message footer
- Location picker popover
- "Get Location" and "Update" buttons
- "Send" button to attach location to message

#### 3. **Integration Points**

**`chat-footer.jsx`** - Updated with LocationSendButton
- Added import: `import { LocationSendButton } from "../location"`
- Added state: `const [location, setLocation] = useState(null)`
- Added handler: `handleSendLocation` callback
- Location display: Shows selected location preview
- Updated payload: Includes location in message

**`chat-body-message.jsx`** - Updated to display location messages
- Added import: `import { LocationMessage } from "../location"`
- Renders `LocationMessage` when `message.locationLatitude` && `message.locationLongitude` exist

**`use-chat.js`** - Updated sendMessage hook
- Accepts location object in payload
- Constructs API payload with locationLatitude/Longitude/Address
- Includes location in temporary message state

---

## API Endpoints

### Location Management

#### Update User Location
```
PUT /api/location/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "New York, NY, USA",
  "city": "New York",
  "country": "USA"
}

Response: { location: { ... } }
```

#### Get My Location
```
GET /api/location/me
Authorization: Bearer <token>

Response: { location: { ... } }
```

#### Find Nearby Users
```
GET /api/location/nearby?radius=10&limit=50
Authorization: Bearer <token>

Query Parameters:
  - radius (km, default: 10)
  - limit (default: 50)

Response: {
  users: [
    {
      user: { _id, name, avatar, ... },
      distance: 2.5  // km
    }
  ]
}
```

#### Get All Active Users
```
GET /api/location/active-users
Authorization: Bearer <token>

Response: {
  users: [
    {
      _id, name, avatar, 
      location: { latitude, longitude, address, city, country }
    }
  ]
}
```

#### Toggle Location Sharing
```
PATCH /api/location/toggle-sharing
Authorization: Bearer <token>
Content-Type: application/json

{
  "isShared": true
}

Response: { location: { ... } }
```

#### Set User Inactive
```
PATCH /api/location/set-inactive
Authorization: Bearer <token>

Response: { message: "User set to inactive" }
```

#### Delete Location Data
```
DELETE /api/location/delete
Authorization: Bearer <token>

Response: { message: "Location deleted" }
```

---

## Distance Calculation

The system uses the **Haversine Formula** for accurate distance calculations:

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
d = R × c
```

Where:
- R = Earth's radius (6,371 km)
- Result accurate to ~0.5km

---

## Distance Categories

- **Very Close**: < 1 km
- **Close**: 1-5 km
- **Nearby**: 5-10 km
- **Far**: 10+ km

---

## Data Flow Diagrams

### Location Update Flow
```
User → LocationPicker → useLocation Hook → GPS API
    ↓
    API.put("/location/update") → Backend → DB
    ↓
    Location State Updated ✓
```

### Nearby Users Discovery
```
User Clicks "Find Nearby" → API.get("/location/nearby")
    ↓
    Backend Calculates Distances (Haversine) → Returns Sorted List
    ↓
    NearbyUsers Component Renders Cards with Distances
    ↓
    Auto-refreshes every 30 seconds
```

### Location Message Send
```
User Clicks Location Button → LocationSendButton Popover
    ↓
    useLocation.getCurrentPosition() → Get GPS Coords
    ↓
    Send Button → Adds location to Message Payload
    ↓
    API.post("/chat/message/send", {..., location}) → Backend
    ↓
    Message Saved with Location Fields
    ↓
    Recipient Sees LocationMessage Component in Chat
```

---

## Usage Examples

### 1. Share Your Location

```javascript
// In a component
import { LocationPicker } from "@/components/location";

export default function Settings() {
  const handleLocationShared = (location) => {
    console.log("Location shared:", location);
    // API call is handled by LocationPicker
  };

  return <LocationPicker />;
}
```

### 2. Find Nearby Users

```javascript
import { NearbyUsers } from "@/components/location";

export default function Discovery() {
  const handleStartChat = (userId) => {
    // Navigate to chat
  };

  return (
    <NearbyUsers 
      radius={10} 
      limit={50}
      onStartChat={handleStartChat}
    />
  );
}
```

### 3. Toggle Location Sharing

```javascript
import { LocationSharingToggle } from "@/components/location";

export default function Privacy() {
  return <LocationSharingToggle />;
}
```

### 4. Send Location in Chat

```javascript
// Integrated in chat-footer.jsx
// Users click map pin icon and select location
// Message is sent with location attachment
```

---

## Security & Privacy

### Authentication
- All location endpoints require JWT authentication
- Bearer token required in Authorization header

### Data Privacy
- Location sharing is **opt-in** (`isShared` boolean)
- Users can toggle sharing at any time
- Inactive users don't appear in nearby searches
- Location data never shared with non-authenticated users

### Data Retention
- Location updated on each share
- `lastUpdated` timestamp tracks freshness
- Users can delete location data anytime

---

## Performance Optimizations

1. **Geographic Indexing** - Latitude/longitude indexed for fast queries
2. **User Filtering** - Only active, sharing-enabled users returned
3. **Distance Limiting** - Configurable radius reduces result set
4. **Auto-refresh Rate** - 30-second interval prevents excessive requests
5. **Lazy Loading** - Location data loaded only when needed

---

## Browser Compatibility

Location features require:
- **Geolocation API** support (all modern browsers)
- **HTTPS** for secure location access
- User permission grant for GPS access

### Fallback Handling
If geolocation unavailable:
- Error states displayed in UI
- Users can manually enter coordinates
- Address field optional for fallback

---

## Testing the System

### 1. Enable Location Sharing
- User A: Click settings → Enable location sharing
- User A: GPS updates location to API

### 2. Discover Users
- User B: Opens "Nearby Users" page
- User B: Sees User A with distance badge
- Auto-refreshes show updated distances

### 3. Send Location Message
- User A & B: In chat
- User A: Clicks map pin icon
- User A: Sends current location
- User B: Sees location card with map preview

### 4. Navigate
- User B: Clicks "Directions" on location message
- Opens Google Maps with navigation to location

---

## Troubleshooting

### Location Not Updating
1. Check browser location permissions
2. Enable location sharing in settings
3. Verify GPS is working on device
4. Check API response in network tab

### Nearby Users Not Showing
1. Ensure location sharing is enabled
2. Verify API.get("/location/nearby") succeeds
3. Check if other users are within radius
4. Try increasing radius parameter

### Reverse Geocoding Not Working
- Fallback: Display coordinates only if address unavailable
- Uses OpenStreetMap Nominatim (free, no key needed)

---

## Future Enhancements

- [ ] Group location tracking
- [ ] Location history timeline
- [ ] Custom geofences/zones
- [ ] Location-based notifications
- [ ] Export location data
- [ ] Live location streaming
- [ ] Map view of all nearby users

---

## File References

**Backend Files:**
- [user-location.model.js](backend/src/models/user-location.model.js)
- [location.service.js](backend/src/services/location.service.js)
- [location.controller.js](backend/src/controllers/location.controller.js)
- [location.validator.js](backend/src/validators/location.validator.js)
- [location.route.js](backend/src/routes/location.route.js)

**Frontend Files:**
- [use-location.js](client/src/hooks/use-location.js)
- [use-distance.js](client/src/hooks/use-distance.js)
- [location-picker.jsx](client/src/components/location/location-picker.jsx)
- [nearby-users.jsx](client/src/components/location/nearby-users.jsx)
- [location-message.jsx](client/src/components/location/location-message.jsx)
- [location-sharing-toggle.jsx](client/src/components/location/location-sharing-toggle.jsx)
- [location-send-button.jsx](client/src/components/location/location-send-button.jsx)

---

## License

This location system is part of the Spark messenger platform and follows the same license terms.
