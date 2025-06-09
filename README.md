# Code Index - AI-Powered Code Analysis

A comprehensive Next.js application that indexes your code projects and provides AI-powered chat functionality to help you understand your codebase.

## Features

- 🚀 **Project Management**: Create and manage multiple code projects
- 🔍 **Code Indexing**: Automatic indexing using Upstash Vector for semantic search
- 🤖 **AI Chat**: Chat with AI about your codebase using multiple providers
- 📊 **Analytics**: View project statistics and indexing progress
- 🔧 **Multi-Provider Support**: OpenAI, Anthropic, Google AI, and OpenRouter
- 💾 **SQLite Database**: Local database with Prisma ORM
- 🎨 **Modern UI**: Beautiful interface built with Tailwind CSS and Radix UI

## Tech Stack

- **Frontend/Backend**: Next.js 14 with App Router
- **Database**: SQLite with Prisma ORM
- **Vector Database**: Upstash Vector for code embeddings
- **AI Providers**: OpenAI, Anthropic, Google AI, OpenRouter
- **UI**: Tailwind CSS, Radix UI components
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Upstash Vector database (for code indexing)
- At least one AI provider API key

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd code-index
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Database
DATABASE_URL="file:./dev.db"

# Upstash Vector (Required for indexing)
UPSTASH_VECTOR_REST_URL="your_upstash_vector_url"
UPSTASH_VECTOR_REST_TOKEN="your_upstash_vector_token"

# AI Providers (At least one required)
OPENAI_API_KEY="your_openai_key"
ANTHROPIC_API_KEY="your_anthropic_key"
GOOGLE_API_KEY="your_google_ai_key"
OPENROUTER_API_KEY="your_openrouter_key"
```

4. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Configuration

### Upstash Vector Setup

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Vector database
3. Copy the REST URL and Token to your `.env` file

### AI Provider Setup

Configure at least one AI provider:

- **OpenAI**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Anthropic**: Get API key from [Anthropic Console](https://console.anthropic.com/)
- **Google AI**: Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **OpenRouter**: Get API key from [OpenRouter](https://openrouter.ai/keys)

## Usage

### Creating a Project

1. Click "New Project" on the homepage
2. Enter project details (name, description, path)
3. Specify the local path to your code project
4. Click "Create Project"

### Indexing Code

1. Open a project
2. Click "Start Indexing" if the project isn't indexed
3. Wait for the indexing process to complete
4. The system will scan and index all supported file types

### Chatting with AI

1. Once a project is indexed, use the chat interface
2. Ask questions about your code:
   - "What does the `authenticate` function do?"
   - "Explain the user authentication flow"
   - "How do I add a new API endpoint?"
   - "Find all database queries in this project"

### Supported File Types

The indexer supports common programming languages:

- JavaScript/TypeScript (.js, .jsx, .ts, .tsx)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Go (.go)
- Rust (.rs)
- And many more...

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── projects/          # Project pages
│   └── settings/          # Settings page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── projects/         # Project-related components
│   ├── settings/         # Settings components
│   └── navigation/       # Navigation components
├── lib/                  # Utility libraries
│   ├── ai-providers/     # AI provider implementations
│   ├── db.ts            # Database client
│   ├── vector.ts        # Vector database operations
│   ├── indexing.ts      # Code indexing logic
│   └── utils.ts         # Utility functions
└── prisma/              # Database schema
```

## API Endpoints

- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get project details
- `POST /api/projects/[id]/chat` - Chat with AI about project
- `POST /api/projects/[id]/index` - Start indexing project
- `GET /api/settings/providers` - Get AI provider status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review the code examples
# supercode
