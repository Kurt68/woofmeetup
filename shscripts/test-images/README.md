# Test Images Directory

This directory contains test images for the WoofMeetup signup script.

## Directory Structure

```
test-images/
├── dogs/           # Dog profile images
│   ├── dog1.jpg
│   ├── dog2.jpg
│   └── dog3.jpg
└── profiles/       # User profile images
    ├── profile1.jpg
    ├── profile2.jpg
    └── profile3.jpg
```

## Quick Start

### Download Sample Images

```bash
cd /Users/kurt/code/woof-meetup/shscripts/test-images
./download-sample-images.sh
```

This will download placeholder images from picsum.photos.

### Add Your Own Images

You can also add your own images:

```bash
# Add dog images
cp /path/to/your/dog-photo.jpg dogs/dog1.jpg

# Add profile images
cp /path/to/your/profile-photo.jpg profiles/profile1.jpg
```

## Image Requirements

- **Format**: JPG or PNG
- **Dog images**: Any size (will be resized by server)
- **Profile images**: Any size (will be resized by server)
- **Naming**: Must match pattern `dog{N}.jpg` or `profile{N}.jpg` where N is 1, 2, or 3

## How Images Are Used

When you run `./signup.sh 1`, the script will:

1. Look for `dogs/dog1.jpg` (or `.png`)
2. Look for `profiles/profile1.jpg` (or `.png`)
3. Upload them to the server if found
4. Continue without them if not found

## Troubleshooting

### Images not uploading?

Check that:

- Files exist in the correct directories
- Files have correct names (dog1.jpg, profile1.jpg, etc.)
- Files are valid JPG or PNG images
- Server is running on http://localhost:8000

### Images show as "undefined" in UI?

This means CloudFront is not configured. The images ARE uploaded to S3, but the UI can't generate signed URLs.

**Solution**: Add CloudFront keys to your `.env` file:

```env
CLOUDFRONT_KEY_PAIR_ID=your_key_pair_id
CLOUDFRONT_PRIVATE_KEY=your_private_key
```

## More Information

See `../auth/SIGNUP_FEATURES.md` for complete documentation.
