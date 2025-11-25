# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/006bf2c6-e878-4289-81cf-eaa46ffbe094

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/006bf2c6-e878-4289-81cf-eaa46ffbe094) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## AI Integration

This project uses **Puter AI** for AI-powered features:

- **No API key required** - Puter AI is accessible via `window.AI` in the browser
- **Free to use** - No cost for basic usage (rate-limited)
- **Privacy-focused** - Queries are processed client-side when possible
- **Fallback handling** - Graceful degradation if AI service is unavailable

### How it works

1. RAG context (student data, attendance, fees) is fetched server-side via Supabase Edge Functions
2. AI chat completions are handled client-side using Puter AI
3. All queries respect role-based access control (RBAC) for data security

### Usage in code

```typescript
import { puterChat, puterChatStream } from "@/lib/ai";

// Simple chat
const response = await puterChat([
  { role: "system", content: "You are a helpful assistant" },
  { role: "user", content: "Hello!" }
]);

// Streaming chat
await puterChatStream(
  messages,
  (chunk) => console.log(chunk), // onDelta
  () => console.log("Done"),     // onDone
  (err) => console.error(err)    // onError
);
```

For more information, visit [Puter.com](https://puter.com)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/006bf2c6-e878-4289-81cf-eaa46ffbe094) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
