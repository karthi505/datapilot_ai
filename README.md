# Project Setup Guide

This README provides clear steps to set up and run the backend of your project.

## 📁 Navigate to Backend Directory

```bash
cd backend
```

## 📦 Install Dependencies

```bash
npm install
```

## 🛠️ Generate Prisma Client

```bash
npx prisma generate
```

## 🔐 Environment Variables

Create a `.env` file inside the `backend` directory.

Example structure:

```
DATABASE_URL="your_postgres_connection_url"
```

Make sure the values match your actual environment.

## 🚀 Run the Development Server

```bash
npm run dev
```

Your backend will now start in development mode.

## ✅ Additional Notes

- Ensure PostgreSQL is running and accessible.
- If you make changes to your Prisma schema, always re-run:

  ```bash
    npx prisma migrate dev --name your_migration_name
  ```
