# ChromeX

A powerful Chrome extension that enhances your writing experience with AI. ChromeX integrates directly into Gmail and other applications, providing AI-powered writing assistance right where you need it.

## Features

### Gmail Integration

- **AI Write Email**: Generate complete emails with customizable tones using OpenAI GPT-4o.
- **AI Refine Email**: Refine existing emails to adjust tone or improve content.
- **AI Rewrite Email**: Completely rewrite emails based on custom instructions.

### Additional Features

- Real-time content generation with streaming updates
- Multiple tone options: Professional, Friendly, Formal, Casual, Persuasive
- Custom prompt input for rewriting content
- Clean and modern UI that integrates seamlessly with Gmail

## Project Structure

```
├── background.js           # Background script for handling API keys securely
├── content.js              # Main content script for DOM manipulation
├── manifest.json           # Extension configuration
├── webpack.config.js       # Build configuration
├── src/
│   └── modules/
│       └── gmail-refine/   # Gmail refinement feature modules
│           ├── css-loader.js        # Handles CSS injection
│           ├── gmail-refine.js      # Main integration with Gmail
│           ├── index.js             # Module exports
│           ├── refine-handler.js    # API handling for refinement
│           └── refine-ui.js         # UI components for refinement
└── styles/
    └── gmail-refine.css    # Styles for the refine interface
```

## Development

### Setup

1. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Build

Build the extension for production:

```bash
npm run build-extension
```

Develop with auto-reloading:

```bash
npm run dev-extension
```

### Installing in Chrome

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
