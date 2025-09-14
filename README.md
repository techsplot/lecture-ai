# 🎓 LectureLab AI

> Go beyond listening. Transform any lecture into interactive study materials, deep-dive summaries, and high-quality articles in minutes.

LectureLab AI is a web application that leverages the power of the Google Gemini API to turn passive learning into an active, engaging experience. Users can upload audio/video files or provide a YouTube link to a lecture, and the application will generate a comprehensive, gamified learning module and provide tools for deeper content analysis and creation.

---

## ✨ Key Features

-   **Multi-Source Input**: Upload local audio/video files or search for lectures directly from YouTube.
-   **AI-Powered Transcription**: Automatically generates a full text transcription of the lecture content.
-   **Interactive Learning Modules**:
    -   **Gamified Progression**: Learn chapter-by-chapter with a progress tracker.
    -   **Story-Driven Concepts**: Each key concept is presented as a "Story Scene" with an AI-generated illustration.
    -   **Knowledge Checks**: Test your understanding with multiple-choice and short-answer quizzes.
    -   **Flashcards**: Reinforce learning with classic front-and-back flashcards.
    -   **Problem-Solving**: Apply knowledge with unique, scenario-based challenges and get AI feedback on your solutions.
-   **AI Analysis Hub**:
    -   **Deep Summaries**: Get a concise summary and a bulleted list of key concepts.
    -   **Article Idea Generation**: Brainstorm article ideas with different tones (Professional, Casual, Educational).
    -   **Automated Content Creation**: Generate a full, well-structured article from an idea, using the lecture as a source.
-   **Text-to-Speech**: Listen to summaries and story scenes with built-in narration.
-   **Downloadable Results**: Export a complete summary of your learning module as a text file.

---

## 🛠️ Technology Stack

-   **Frontend**: React with TypeScript
-   **Styling**: Tailwind CSS
-   **AI Model**: Google Gemini API
    -   `gemini-2.5-flash` for transcription, analysis, and content generation.
    -   `imagen-4.0-generate-001` for generating concept illustrations.

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You will need [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/lecturelab-ai.git
    cd lecturelab-ai
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

### Environment Variables

This application requires access to the Google Gemini API. The API key must be available as an environment variable in the execution environment.

-   `API_KEY`: Your Google Gemini API key.

For local development, you would typically create a `.env.local` file in the root of the project and add the following line:

```
API_KEY=your_gemini_api_key_here
```

*Note: This assumes a standard setup with a bundler like Vite or Create React App that supports loading `.env` files.*

### Running the Application

Once the dependencies are installed and the environment variable is set, you can start the development server:

```sh
npm run dev
```

This will start the application, and you can view it in your browser at `http://localhost:5173` (or another port if specified).

---

## 🚢 Deployment

This application is a static frontend that makes direct calls to the Gemini API. For security in a production environment, it is highly recommended to route API calls through a backend proxy or serverless function to protect your API key.

However, for simple deployments, you can use services that support deploying static sites and managing environment variables securely:

-   **Vercel**
-   **Netlify**
-   **Cloudflare Pages**

When deploying, ensure you set the `API_KEY` environment variable in your hosting provider's project settings. This will make it available to the application at build time without exposing it in the frontend code.
