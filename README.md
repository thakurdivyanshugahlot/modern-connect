# Modern Connect

A unified, real-time workspace hub that seamlessly integrates your Gmail and Google Calendar. Built with modern web technologies to provide a blazing-fast, centralized dashboard for your daily communications and agenda.

## 🧠 How It Works (In Simple Terms)

Imagine **Modern Connect** as a highly efficient personal assistant that sits between you and Google.

1. **The Core Engine (Next.js):** This is the main application that powers the sleek user interface you interact with and handles all the behind-the-scenes logic.
2. **The Translator (Corsair SDK):** Google's services (like Gmail and Calendar) are incredibly powerful but speak a very complex technical language. The Corsair library acts as our translator. It securely talks to Google on your behalf to read emails, send messages, and fetch your schedule without us having to reinvent the wheel.
3. **The Local Memory (PostgreSQL Database):** Instead of asking Google to load your emails every single time you click a button (which would be slow), our app keeps a synchronized, secure copy of your recent data in our own local database. This makes loading the dashboard and inbox incredibly fast.
4. **Real-Time Magic (Webhooks & SSE):** When someone sends you a new email, Google instantly sends a "ping" (called a webhook) to our server. Our server quickly updates its local memory and immediately pushes a notification to your screen. You see the new email pop up live—no page refresh required!

## 🧪 Testing & Google Cloud Console

Right now, this application is in the **Development & Testing Phase**. To interact with Google's APIs, we use a project set up in the **Google Cloud Console**. 

Because our OAuth consent screen (the "Log in with Google" page) is currently set to **"Testing"** mode by Google, not just anyone can log in. Only specific Google accounts that have been manually added to our "Test Users" list can access the app.

### Test Credentials
To test the application, please use the provided test account:
- **Test Email:** `[Enter your test email here]`
- **Test Password:** `[Enter your test password here]`

*(Note: If you need to test with a different Google account, you must first add that email address to the "Test Users" section in the Google Cloud Console under APIs & Services > OAuth consent screen).*

## 🛠️ Technical Stack & Architecture

- **Frontend & Backend Framework:** Next.js 15 (App Router, Server Components, Server Actions)
- **Database:** PostgreSQL 17 (Relational data storage)
- **ORM (Database Communication):** Drizzle ORM (Type-safe database interactions)
- **Authentication:** better-auth
- **Google Integrations:** Corsair SDK (`@corsair-dev/gmail`, `@corsair-dev/googlecalendar`)
- **Styling:** Tailwind CSS, framer-motion, and shadcn/ui components

## 🚀 Getting Started Locally

1. **Set up the Infrastructure**
   Start the local PostgreSQL database using Docker:
   ```bash
   docker compose up -d
   ```

2. **Database Migrations**
   Generate and apply the database schema:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

3. **Start the Development Server**
   Run the Next.js dev server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Folder Structure

- `src/app/`: Next.js App Router pages, layouts, and API routes.
- `src/app/api/webhooks/`: Endpoints where Google pings us with real-time updates.
- `src/components/`: Reusable UI components (buttons, cards, etc.).
- `src/server/db/`: Database configuration, schemas, and queries.
- `src/server/lib/`: Core logic including Corsair setup, Authentication, and real-time notification utilities.