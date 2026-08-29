# VARCAS Automobiles QC Management System

A web-based Quality Control (QC) Management System developed for VARCAS Automobiles to digitalize the vehicle quality inspection process.

The system replaces the traditional paper-based QC checklist with a centralized digital platform for Workers, Supervisors, and Administrators.

---

## 🚀 Features

### 👷 Worker
- Worker login
- Vehicle identification using chassis number
- Start new vehicle inspection
- 57-item Quality Check List
- Mark inspection items as PASS or FAIL
- Add remarks where required
- Inspection progress tracking
- Inspection results are saved to MySQL
- Results remain available after page refresh

### 👨‍💼 Supervisor
- Supervisor login
- View vehicle inspections
- Review completed inspections
- Review failed inspection items
- Manage inspection status
- Search inspections using vehicle/chassis information

### 👨‍💻 Administrator
- Admin login
- Manage users
- Manage QC checklist
- Add/edit checklist information
- View inspection information
- Access reports and inspection data

---

## 🛠️ Technology Stack

### Frontend
- React
- Vite
- JavaScript
- HTML
- CSS

### Backend
- Node.js
- Express.js

### Database
- MySQL 8.0

### Installer
- Inno Setup
- Bundled Node.js runtime
- Bundled MySQL runtime

---

## 📁 Project Structure

```text
VARCAS-QC-Management-System/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── mysql/
│   └── MySQL runtime files
│
├── qc_management_system.sql
├── Start-VARCAS.cmd
├── Setup-Database.cmd
├── VARCAS-Installer.iss
└── .gitignore
