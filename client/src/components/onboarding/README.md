# Onboarding Components

This directory contains the refactored onboarding components that were decomposed from a single monolithic 279-line component into a modular, maintainable system.

## Architecture Overview

The onboarding system follows a clear separation of concerns:

- **Business Logic**: Extracted into `useOnboarding` custom hook
- **UI Components**: Broken down into focused, reusable components
- **State Management**: Centralized in the custom hook
- **Form Handling**: Distributed across specialized form components

## Components

### Core Components

#### `OnboardingHeader`

Simple header component displaying the "Create Account" title.

```jsx
import { OnboardingHeader } from '../components/onboarding'

;<OnboardingHeader />
```

#### `DogProfileForm`

Handles the basic dog profile information including name, age, and about section.

**Props:**

- `formData` - Current form state
- `handleChange` - Form change handler
- `aboutError` - Validation error for about field

```jsx
<DogProfileForm
  formData={formData}
  handleChange={handleChange}
  aboutError={aboutError}
/>
```

#### `MeetupPreferences`

Manages meetup type selection and interest preferences with radio button groups.

**Props:**

- `formData` - Current form state
- `handleChange` - Form change handler

**Features:**

- Configurable meetup types array
- Configurable meetup interests array
- Proper radio button grouping and labeling

```jsx
<MeetupPreferences formData={formData} handleChange={handleChange} />
```

#### `ProfileImageSection`

Wrapper component for the profile image upload functionality.

**Props:**

- `setImageUploaded` - Callback when image upload completes
- `setImageSelected` - Callback when image is selected

```jsx
<ProfileImageSection
  setImageUploaded={setImageUploaded}
  setImageSelected={setImageSelected}
/>
```

#### `OnboardingSubmitButton`

Submit button with loading state and proper disabled state management.

**Props:**

- `isLoading` - Loading state boolean
- `isDisabled` - Disabled state boolean

**Features:**

- Loading spinner integration
- Proper accessibility attributes
- Conditional text display

```jsx
<OnboardingSubmitButton isLoading={isLoading} isDisabled={isSubmitDisabled} />
```

#### `OnboardingForm`

Main form container that orchestrates all form components.

**Props:**

- `formData` - Current form state
- `handleChange` - Form change handler
- `submitProfile` - Form submission handler
- `aboutError` - About field validation error
- `error` - General form error
- `isLoading` - Loading state
- `isSubmitDisabled` - Submit button disabled state
- `setProfileImageUploaded` - Image upload callback
- `setImageSelected` - Image selection callback

```jsx
<OnboardingForm
  formData={formData}
  handleChange={handleChange}
  submitProfile={submitProfile}
  aboutError={aboutError}
  error={error}
  isLoading={isLoading}
  isSubmitDisabled={isSubmitDisabled}
  setProfileImageUploaded={setProfileImageUploaded}
  setImageSelected={setImageSelected}
/>
```

## Custom Hook

### `useOnboarding`

Encapsulates all onboarding business logic including:

- **Form State Management**: Handles all form data and validation
- **API Integration**: Manages profile submission to backend
- **UI State**: Controls component visibility and loading states
- **Error Handling**: Centralized error management
- **Navigation**: Handles post-submission routing

**Returns:**

```javascript
{
  // State
  showSecondButton,
  hideImageUpload,
  profileImageUploaded,
  imageSelected,
  isLoading,
  error,
  aboutError,
  formData,
  isSubmitDisabled,

  // Actions
  setShowSecondButton,
  setHideImageUpload,
  setProfileImageUploaded,
  setImageSelected,
  handleChange,
  submitProfile,
}
```

**Usage:**

```jsx
import { useOnboarding } from '../hooks/onboarding'

const MyComponent = () => {
  const { formData, handleChange, submitProfile, isLoading, error } =
    useOnboarding()

  // Component implementation
}
```

## Refactoring Benefits

### Before Refactoring

- **279 lines** in a single component
- Mixed business logic and UI concerns
- Difficult to test individual pieces
- Hard to reuse form components
- Complex state management scattered throughout

### After Refactoring

- **Main component reduced to ~60 lines**
- Clear separation of concerns
- Testable individual components
- Reusable form components
- Centralized state management in custom hook

### Key Improvements

1. **Maintainability**: Smaller, focused components are easier to understand and modify
2. **Testability**: Individual components can be tested in isolation
3. **Reusability**: Form components can be reused in other contexts
4. **Developer Experience**: Clear component boundaries and prop interfaces
5. **Performance**: Potential for better memoization and optimization

## Usage Example

```jsx
import { Nav } from '../components/layout'
import ImageUpload from './ImageUpload'
import { OnboardingHeader, OnboardingForm } from '../components/onboarding'
import { useOnboarding } from '../hooks/onboarding'

const Onboarding = () => {
  const {
    showSecondButton,
    hideImageUpload,
    formData,
    handleChange,
    submitProfile,
    // ... other hook returns
  } = useOnboarding()

  return (
    <div className="background-color">
      <div className="onboarding overlay-onboarding">
        <Nav minimal={true} setShowModal={() => {}} showModal={false} />
        <div className="auth-modal onboarding">
          <OnboardingHeader />

          {!hideImageUpload && (
            <ImageUpload
              setShowSecondButton={setShowSecondButton}
              setHideImageUpload={setHideImageUpload}
            />
          )}

          {showSecondButton && (
            <OnboardingForm
              formData={formData}
              handleChange={handleChange}
              submitProfile={submitProfile}
              // ... other props
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

## Future Enhancements

1. **Form Validation**: Add comprehensive client-side validation
2. **Progress Indicator**: Add step-by-step progress visualization
3. **Auto-save**: Implement draft saving functionality
4. **Accessibility**: Enhanced ARIA labels and keyboard navigation
5. **Animation**: Add smooth transitions between steps
6. **Mobile Optimization**: Responsive design improvements
7. **Testing**: Add comprehensive unit and integration tests

## Dependencies

- React (hooks)
- react-router-dom (navigation)
- react-cookie (user session)
- axios (API calls)
- lucide-react (icons)

## Related Components

- `ImageUpload` - AI-powered dog image analysis
- `SimpleImageUpload` - Basic profile image upload
- `Nav` - Navigation component
