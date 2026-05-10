# NeuroFleetX Setup Guide

Since this is a full-stack project built with **Java Spring Boot (Backend)** and **React.js (Frontend)**, it does not use a single `requirements.txt` file (which is typical for Python projects). Instead, the dependencies are managed by **Maven (`pom.xml`)** for the backend and **npm (`package.json`)** for the frontend.

Here is the complete guide your friend will need to set up and run this project successfully without errors.

## Prerequisites
Before running the project, ensure your friend has the following software installed on their machine:
1. **Java Development Kit (JDK) 17 or higher** (for the backend).
2. **Node.js** (v14 or higher) and **npm** (for the frontend).
3. **MySQL Server** (for the database).
4. An IDE like **VS Code**, **IntelliJ IDEA**, or **Eclipse**.

---

## 1. Backend Setup (Spring Boot)

### Step 1.1: Database Setup
The backend relies on a MySQL database. Your friend needs to:
1. Open their MySQL Workbench or MySQL Command Line.
2. Create a new database named `neurofleetx` by running the following SQL command:
   ```sql
   CREATE DATABASE neurofleetx;
   ```

### Step 2.2: Update Application Properties
The backend connects to the database using credentials. Your friend must update the `application.properties` file with their own MySQL credentials.
1. Navigate to: `neuro-backend/src/main/resources/application.properties`
2. Change the following lines to match their MySQL setup:
   ```properties
   # Change 'root' if they use a different MySQL username
   spring.datasource.username=root
   
   # Change '0321@Yashusai' to their actual MySQL password!
   spring.datasource.password=their_mysql_password
   ```
*(Note: If they use a different port than 3306 for MySQL, they must also update the `spring.datasource.url` line.)*

### Step 1.3: Run the Backend
1. Open the `neuro-backend` folder in their IDE (like IntelliJ or Eclipse) or terminal.
2. If using the terminal, they can navigate to the backend directory and run:
   ```bash
   cd neuro-backend
   ./mvnw spring-boot:run
   ```
   *(On Windows, use `mvnw.cmd spring-boot:run`)*
3. The backend should now be running on `http://localhost:8080`.

---

## 2. Frontend Setup (React)

### Step 2.1: Install Dependencies
The frontend requires various Node modules.
1. Open a new terminal.
2. Navigate to the frontend directory:
   ```bash
   cd neuro-frontend
   ```
3. Install all required dependencies by running:
   ```bash
   npm install
   ```

### Step 2.2: Run the Frontend
1. Once installation is complete, start the React application:
   ```bash
   npm start
   ```
2. The frontend should automatically open in their browser at `http://localhost:3000`.

---

## Common Issues & Fixes
- **MySQL Connection Error**: Ensure the MySQL service is running and the credentials in `application.properties` are perfectly matching.
- **Port 8080 or 3000 is already in use**: If they get an error saying a port is busy, they can stop the process using that port, or change `server.port=8080` in `application.properties` for the backend, or run `PORT=3001 npm start` for the frontend.
- **CORS Issues**: Ensure that the backend `RouteController`, `TripController`, etc. have `@CrossOrigin` annotations allowing `http://localhost:3000` to access the endpoints.
