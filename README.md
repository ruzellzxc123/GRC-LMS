# GRC Learning Management System (GRC-LMS)

GRC-LMS is a web-based learning management system for students, professors, and administrators. It brings course materials, assessments, attendance, grading, announcements, and academic coordination into one application.

---

## Group Members & Roles

* **Pleras, Jan Angielo D.** - Project Manager
* **Mogote, Iro T.** - Lead Developer
* **Garcia, Ruzell M.** - Lead Developer
* **Arrogante, Jhon Carlo M.** - Frontend / UI-UX Developer
* **Fernandez, Jhane S.** - Backend / Database Administrator


Update this section with the group's names and actual roles.

---

## Tech Stack

* **Frontend:** React 19, TypeScript, Inertia.js, Tailwind CSS
* **Backend:** PHP 8.3+, Laravel 13
* **Database:** SQLite by default; MySQL can be configured
* **Tools & Version Control:** Composer, npm, Vite, Git

---

## System Requirements & Prerequisites

Install the following before setup:

* PHP 8.3 or later, with the extensions required by Laravel
* Composer
* Node.js and npm
* Git

SQLite is the default database, so a separate database server is not required for local development. MySQL/XAMPP can be used if configured in the environment file.

---

## Installation & Setup Instructions

### 1. Clone the repository

```powershell
git clone <repository-url>
cd grc-lms-main
```

Replace `<repository-url>` with the repository's GitHub clone URL.

### 2. Prepare the SQLite database

The application uses `database/database.sqlite` by default. Create the file if it is not already present:

```powershell
if (-not (Test-Path database/database.sqlite)) {
    New-Item -ItemType File -Path database/database.sqlite | Out-Null
}
```

### 3. Install and configure the application

From the project root, run:

```powershell
composer run setup
```

This project setup script installs PHP and JavaScript dependencies, creates `.env` from `.env.example` if needed, generates the Laravel application key, runs database migrations, and builds the frontend assets.

For MySQL, first create a database, then set the connection values in `.env` before running the migrations:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=grc_lms
DB_USERNAME=root
DB_PASSWORD=
```

The Laravel migrations create the schema; a separate SQL schema import is not required.

---

## Running the Application

Start the local development services with:

```powershell
composer run dev
```

This starts the Laravel server, Vite, the database queue listener, Reverb, and the scheduler. Open [http://localhost:8000](http://localhost:8000) in your browser.

To run only the Laravel server, use `php artisan serve`; in that case, start the frontend separately with `npm run dev`.

---

## Default Login Credentials

The database seeder creates one development **student** account. After running `php artisan db:seed`, use:

| Role | Email | Password |
|---|---|---|
| Student (development seed account) | `test@example.com` | `password` |
| Professor | No default account is seeded | Must be provisioned by an administrator |
| Administrator | No default account is seeded | Must be provisioned through your deployment's authorized setup process |

The seeded password is for local development only. Change it immediately if you use the account, and never use it in a deployed environment. A fresh setup does not run the database seeder automatically.

---

## Optional AI Configuration

AI-assisted features can use a provider configured in `.env`. Add the appropriate provider API key there if needed. Keep API keys private and do not commit `.env`.

---

## Tests and Code Checks

Run the backend test and code-check script with:

```powershell
composer run test
```

Frontend checks are available with:

```powershell
npm run lint:check
npm run format:check
npm run types:check
```
