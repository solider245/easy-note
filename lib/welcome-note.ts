import { Note } from './types';

export const WELCOME_NOTE_ID = 'welcome-note';

export const getWelcomeNote = (): Note => {
    const now = Date.now();
    return {
        id: WELCOME_NOTE_ID,
        title: '👋 Welcome to Easy Note!',
        content: `
# Getting Started with Easy Note

Welcome to your new premium Markdown note-taking experience!

## 🚀 Two Storage Modes

Currently, you might be seeing a **DEMO MODE** banner at the top. Here's what that means:

1.  **Demo Mode (Memory)**: Your notes are stored in your browser's session memory. If you refresh or close the tab, they will be lost. This is perfect for trying out the editor!
2.  **Persistent Mode (Vercel Blob)**: Your notes are stored securely in the cloud.

### How to enable Persistence:
1.  Go to your **Vercel Project Dashboard**.
2.  Click the **Storage** tab.
3.  Click **Create Database** and select **Blob**.
4.  Connect it to this project.
5.  **Redeploy** your app. The banner will disappear, and your notes will be saved forever!

## ✍️ The Editor (Milkdown)

This is a WYSIWYG Markdown editor. You can:
- Type standard Markdown (e.g., \`#\` for headers, \`**\` for bold).
- Use **Slash Commands**: Type \`/\` to see a list of formatting options.
- **Select text** to see the hover toolbar.

## 🛠 Future Plans
Check the [GitHub Roadmap](https://github.com/solider245/easy-note) for upcoming features like **AI Writing Assistant** and **Database Integration**.

Enjoy writing!
`,
        createdAt: now,
        updatedAt: now,
        isPinned: false,
        deletedAt: null,
    };
};
