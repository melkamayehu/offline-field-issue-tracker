# Offline Field Issue Tracker

A small full-stack application for reporting and tracking field issues such as road damage, water problems, and electrical faults.

The main goal of this project is to make reporting useful even when the person using the application temporarily has no internet connection. Reports are saved locally first and synchronized with the server when connectivity becomes available again.

## Features

* Create field issue reports
* Save reports locally using IndexedDB
* Continue creating reports while offline
* Show the synchronization state of each report
* Automatically synchronize pending reports when the connection returns
* Prevent duplicate server records when a report is synchronized more than once
* Move reports through a controlled workflow
* View report history
* Store reports permanently in PostgreSQL
* Validate required report fields
* Handle invalid workflow transitions
* Keep failed reports available for retry
* Include automated tests for important application logic
* Include demo data for testing the application

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

### Development and Testing

* npm
* Jest
* Git/GitHub
* VS Code

## Project Structure

```text
offline-field-issue-tracker/
│
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
│   ├── package.json
│   └── package-lock.json
│
├── server/
│   ├── tests/
│   │   ├── workflow.test.js
│   │   ├── duplicate-sync.test.js
│   │   ├── validation.test.js
│   │   └── offline-storage.test.js
│   ├── db.js
│   ├── server.js
│   ├── seed.sql
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```

## How the Application Works

The application has two main sides.

The frontend runs in the browser and is responsible for creating and displaying reports. It uses IndexedDB so that reports can still be saved when there is no internet connection.

The backend provides the API and stores the main server-side copy of the reports in PostgreSQL.

The basic architecture is:

```text
              React Frontend
              /            \
             /              \
       IndexedDB          Express API
        (local)                |
                               |
                          PostgreSQL
                           (server)
```

The synchronization manager connects the local storage and the backend.

## Offline-First Approach

A report is given a UUID when it is created.

The report is first saved to IndexedDB with a synchronization state such as:

```text
pending
```

This means the report exists locally but has not yet been synchronized with the server.

When an internet connection is available, the synchronization process looks for reports that are waiting to be synchronized.

The normal flow is:

```text
pending → syncing → synced
                    |
                    └── failed
```

If synchronization fails, the report is not deleted. It is marked as `failed` so it can be tried again later.

This is important because losing a field report because of a temporary network problem would be worse than leaving it pending for another synchronization attempt.

## Synchronization and Duplicate Prevention

Each report gets its own UUID on the client.

The same UUID is sent to the backend when the report is synchronized.

The PostgreSQL `reports` table uses the UUID as its primary key. The API also uses:

```sql
ON CONFLICT (id) DO NOTHING
```

This means that if the same report is sent more than once, PostgreSQL does not create another copy.

The backend then returns the existing report.

I also tested this behavior manually by sending the same report ID multiple times and checking the database. The database contained only one record for that ID.

There is also a small synchronization lock in the frontend so that two synchronization processes do not run at the same time during development.

## Report Workflow

Reports follow a controlled workflow:

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

A report can also move from:

```text
Submitted → Rejected
```

Only defined transitions are allowed.

For example:

```text
Draft → Submitted        valid
Submitted → Assigned     valid
Assigned → In Progress   valid
In Progress → Resolved   valid
Submitted → Rejected     valid
```

Examples of invalid transitions include:

```text
Draft → Resolved
Resolved → Draft
Rejected → In Progress
```

The frontend only presents the allowed next states, while the backend also checks the transition. This prevents invalid workflow changes from being accepted simply by calling the API directly.

## Report History

Important events are stored in a separate `report_history` table.

For example, a report can have history such as:

```text
CREATED
STATUS_CHANGED
SYNCED
SYNC_FAILED
```

Status changes record both the old and new status.

For example:

```text
Draft → Submitted
Submitted → Assigned
Assigned → In Progress
```

Keeping history separately means the `reports` table can represent the current state while the history table keeps a record of what happened to the report.

## Database Design

There are two main tables.

### `reports`

Stores the current version of each report.

Important fields include:

* `id`
* `category`
* `description`
* `location`
* `priority`
* `status`
* `reported_at`
* `created_at`
* `updated_at`
* `sync_version`

### `report_history`

Stores events associated with reports.

Important fields include:

* `id`
* `report_id`
* `event_type`
* `old_status`
* `new_status`
* `message`
* `created_at`

Each history record references a report through `report_id`.

## API

The backend currently provides these main endpoints:

| Method | Endpoint                   | Purpose              |
| ------ | -------------------------- | -------------------- |
| POST   | `/api/reports`             | Create a report      |
| GET    | `/api/reports`             | Get reports          |
| PATCH  | `/api/reports/:id/status`  | Change report status |
| GET    | `/api/reports/:id/history` | Get report history   |
| POST   | `/api/reports/:id/history` | Add a history event  |

The API returns appropriate error responses for missing required fields, invalid status transitions, missing reports, and server/database errors.

## Validation and Error Handling

Reports require:

* Category
* Description
* Location
* Priority
* Date/time

The backend checks these required fields before creating a report.

Workflow changes are also validated against the allowed transition list.

If a synchronization request fails, the local report is kept and marked as `failed` instead of being removed.

## Setup

### Prerequisites

You will need:

* Node.js
* npm
* PostgreSQL
* Git

### 1. Clone the repository

```bash
git clone https://github.com/melkamayehu/offline-field-issue-tracker.git
cd offline-field-issue-tracker
```

### 2. Set up PostgreSQL

Create the database:

```sql
CREATE DATABASE offline_field_issue_tracker;
```

Connect to it:

```text
\c offline_field_issue_tracker
```

Create the tables using the SQL schema in the project documentation or the following:

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

Create:

```text
server/.env
```

Add your local PostgreSQL connection string:

```text
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/offline_field_issue_tracker
```

Replace `YOUR_PASSWORD` with your own PostgreSQL password.

The `.env` file is ignored by Git and should not be committed.

### 4. Install backend dependencies

```bash
cd server
npm install
```

### 5. Start the backend

```bash
npm run dev
```

The API runs on:

```text
http://localhost:5000
```

### 6. Install frontend dependencies

Open another terminal:

```bash
cd client
npm install
```

### 7. Start the frontend

```bash
npm run dev
```

Vite will show the local frontend URL in the terminal, normally:

```text
http://localhost:5173
```

## Demo Data

The project includes:

```text
server/seed.sql
```

This provides a few sample reports with different priorities and workflow states.

To load the demo data:

```bash
cd server
psql -U postgres -d offline_field_issue_tracker -f seed.sql
```

The demo data includes examples such as:

* A high-priority road issue
* A water issue currently in progress
* A resolved electricity issue

The seed file uses fixed UUIDs and `ON CONFLICT DO NOTHING`, so running it again does not create duplicate demo reports.

## Running Tests

The backend contains a small Jest test suite.

From the `server` directory:

```bash
npm test
```

The current suite contains **9 tests across 4 test files**.

The tests focus on behaviors that are important to the application:

* Valid workflow transitions
* Invalid workflow transitions
* Required-field validation
* Duplicate synchronization identity
* Keeping failed/offline reports available for retry

The tests are intentionally small and focus on core logic. They are not a full end-to-end test suite.

## Manual QA Checklist

I also tested the application manually.

### Report creation

* [x] Create a report with all required fields
* [x] Report appears in the saved reports list
* [x] Required fields prevent incomplete submissions

### Offline behavior

* [x] Turn the browser offline
* [x] Create a report
* [x] Report is saved locally
* [x] Report shows an unsynchronized state
* [x] Refresh the page
* [x] Report remains available

### Synchronization

* [x] Restore the network connection
* [x] Pending report is synchronized
* [x] Report changes to `synced`
* [x] Same report ID does not create duplicate server records

### Workflow

* [x] Draft → Submitted
* [x] Submitted → Assigned
* [x] Assigned → In Progress
* [x] In Progress → Resolved
* [x] Submitted → Rejected
* [x] Invalid transitions are rejected

### History

* [x] Creation event is recorded
* [x] Status changes are recorded
* [x] History can be viewed from the application

### Database

* [x] Reports are stored in PostgreSQL
* [x] History is stored separately
* [x] Duplicate report IDs do not create duplicate records

## Assumptions and Design Decisions

A few decisions were made to keep the project within the exercise's time limit.

### No authentication

Authentication and user accounts were not implemented because they were not required by the exercise.

### Client-generated UUIDs

Report IDs are generated on the client instead of waiting for the server.

This is useful for an offline-first application because a report can have an ID even when the device has no connection.

### Local storage and server storage

IndexedDB is used for local/offline storage.

PostgreSQL is the main persistent server-side storage.

### Workflow validation

Workflow transitions are explicitly defined instead of allowing arbitrary status changes.

### History is separate

The current report state is stored in `reports`, while historical events are stored in `report_history`.

### Conflict handling

The project considers the server to be the source of truth when server and local data disagree.

A `sync_version` field is included to track server-side changes.

A full optimistic concurrency/conflict-resolution system was outside the scope of this six-hour implementation.

## Known Limitations

This is a small exercise project rather than a production system.

Some limitations include:

* No authentication or authorization
* No real user roles
* No production deployment
* No advanced conflict-resolution interface
* Offline status changes are not fully queued like report creation
* Automated tests focus mainly on core logic rather than full browser/API integration
* The current synchronization system is intentionally simple
* The application uses a local development API URL
* More extensive accessibility and UI testing would be needed for production use

## What I Would Improve With More Time

If I had more time, I would improve:

1. Full integration and end-to-end testing
2. Better offline synchronization for status changes
3. More robust conflict detection and resolution
4. A clearer synchronization dashboard
5. Better filtering and searching of reports
6. Authentication and role-based permissions
7. More polished responsive UI
8. Production deployment
9. Better handling of date/time zones
10. More detailed automated failure and retry tests

## Development Time

Approximately **6 hours** were spent on the project, including:

* Planning and architecture
* Frontend development
* Backend/API development
* PostgreSQL setup
* IndexedDB integration
* Synchronization logic
* Workflow and history
* Testing
* Documentation
* Manual QA
* Git/GitHub setup

## AI-Assisted Development Disclosure

AI-assisted development tools were used during this project, primarily **ChatGPT**.

I used ChatGPT to help with:

* Understanding technologies I was learning, including React, Express, Node.js, PostgreSQL, IndexedDB, npm, and Git
* Planning the project structure
* Discussing the offline-first architecture and synchronization approach
* Drafting and debugging parts of the frontend and backend
* Troubleshooting development and environment errors
* Creating and reviewing test cases
* Improving documentation
* Thinking through edge cases such as duplicate synchronization, invalid workflow transitions, and failed synchronization

I did not treat generated code as automatically correct. I reviewed the code, ran the application locally, tested the API and database, ran the automated test suite, and performed manual QA.

During development, some generated suggestions were changed or rejected when they did not match the actual project or would have added unnecessary complexity for the scope of the exercise.

For example, I kept the synchronization design relatively small rather than adding a more complex production-grade conflict-resolution system. I also verified duplicate prevention directly against PostgreSQL rather than relying only on the generated implementation.

The final implementation, testing, and decisions remain my responsibility.

## Git and Source Control

The project was developed incrementally using Git.

The commit history includes separate milestones such as:

```text
Set up frontend backend and database API
Add IndexedDB offline storage
Build local report form and report list
Add sync history and automated tests
Add project gitignore
Add project documentation
Add demo seed data
```

Dependencies, environment files, build output, logs, and other generated files are excluded through `.gitignore`.

The repository is publicly available on GitHub:

https://github.com/melkamayehu/offline-field-issue-tracker

