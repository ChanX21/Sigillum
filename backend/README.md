# Sigillum Backend (TypeScript)

This backend has been converted from JavaScript to TypeScript to provide better type safety, code organization, and developer experience.

## Key Features

- **Type Safety**: All API endpoints and service functions are now properly typed
- **Improved Documentation**: TypeScript interfaces clearly document data structures
- **Better Error Handling**: Type checking helps prevent runtime errors
- **Enhanced IDE Support**: Get better autocomplete and refactoring support

## Project Structure

```
backend/
├── controllers/     # Request handlers (TypeScript)
├── middleware/      # Express middleware
├── models/          # Mongoose models (TypeScript)
├── routes/          # API routes (TypeScript)
├── services/        # Business logic services
├── types/           # TypeScript type declarations
├── utils/           # Helper utilities (TypeScript)
├── uploads/         # Uploaded files directory
├── dist/            # Compiled JavaScript output
├── index.ts         # Main application entry point
└── tsconfig.json    # TypeScript configuration
```

## Development Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Run in development mode:
   ```
   npm run dev
   ```

3. Build for production:
   ```
   npm run build
   ```

4. Start production server:
   ```
   npm start
   ```

## Type Definitions

The codebase contains well-defined TypeScript interfaces for:

- Request/Response objects
- Authentication data
- Image processing results
- Mongoose models
- API payloads

## Environment Variables

Make sure to set up the following environment variables in your `.env` file:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/sigillum
UPLOAD_DIR=./uploads
SIGNATURE_SECRET=your-secret-key
```

## TypeScript Migration Notes

The backend was migrated from JavaScript to TypeScript with the following changes:

1. Added TypeScript and type definition packages
2. Created interfaces for all data structures
3. Added proper return types to all functions
4. Created type declaration files for external modules
5. Updated build and development scripts 