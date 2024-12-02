
# HR Administration System

This project is a web-based HR Administration System built using the T3 stack with Next.js, TypeScript, Prisma, and Tailwind CSS.

## Prerequisites
- Node.js
- npm or yarn
- SQLite
- Git

## Getting Started

Follow the steps below to set up and run the project locally.

### 1. Clone the Repository
```bash
git clone https://github.com/Ailwei/hr-admin-system.git
cd hr-admin-system 
```

### 2 Install dependencies 
```bash
npm install
```

### 4. Set Up Environment 
#### 1. Set Up Environment Variables
#### 2. Add the following environment variables:
```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="<your_secret_key>"
```
### 5. Run Database Migrations
```bash
npx prisma migrate dev
```
### 6. Start the Development Server
```bash
npm run dev
```
### 7 . Access the Application
###### http://localhost:3000

### 8. Add Manager Instruction
Watch the video from 1:00 to 2:15 for instructions on adding a manager:
[Add Manager Instruction Video (1:00 to 2:15)](https://jam.dev/c/084fc5ea-a65c-4c85-8bb6-6563a4ff168b?t=1m0s)





