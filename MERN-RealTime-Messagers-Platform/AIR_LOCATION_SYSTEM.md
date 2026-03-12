# Air Location System - Real-time GPS Distance Calculation

A complete real-time location sharing system with Haversine formula distance calculation for your MERN chat application.

## Features

✨ **Real-time Location Sharing**
- Share live GPS coordinates with all connected users
- Automatic location updates via Geolocation API
- Location broadcasting with WebSocket events

📍 **Haversine Formula Distance Calculation**
- Straight-line distance calculation between coordinates
- No traffic or route distance required
- Accurate air distance in kilometers and meters
- Automatic precision handling

👥 **Nearby Users Detection**
- Real-time list of users near your location
- Sorted by distance (closest first)
- Live distance updates every 2 seconds
- Proximity indicators and badges

🎨 **Excellent UI Components**
- Beautiful gradient cards with animations
- Real-time distance radar display
- Pulsing proximity indicators
- Smooth transitions and interactions
- Dark mode support

## Backend Implementation

### Socket Events

#### Broadcasting Location
```javascript
// Server receives location:share event
socket.on("location:share", (payload) => {
    const { latitude, longitude, address, city, country, accuracy } = payload;
    // Broadcasts to all users with nearby distance calculations
    io?.emit("location:shared", broadcastData);
});
```

#### User Location Stopping
```javascript
socket.on("location:stop", () => {
    // Removes user from active locations
    userLocations.delete(userId);
    io?.emit("location:stopped", { userId });
});
```

### Haversine Formula Implementation
```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * 
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
};
```

## Client-Side Implementation

### Hooks

#### `useAirLocation()` - Current User Location
```javascript
const { location, isSharing, loading, error, accuracy, startSharing, stopSharing } = useAirLocation();

// Start broadcasting your location
startSharing();

// Stop sharing
stopSharing();

// location: { latitude, longitude }
```

#### `useOtherUserAirLocation(userId)` - Track Other User
```javascript
const { location, distance, distanceFormatted, hasLocation } = useOtherUserAirLocation("user123");

// distance: number in kilometers
// distanceFormatted: { value, unit, formatted: "1.5km" }
```

#### `useNearbyUsersAir(currentUserLocation)` - Find Nearby Users
```javascript
const { nearbyUsers, count, getDistanceFormatted } = useNearbyUsersAir(location);

// nearbyUsers: sorted by distance
// Each user has: { userId, latitude, longitude, distanceKm, timestamp }
```

### Components

#### `AirLocationSystem` - Main Component
Complete air location system with broadcaster and nearby users list.

```jsx
import { AirLocationSystem } from "@/components/location";

export default () => <AirLocationSystem />;
```

#### `AirLocationBroadcaster` - Location Control
Start/stop location sharing with real-time stats.

```jsx
import { AirLocationBroadcaster } from "@/components/location";

const { location, isSharing, startSharing, stopSharing } = useAirLocation();

<AirLocationBroadcaster
    isSharing={isSharing}
    location={location}
    onStart={startSharing}
    onStop={stopSharing}
/>
```

#### `NearbyUsersRadar` - Proximity Display
Shows nearby users with distance bars and proximity indicators.

```jsx
import { NearbyUsersRadar } from "@/components/location";

<NearbyUsersRadar users={nearbyUsers} currentLocation={location} />
```

#### `NearbyUsersCard` - Detailed List
Detailed list of nearby users sorted by distance.

```jsx
import { NearbyUsersCard } from "@/components/location";

<NearbyUsersCard users={nearbyUsers} />
```

#### `ViewUserAirLocation` - Single User Location
View another user's location with distance and coordinates.

```jsx
import { ViewUserAirLocation } from "@/components/location";

<ViewUserAirLocation userId="user123" userName="John Doe" />
```

### Context Provider

```jsx
import { AirLocationProvider } from "@/components/location";

function App() {
    return (
        <AirLocationProvider autoShare={false}>
            <YourApp />
        </AirLocationProvider>
    );
}
```

#### Context Hook
```javascript
const { location, isSharing, startSharing, stopSharing, nearbyUsers, nearbyCount } = useAirLocationContext();
```

### Utility Components

#### `FloatingLocationWidget` - Corner Widget
```jsx
<FloatingLocationWidget position="bottom-right" />
```

#### `LocationStatusBar` - Top Bar
```jsx
<LocationStatusBar />
```

## Distance Formatting

The system automatically formats distances for better readability:

```javascript
formatDistance(0.0005)  // Returns { value: 0.5, unit: "m", formatted: "0.5m" }
formatDistance(1.234)   // Returns { value: 1.2, unit: "km", formatted: "1.2km" }
formatDistance(0.045)   // Returns { value: 45, unit: "m", formatted: "45m" }
```

## Real-time Updates

### Socket Events

**Server → Client:**
- `location:shared` - New location broadcast
- `location:stopped` - User stopped sharing
- `location:requesting` - Location request from user

**Client → Server:**
- `location:share` - Share your location
- `location:stop` - Stop sharing location
- `location:request` - Request another user's location

## Usage Example

```jsx
import { AirLocationSystem, useAirLocation } from "@/components/location";

export function ChatPage() {
    const { location, isSharing, startSharing, stopSharing } = useAirLocation();

    return (
        <div>
            {/* Main location system */}
            <AirLocationSystem />

            {/* OR Manual setup */}
            {!isSharing ? (
                <button onClick={startSharing}>
                    📍 Start Sharing Location
                </button>
            ) : (
                <div>
                    <p>Location: {location?.latitude}, {location?.longitude}</p>
                    <button onClick={stopSharing}>Stop Sharing</button>
                </div>
            )}
        </div>
    );
}
```

## Proximity Indicators

The system uses visual indicators based on distance:

| Distance | Badge | Color | Icon |
|----------|-------|-------|------|
| < 100m | Very Close | 🟢 Green | Pulsing |
| < 500m | Within 500m | 🔵 Blue | Pulsing |
| < 2km | Close | 🟡 Yellow | Solid |
| > 2km | Far | ⚪ Gray | Solid |

## Performance Considerations

- Location updates broadcast every time movement is detected
- Nearby users list updates every 2 seconds
- Automatic cleanup on user disconnect
- Efficient distance calculations using Haversine formula

## Browser Compatibility

- Chrome/Edge 50+
- Firefox 24+
- Safari 10.1+
- Mobile browsers (iOS Safari 13.4+, Chrome Mobile)

**Note:** HTTPS required for Geolocation API in production

## Security Notes

- Locations are shared with all connected users
- Consider implementing privacy controls
- Users can see each other's coordinates
- No server-side location storage in current implementation

## Future Enhancements

- Geographic clustering for large user bases
- Privacy zones/boundaries
- Location history
- Map visualization integration
- Custom distance radius filtering
- Location sharing permissions
