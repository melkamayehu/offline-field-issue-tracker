# Offline Field Issue Tracker

An offline-first field issue reporting application built with React, Node.js, Express, and PostgreSQL.

The application allows field users to create and manage issue reports even when they do not have an internet connection. Reports are stored locally and synchronized with the server when connectivity becomes available.

## Features

* Create field issue reports
* Store reports locally using IndexedDB
* Continue working when offline
* Track synchronization state
* Automatically synchronize pending reports when connectivity returns
* Prevent duplicate server records during sync retries
* Manage report status through a controlled workflow
* View report history
* Persist reports on the server using PostgreSQL
* Validate required report fields
* Handle invalid workflow transitions
* Preserve reports when synchronization fails
* Automated tests for important application behavior

## Tech Stack

### Frontend

* React
* Vite
* IndexedDB
* `idb`

### Backend

* Node.js
* Express
* PostgreSQL
* `pg`
* CORS
* dotenv

### Testing

* Jest

## Project Structure

```text
offline-field-issue-tracker/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ReportForm.jsx
│   │   │   └── ReportList.jsx
│   │   ├── db/
│   │   │   └── database.js
│   │   ├── sync/
│   │   │   └── syncManager.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── tests/
│   │   ├── workflow.test.js
│   │   ├── duplicate-sync.test.js
│   │   ├── validation.test.js
│   │   └── offline-storage.test.js
│   ├── db.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Architecture

```text
                 ┌─────────────────────┐
                 │   React Frontend    │
                 └──────────┬──────────┘
                            │
                 ┌──────────┴──────────┐
                 │                     │
                 ▼                     ▼
        ┌─────────────────┐    ┌─────────────────┐
        │    IndexedDB    │    │ Node + Express  │
        │ Local Storage   │    │    REST API     │
        └────────┬────────┘    └────────┬────────┘
                 │                      │
                 │      Sync Manager    │
                 └──────────────────────┘
                                        │
                                        ▼
                              ┌─────────────────┐
                              │   PostgreSQL    │
                              │  Server Storage │
                              └─────────────────┘
```

The frontend communicates directly with IndexedDB for local persistence and with the Express API when server communication is available.

The sync manager is responsible for moving locally stored reports to the server.

## Setup & Run Instructions

### Prerequisites

Make sure you have installed:

* Node.js
* PostgreSQL
* Git

### 1. Clone the repository

```bash
git clone https://github.com/melkamayehu/offline-field-issue-tracker.git
cd offline-field-issue-tracker
```

### 2. Set up the PostgreSQL database

Create a PostgreSQL database named:

```text
offline_field_issue_tracker
```

Connect to the database and create the required tables:

```sql
CREATE TABLE reports (
    id UUID PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    reported_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sync_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE report_history (
    id UUID PRIMARY KEY,
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Configure the backend

Open a terminal in the project directory:

```bash
cd server
npm install
```

Create a file named `.env` inside the `server/` directory:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/offline_field_issue_tracker
```

Replace `YOUR_PASSWORD` with your local PostgreSQL password.

Do not commit the `.env` file to GitHub.

### 4. Start the backend

From the `server/` directory:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

The API root can be checked at:

```text
http://localhost:5000/
```

### 5. Install frontend dependencies

Open a second terminal:

```bash
cd client
npm install
```

### 6. Start the frontend

From the `client/` directory:

```bash
npm run dev
```

Vite will display the local development URL, usually:

```text
http://localhost:5173
```

If that port is already in use, Vite may select another available port and display it in the terminal.

Open the displayed URL in a browser.

### 7. Run the tests

Open a terminal in the `server/` directory:

```bash
npm test
```

The test suite covers:

* Valid workflow transitions
* Invalid workflow transitions
* Duplicate synchronization identity
* Required report fields
* Pending offline state
* Failed synchronization state

## Report Workflow

Reports follow a controlled status workflow:

```text
Draft
  ↓
Submitted
  ↓
Assigned
  ↓
In Progress
  ↓
Resolved
```

A submitted report may also be rejected:

```text
Submitted → Rejected
```

The backend validates status transitions.

Examples of invalid transitions include:

* Draft → Resolved
* Resolved → Draft
* Rejected → In Progress

Invalid transitions return an error instead of changing the report.

## Offline-First Strategy

When a user creates a report, it is first saved to IndexedDB.

Each report receives a client-generated UUID. This gives the report a stable identity before it reaches the server.

Reports contain a synchronization state:

```text
pending → syncing → synced
             │
             └────→ failed
```

### Pending

The report exists locally but has not yet been synchronized.

### Syncing

The application is currently attempting to send the report to the server.

### Synced

The server has accepted the report.

### Failed

Synchronization failed. The report remains stored locally instead of being deleted, allowing another synchronization attempt.

## Synchronization Strategy

The application attempts synchronization:

1. When the application starts.
2. When the browser reports that internet connectivity has returned.

The sync manager searches IndexedDB for reports with:

* `pending`
* `failed`
* `syncing`

states.

Each report is then sent to the backend.

A synchronization lock prevents multiple synchronization processes from running simultaneously within the same browser session.

If synchronization fails, the report is marked as `failed` and remains in IndexedDB.

## Duplicate Prevention

Each report has a client-generated UUID.

The same UUID is used when the report is synchronized with the server.

The server database uses this UUID as the primary key:

```sql
id UUID PRIMARY KEY
```

The API also uses:

```sql
ON CONFLICT (id) DO NOTHING
```

If a synchronization request is retried with the same report ID, PostgreSQL does not create another report.

Instead, the existing report is returned.

This prevents duplicate server records when a request is retried.

## History

Report history is stored separately from the current report state.

The `report_history` table records events such as:

* Report creation
* Successful synchronization
* Synchronization failure
* Status changes

For example:

```text
CREATED
SYNCED
STATUS_CHANGED
STATUS_CHANGED
```

Status changes also record the previous and new status.

This allows the application to show the report's history without replacing the current state stored in the `reports` table.

## Database Design

### `reports`

The `reports` table stores the current state of each report.

Important fields include:

| Field          | Purpose                      |
| -------------- | ---------------------------- |
| `id`           | Unique report UUID           |
| `category`     | Issue category               |
| `description`  | Issue description            |
| `location`     | Issue location               |
| `priority`     | Issue priority               |
| `status`       | Current workflow status      |
| `reported_at`  | Date and time reported       |
| `created_at`   | Server creation timestamp    |
| `updated_at`   | Last server update timestamp |
| `sync_version` | Server-side version counter  |

### `report_history`

The `report_history` table stores historical events associated with reports.

Important fields include:

| Field        | Purpose                         |
| ------------ | ------------------------------- |
| `id`         | Unique history event UUID       |
| `report_id`  | Associated report               |
| `event_type` | Type of event                   |
| `old_status` | Previous status when applicable |
| `new_status` | New status when applicable      |
| `message`    | Additional information          |
| `created_at` | Event timestamp                 |

## API Endpoints

### Create report

```text
POST /api/reports
```

Creates a new report on the server.

The endpoint also supports retry-safe creation using the report UUID.

### Get reports

```text
GET /api/reports
```

Returns reports stored on the server.

### Change report status

```text
PATCH /api/re
```
