# Firestore Schema

## `users/{uid}`
- `cityName` (string): Unique display name (e.g. "Berlin").
- `cityId` (string): Normalized ID (e.g. "BERLIN").
- `joinedAt` (timestamp): Account creation.
- `points` (number): Total discipline score.
- `status` (string, optional): "ACTIVE" or "DELETED".

## `cities/{cityId}`
- `uid` (string): Owner UID.
- `displayName` (string): Original case (e.g. "Berlin").
- `createdAt` (timestamp).
- **Security Rule**: Document ID matches normalized name. Create only if not exists.

## `workouts/{workoutId}`
- `uid` (string): Creator.
- `exercise` (string).
- `sets`, `reps`, `weight`, `duration` (numbers/strings).
- `createdAt` (timestamp).

## `users/{uid}/messages/{messageId}`
- `content` (string): Tyler's response.
- `trigger` (string): Event name (e.g. "item_logged").
- `createdAt` (timestamp).

# Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if true; // Public for leaderboard (or limit to specific fields)
      allow write: if request.auth.uid == uid;
    }
    match /cities/{cityId} {
        allow read: if true;
        allow create: if request.auth != null; // Validation happens via Transaction/Functions
    }
    match /workouts/{workoutId} {
        allow read, write: if request.auth.uid == resource.data.uid;
        allow create: if request.auth.uid == request.resource.data.uid;
    }
  }
}
```
