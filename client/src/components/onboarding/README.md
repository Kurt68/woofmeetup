# Onboarding & Profile Edit Components

This directory contains form components shared between onboarding (account creation) and profile editing workflows. The system was refactored to support both new user profiles and existing profile edits through consolidated, reusable components.

## Architecture Overview

The form system uses **shared components** that handle both scenarios:

- **Onboarding Page** (`/onboarding`): First-time setup with no existing profile data
- **Edit Profile Page** (`/edit-profile`): Updating existing profiles with preview of current images

Key architectural principles:

1. **Separation of Concerns**: Business logic lives in page components (Onboarding.jsx, EditDogProfile.jsx)
2. **Reusable Components**: Form components are scenario-agnostic
3. **Image Preview Support**: Components accept `currentImageUrl` for edit mode
4. **Flexible State Management**: Props-based state passed from parent pages
5. **Signed URLs for Security**: All images served via signed CloudFront URLs

## Page Integration

### Creation Flow: `Onboarding.jsx`

- Initial user setup (no prior images)
- All image fields start empty
- After submission, user is redirected to dashboard

### Edit Flow: `EditDogProfile.jsx`

- Updates existing profiles
- Fetches current data from `/api/auth/current-user-profile`
- Receives signed CloudFront URLs for current images
- Passes existing images to components for preview
- After submission, returns to dashboard

## Components

### Core Components

#### `OnboardingForm`

**Main form orchestrator** that composes all field sections.

**Used By:**

- `Onboarding.jsx` - Account creation
- `EditDogProfile.jsx` - Profile editing

**Props:**

```jsx
{
  // Form state and handlers (required)
  formData,                          // Object containing all form fields
  handleChange,                      // (e) => void
  submitProfile,                     // (e) => Promise

  // Validation errors
  aboutError,                        // string
  userAboutError,                    // string
  error,                             // string

  // UI states
  isLoading,                         // boolean
  isSubmitDisabled,                  // boolean

  // Dog image handling
  dogImageURL,                       // preview URL (blob) or null
  isDogImageUploading,               // boolean
  dogImageError,                     // string
  onDogImageSelect,                  // (file: File) => void
  onDogImageUpload,                  // () => Promise
  onClearDogImage,                   // () => void
  dogBreeds,                         // Array<{className, probability}>

  // Current dog image (edit mode)
  currentDogImageUrl,                // signed URL string or null

  // Profile image handling
  setProfileImageUploaded,           // (bool) => void
  setImageSelected,                  // (bool) => void
  currentProfileImageUrl,            // signed URL string or null
}
```

**Example Usage:**

```jsx
// In Onboarding.jsx (creation)
<OnboardingForm
  formData={formData}
  handleChange={handleChange}
  submitProfile={submitProfile}
  dogImageURL={dogImageURL}
  currentDogImageUrl={null}          // No existing image
  currentProfileImageUrl={null}
  // ... other props
/>

// In EditDogProfile.jsx (edit)
<OnboardingForm
  formData={formData}
  handleChange={handleChange}
  submitProfile={submitProfile}
  dogImageURL={dogImageURL}
  currentDogImageUrl={data.image}    // Signed URL from API
  currentProfileImageUrl={data.profile_image}
  // ... other props
/>
```

#### `DogProfileForm`

Collects basic dog information.

**Props:**

- `formData` - Form state
- `handleChange` - Change handler
- `aboutError` - Validation error
- `isDogImageUploading` - Disables form during upload

#### `DogImageUploadSection`

**Manages dog photo with breed detection.**

**Special Features:**

- Uploads to `/api/auth/image`
- Receives breed detection from ML model
- Displays breed confidence percentages
- Shows "Current Dog Photo" label in edit mode
- Supports image preview and removal

**Props:**

```jsx
{
  // Upload state
  imageURL,              // preview blob URL (new selection)
  isUploading,           // boolean
  error,                 // string

  // Handlers
  onImageSelect,         // (file: File) => void
  onUpload,              // () => Promise
  onClear,               // () => void

  // Edit mode support
  currentImageUrl,       // signed URL or null
  showCurrentImage,      // boolean - controls visibility

  // Results
  dogBreeds,             // Array of detected breeds
}
```

#### `SimpleImageUpload`

**Handles basic profile/avatar image upload.**

**Special Features:**

- Uploads to `/api/auth/profile-image`
- Nudity detection via OpenAI Vision
- File size validation (max 10MB)
- File type validation
- Shows "Current Profile Photo" label in edit mode

**Props:**

```jsx
{
  // Callbacks
  setImageUploaded,      // (bool) => void
  setImageSelected,      // (bool) => void

  // Edit mode support
  currentImageUrl,       // signed URL or null
  showCurrentImage,      // boolean
}
```

#### `MeetupPreferences`

Radio button selection for meetup type and interests.

**Props:**

- `formData` - Form state
- `handleChange` - Change handler

#### `UserProfileSection`

User-specific fields (age, about).

**Props:**

- `formData` - Form state
- `handleChange` - Change handler
- `userAboutError` - Validation error

#### `OnboardingSubmitButton`

Submit button with loading state.

**Props:**

- `isLoading` - boolean
- `isDisabled` - boolean

## Image URL Flow (Edit Mode)

### Backend Endpoint: `GET /api/auth/current-user-profile`

Returns user profile with **signed CloudFront URLs** for secure access:

```json
{
  "dogs_name": "Max",
  "image": "https://d36ifi98wv8n1.cloudfront.net/hash?auth=signed-params...",
  "profile_image": "https://d36ifi98wv8n1.cloudfront.net/hash?auth=signed-params..."
  // ... other fields
}
```

### Component Flow

1. `EditDogProfile` fetches profile data
2. Extracts `data.image` → `currentDogImageUrl`
3. Extracts `data.profile_image` → `currentProfileImageUrl`
4. Passes to `OnboardingForm` → component hierarchy
5. Components check `currentImageUrl && showCurrentImage` to display preview
6. Preview displays in `<img src={currentImageUrl} />`

### Debug Logging

Components include console logging for development:

- 🐕 `DogImageUploadSection` - image URL validation
- 👤 `SimpleImageUpload` - profile image URL validation
- 📷 `EditDogProfile` - URL extraction and formatting

## Validation

### `EditDogProfile.jsx`

- About (26 char max) via `validateAboutField()`
- User About (100 char max) via `validateUserAboutField()`
- Sentence case formatting on text fields

### `SimpleImageUpload`

- File type validation (image/\* only)
- File size validation (max 10MB)
- Nudity detection via OpenAI Vision API
- Server-side validation responses

## State Management Pattern

Both pages manage state locally with `useState`:

```jsx
// Form data
const [formData, setFormData] = useState({...})

// Image upload states
const [dogImageURL, setDogImageURL] = useState(null)
const [dogImageFile, setDogImageFile] = useState(null)
const [isDogImageUploading, setIsDogImageUploading] = useState(false)

// Preview states (edit mode only)
const [currentDogImageUrl, setCurrentDogImageUrl] = useState(null)
const [currentProfileImageUrl, setCurrentProfileImageUrl] = useState(null)

// UI states
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState(null)
```

## File Structure

```
onboarding/
├── README.md                      # This file
├── index.js                       # Exports
├── OnboardingForm.jsx             # Main form orchestrator
├── DogProfileForm.jsx             # Dog info fields
├── DogImageUploadSection.jsx      # Dog photo with breed detection
├── MeetupPreferences.jsx          # Meetup type & interests
├── UserProfileSection.jsx         # User info fields
├── OnboardingHeader.jsx           # "Create Account" title
└── OnboardingSubmitButton.jsx     # Submit with loading state
```

## Related Components

- `SimpleImageUpload` (src/components/upload/) - Profile image upload
- `Nav` (src/components/layout/) - Navigation
- `Onboarding` (src/pages/Onboarding.jsx) - Account creation page
- `EditDogProfile` (src/pages/EditDogProfile.jsx) - Profile editing page

## Dependencies

- React (hooks: useState, useEffect, useCallback, useRef)
- react-cookie - User session
- axios - API calls
- lucide-react - Icons (Upload, X, Check, Loader)

## Key Implementation Notes

1. **Image URLs**: All image URLs from the backend are **pre-signed CloudFront URLs** valid for 24 hours
2. **File Input Reset**: File input `value` is manually cleared after upload to allow re-selecting same file
3. **Memory Leaks**: Object URLs are cleaned up on component unmount
4. **Disable Pattern**: Submit button disabled during image upload to prevent concurrent operations
5. **Error Handling**: Server errors (including nudity detection) propagate to user via `setError` or `setUploadError`
6. **Mobile Optimized**: Components use responsive design for mobile/tablet viewports

## Testing Considerations

When testing components in isolation:

- Pass `null` for `currentImageUrl` and `false` for `showCurrentImage` to simulate creation mode
- Pass signed URLs and `true` to simulate edit mode with existing images
- Mock image file uploads with File API
- Mock breed detection responses from backend
- Test error states: nudity detection, file size, validation errors
