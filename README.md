# NeuroFleetX — Intelligent Fleet Management System

> A full-stack, AI-assisted fleet management platform built for the **Infosys Springboard 6.0 Internship**. NeuroFleetX enables real-time vehicle tracking, predictive maintenance, role-based fleet operations, and intelligent route planning — all within a single, unified platform.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Tech Stack](#tech-stack)
4. [Frontend](#frontend)
5. [Backend](#backend)
6. [Database](#database)
7. [Authentication — JWT & BCrypt](#authentication--jwt--bcrypt)
8. [Real-Time Tracking — WebSocket / STOMP](#real-time-tracking--websocket--stomp)
9. [Route Intelligence — OpenRouteService](#route-intelligence--openrouteservice)
10. [Predictive Maintenance Engine](#predictive-maintenance-engine)
11. [Reporting System](#reporting-system)
12. [Roles & Permissions](#roles--permissions)
13. [Project Structure](#project-structure)
14. [Setup & Running the Project](#setup--running-the-project)
15. [API Reference](#api-reference)
16. [Environment Configuration](#environment-configuration)

---

## Project Overview

NeuroFleetX is a **multi-role fleet management system** designed to streamline operations across four user types:

| Role | Capabilities |
|------|-------------|
| **Admin** | Full platform control — approve drivers/vehicles, manage users, view all reports |
| **Fleet Manager** | Monitor vehicle health, schedule maintenance, manage driver assignments |
| **Driver** | View assigned vehicle, manage trips, report vehicle health, track location |
| **Customer** | Book rides, track vehicle in real time, view booking history, leave reviews |

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        NEUROFLEETX PLATFORM                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              FRONTEND  (React 19 + Tailwind CSS)              │   │
│  │   Login  │  Admin  │  Driver  │  Manager  │  Customer         │   │
│  │  ──────────────────────────────────────────────────────────  │   │
│  │   Axios (REST)       │     SockJS + STOMP (WebSocket)         │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                      │ HTTP/8080          │ WS/8080                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              BACKEND  (Spring Boot 4 · Java 17)               │   │
│  │                                                              │   │
│  │   Spring Security + JWT  │  REST Controllers  │  WebSocket   │   │
│  │   BCrypt Password Enc.   │  Service Layer     │  Broker      │   │
│  │   OpenRouteService       │  Spring Data JPA   │  Scheduler   │   │
│  │   iText PDF              │  Apache Commons    │  Simulation  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                      │ JDBC/3306                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              DATABASE  (MySQL 8+)                             │   │
│  │   users · vehicles · bookings · trips · maintenance_alerts    │   │
│  │   vehicle_health_history · location_history · reviews · ...   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                │                                     │
│                    ┌───────────────────────┐                         │
│                    │  OpenRouteService API  │ (External)              │
│                    └───────────────────────┘                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Spring Boot | 4.0.1 | Core framework |
| Java | 17 | Runtime language |
| Spring Security | Included | Authentication & Authorization |
| JJWT (io.jsonwebtoken) | 0.11.5 | JWT token generation & validation |
| BCryptPasswordEncoder | Included | Password hashing |
| Spring Data JPA + Hibernate | Included | ORM / Database layer |
| MySQL Connector/J | Latest | JDBC driver for MySQL |
| Spring WebSocket + STOMP | Included | Real-time bidirectional communication |
| Apache Commons CSV | 1.10.0 | CSV report generation |
| iText PDF (kernel + layout) | 7.2.5 | PDF report generation |
| Lombok | Latest | Boilerplate code reduction |
| OpenRouteService API | External | Route calculation & optimization |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2.3 | UI framework |
| React Router DOM | 7.11.0 | Client-side routing |
| Axios | 1.13.2 | HTTP client (REST calls to backend) |
| Leaflet + React-Leaflet | 1.9.4 / 5.0.0 | Interactive map rendering |
| SockJS-Client | 1.6.1 | WebSocket SockJS fallback transport |
| @stomp/stompjs | 7.2.1 | STOMP protocol over WebSocket |
| Recharts | 3.7.0 | Data visualization / health charts |
| Lucide React | 0.562.0 | Icon library |
| Tailwind CSS | Custom | Utility-first styling |

### Database
| Technology | Purpose |
|-----------|---------|
| MySQL 8+ | Primary relational database |
| Spring JPA (ddl-auto=update) | Schema auto-management |

---

## Frontend

The frontend is a **React 19 Single Page Application (SPA)** located in `neuro-frontend/`.

### Folder Structure

```
neuro-frontend/src/
├── App.js                    # Root component: routes, layout, auth-guard
├── context/                  # React Context for global auth state
├── hooks/                    # Custom hooks (e.g., useWebSocket)
├── layouts/                  # Shared layout wrappers
├── pages/
│   ├── Login.jsx             # Unified login for all roles
│   ├── Register.jsx          # Driver/Customer registration
│   ├── Dashboard.jsx         # Role-based redirect after login
│   ├── DriverHome.jsx        # Driver's main dashboard
│   ├── DriverProfile.jsx     # Driver profile & document management
│   ├── FleetHealthPage.jsx   # Fleet-wide health overview (Manager)
│   ├── VehicleHealthPage.jsx # Per-vehicle health detail
│   ├── admin/                # Admin-only pages
│   ├── driver/               # Driver-specific pages
│   ├── manager/              # Manager-specific pages
│   └── customer/             # Customer-specific pages
├── components/               # Reusable UI components (modals, cards, charts)
└── services/                 # Axios service files for API communication
```

### Key Frontend Features

- **Role-Based Routing**: `App.js` uses React Router DOM with protected routes that redirect based on authenticated user role.
- **Auth Context**: JWT token is stored in `localStorage` post-login; all Axios requests attach `Authorization: Bearer <token>` in headers.
- **Interactive Maps**: Leaflet renders live vehicle location maps. Route polylines are drawn from OpenRouteService coordinates.
- **Real-Time Updates**: SockJS + STOMP client subscribes to backend WebSocket topics for live location and alert pushes.
- **Health Dashboards**: Recharts renders vehicle component health bars (engine, brake pads, tires, battery, oil, coolant), updating in real-time.
- **File Uploads**: Drivers upload documents (driving license, Aadhaar, profile photo) via `multipart/form-data` — stored in the `uploads/` directory on the backend.

---

## Backend

The backend is a **Spring Boot 4** application located in `neuro-backend/`, running on **port 8080**.

### Package Structure

```
com.neurofleetx/
├── NeuroBackendApplication.java         # Entry point (@SpringBootApplication)
├── config/
│   ├── SecurityConfig.java              # Spring Security, CORS, JWT filter registration
│   ├── JwtAuthenticationFilter.java     # Per-request JWT extraction & auth context
│   ├── WebSocketConfig.java             # STOMP WebSocket broker configuration
│   └── DataInitializer.java             # Seeds default admin/manager users on startup
├── controller/
│   ├── AuthController.java              # POST /api/auth/login, /register
│   ├── AdminController.java             # Admin management endpoints
│   ├── AdminRequestController.java      # Manager → Admin request system
│   ├── BookingController.java           # Customer bookings, live tracking window
│   ├── CustomerController.java          # Customer profile endpoints
│   ├── DriverController.java            # Driver profile, document upload, stats
│   ├── FleetManagerController.java      # Fleet manager info endpoints
│   ├── MaintenanceSubmissionController  # Driver maintenance reports
│   ├── MessageController.java           # Inter-user messaging
│   ├── ReportController.java            # PDF & CSV export endpoints
│   ├── ReviewController.java            # Post-trip reviews
│   ├── RouteController.java             # Route calculation via OpenRouteService
│   ├── SimulationController.java        # Vehicle health & location simulation
│   ├── TripController.java              # Trip CRUD management
│   ├── UserController.java              # General user lookup
│   ├── VehicleHealthController.java     # Vehicle health readings & alerts endpoints
│   ├── VehicleMaintenanceController.java# Maintenance schedule management
│   └── WebSocketController.java         # @MessageMapping WebSocket handlers
├── service/
│   ├── JwtService.java                  # JWT generation, validation, claim extraction
│   ├── BookingService.java              # Booking business logic
│   ├── TripService.java                 # Trip lifecycle management
│   ├── TripValidationService.java       # Validation: seat capacity, driver overlap
│   ├── VehicleHealthService.java        # Health score calculation & alert triggering
│   ├── VehicleHealthSimulationService   # Simulates health degradation over time
│   ├── VehicleSimulationService.java    # Simulates GPS location movement along route
│   ├── OpenRouteService.java            # Calls OpenRouteService API for routes
│   ├── MaintenanceAlertService.java     # Alert creation, resolution, notifications
│   ├── MaintenanceSubmissionService.java# Driver-submitted maintenance reports
│   ├── VehicleMaintenanceService.java   # Maintenance scheduling
│   ├── VehicleHoldService.java          # Automatic vehicle hold when health is critical
│   ├── ReportService.java               # Generates PDF/CSV reports
│   ├── ReviewService.java               # Review aggregation & rating calculation
│   └── FileStorageService.java          # Handles multipart file upload to disk
├── model/                               # JPA Entity classes (data models)
├── repository/                          # Spring Data JPA repository interfaces
├── dto/                                 # Data Transfer Objects (request/response shapes)
└── scheduler/                           # @Scheduled tasks for periodic health checks
```

### Service Communication Flow

```
Frontend (Axios) 
    → Controller (REST)
        → Service (Business Logic)
            → Repository (JPA)
                → MySQL (Persistence)
```

---

## Database

**MySQL 8+** is used as the primary relational database. The schema is auto-managed by Hibernate (`ddl-auto=update`).

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | All users — Admin, Manager, Driver, Customer. One table, role column differentiates. |
| `vehicles` | Fleet vehicles with health metrics, GPS, fuel, battery, hold status |
| `vehicle_images` | Many-to-one image URLs for vehicle photos |
| `bookings` | Customer bookings linking customer, driver, and vehicle |
| `trips` | Scheduled multi-point trips (pickup/dropoff coords, fare, status) |
| `location_history` | GPS breadcrumb trail for each vehicle over time |
| `maintenance_alerts` | Auto-generated alerts when vehicle health drops below thresholds |
| `maintenance_schedule` | Scheduled maintenance jobs assigned by managers |
| `maintenance_submissions` | Driver-reported maintenance work performed |
| `maintenance_thresholds` | Configurable health thresholds per vehicle component |
| `vehicle_health_history` | Time-series health metric snapshots for trend analysis |
| `reviews` | Post-trip driver ratings and customer comments |
| `admin_requests` | Requests sent from managers to admins |
| `messages` | In-platform user-to-user messages |

### Key Relationships

```
users (driver_id) ←── vehicles ──→ vehicle_images
  ↑                                    
users (customer_id, driver_id) ←── bookings ──→ vehicles
users ──→ reviews
vehicles ──→ maintenance_alerts
vehicles ──→ vehicle_health_history
vehicles ──→ location_history
```

---

## Authentication — JWT & BCrypt

### Password Hashing with BCrypt

All user passwords are **never stored in plaintext**. On registration, passwords are hashed using **BCryptPasswordEncoder** (Spring Security):

```java
// SecurityConfig.java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

BCrypt automatically generates a unique **salt** per password and embeds it in the hash. When a user logs in, `BCryptPasswordEncoder.matches(rawPassword, hashedPassword)` validates the credentials.

### JWT (JSON Web Token) — Library: `jjwt` v0.11.5

After successful login, the backend issues a **signed JWT** containing:
- `sub`: user email
- `role`: user role (ADMIN, DRIVER, CUSTOMER, MANAGER)
- `iat` / `exp`: issued-at and expiration timestamps

```
Header.Payload.Signature   ← sent as "Authorization: Bearer <token>"
```

**Files involved:**
- `JwtService.java` — token generation, validation, claim extraction (username, role)
- `JwtAuthenticationFilter.java` — `OncePerRequestFilter` that reads the `Authorization` header, validates the token, and populates Spring's `SecurityContextHolder`

### Request Authentication Flow

```
1. Client → POST /api/auth/login  { email, password }
2. Backend → BCrypt.matches() validates password
3. Backend → JwtService.generateToken() creates signed JWT
4. Response → { token: "eyJ..." }
5. Client stores token in localStorage
6. All subsequent requests: Authorization: Bearer eyJ...
7. JwtAuthenticationFilter intercepts → extracts role → sets SecurityContext
8. Controller executes with authenticated user & role authority
```

### CORS Policy

The backend explicitly allows cross-origin requests only from `http://localhost:3000` (React dev server):

```java
config.setAllowedOrigins(List.of("http://localhost:3000"));
config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
config.setAllowCredentials(true);
```

---

## Real-Time Tracking — WebSocket / STOMP

Live vehicle tracking is implemented via **STOMP over WebSocket** using SockJS as a transport fallback.

### Backend Configuration (`WebSocketConfig.java`)

```
Endpoint:     ws://localhost:8080/ws-tracking   (SockJS fallback enabled)
Broker prefix: /topic (pub-sub), /queue (point-to-point)
App prefix:    /app   (client → server @MessageMapping)
```

### WebSocket Topics

| Topic | Description |
|-------|-------------|
| `/topic/vehicle/{vehicleId}` | Live GPS updates for a specific vehicle |
| `/topic/trip/{tripId}` | Trip status updates |
| `/topic/manager/vehicles` | Fleet-wide vehicle status for manager dashboard |
| `/queue/notifications/{userId}` | Push notifications to individual users |

### Frontend Connection (SockJS + STOMP)

```javascript
// Connects via SockJS, subscribes to vehicle location updates
const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws-tracking'),
  onConnect: () => {
    client.subscribe(`/topic/vehicle/${vehicleId}`, (message) => {
      const location = JSON.parse(message.body);
      updateMapMarker(location.latitude, location.longitude);
    });
  }
});
client.activate();
```

### Location Simulation

`VehicleSimulationService.java` and `VehicleHealthSimulationService.java` simulate realistic GPS movement and health degradation. The `SimulationController` exposes REST endpoints to start/stop simulations per vehicle — broadcasting position updates to all WebSocket subscribers.

---

## Route Intelligence — OpenRouteService

**OpenRouteService** (ORS) is the external mapping & routing API used for:
- Calculating the optimal driving route between pickup and dropoff points
- Computing estimated trip duration and distance
- Returning route geometry (polyline coordinates) for map display

### Integration (`OpenRouteService.java` service)

```
API Endpoint: https://api.openrouteservice.org/v2/directions/driving-car
Auth:         Bearer token (API key in application.properties)
Format:       JSON — returns coordinates[], distance (meters), duration (seconds)
```

### Route Calculation Flow

```
1. Driver/Admin sets trip: origin coords + destination coords
2. RouteController → OpenRouteService.java → HTTP POST to ORS API
3. ORS returns: { routes: [{ geometry: { coordinates: [[lng,lat]...] } }] }
4. Backend parses route, stores distance/duration in Trip entity
5. Polyline coordinates sent to frontend
6. Leaflet renders the route on the interactive map
```

---

## Predictive Maintenance Engine

NeuroFleetX includes an AI-assisted predictive maintenance system that monitors vehicle health in real time.

### Vehicle Health Components Monitored

| Component | Metric |
|-----------|--------|
| Engine | `engineHealth` (0–100%) |
| Transmission | `transmissionHealth` (0–100%) |
| Brake Pads | `brakePadHealth` (0–100%) |
| Tires | `tireHealth` + individual pressure (FL/FR/RL/RR) |
| Battery | `batteryHealth` + voltage |
| Oil | `oilLevel` (0–100%) |
| Coolant | `coolantLevel` (0–100%) |
| Overall | `healthScore` (weighted average) + `HealthStatus` enum |

### Alert System

`MaintenanceAlertService.java` compares live health readings against **configurable thresholds** stored in `maintenance_thresholds` table. When a component drops below its threshold:

1. A `MaintenanceAlert` record is created in the database.
2. A push notification is sent to the Fleet Manager via WebSocket.
3. If health is **critical**, `VehicleHoldService` automatically sets the vehicle's `holdStatus = ON_HOLD`, preventing new trip assignments.
4. Manager confirms maintenance → driver receives WebSocket notification.
5. Driver resolves the alert → health resets to 100% → alert is removed from all dashboards.

### Maintenance Scheduling

Managers can create scheduled maintenance entries via `VehicleMaintenanceController`. Drivers can submit maintenance work via `MaintenanceSubmissionController`. Full history is kept in `VehicleHealthHistory` for trend analysis and reports.

---

## Reporting System

`ReportController.java` and `ReportService.java` generate downloadable reports in two formats:

| Format | Library | Endpoint |
|--------|---------|----------|
| **PDF** | iText 7 (`com.itextpdf`) | `/api/reports/{type}/pdf` |
| **CSV** | Apache Commons CSV | `/api/reports/{type}/csv` |

### Report Types

- Fleet health summary
- Trip history & earnings
- Driver performance statistics
- Maintenance logs

---

## Roles & Permissions

Spring Security enforces role-based access at the API level. Each role maps to a `ROLE_` prefix authority:

| Endpoint Pattern | Allowed Roles |
|-----------------|---------------|
| `/api/auth/**` | Public (no auth) |
| `/uploads/**` | Public (file serving) |
| `/api/admin/**` | ROLE_ADMIN, ROLE_MANAGER |
| `/api/driver/**` | ROLE_DRIVER, ROLE_ADMIN |
| `/api/customer/**` | ROLE_CUSTOMER, ROLE_ADMIN |
| `/api/trips/**` | ROLE_DRIVER, ROLE_CUSTOMER, ROLE_ADMIN, ROLE_MANAGER |
| `/api/bookings/**` | Any authenticated user |
| `/api/health/fleet/**` | ROLE_MANAGER, ROLE_ADMIN |
| `/api/health/driver/**` | ROLE_DRIVER, ROLE_MANAGER, ROLE_ADMIN |

---

## Project Structure

```
NeuroFleetX/
├── neuro-backend/                  # Spring Boot backend
│   ├── src/main/java/com/neurofleetx/
│   │   ├── config/                 # Security, WebSocket, DataInit
│   │   ├── controller/             # 18 REST + WebSocket controllers
│   │   ├── service/                # 15 business logic services
│   │   ├── model/                  # 16 JPA entity classes
│   │   ├── repository/             # 15 Spring Data JPA repositories
│   │   ├── dto/                    # Request/Response DTOs
│   │   └── scheduler/              # Scheduled health check tasks
│   ├── src/main/resources/
│   │   └── application.properties  # DB, port, ORS API key config
│   ├── SqlScript.sql               # Initial schema creation script
│   ├── *.Migration.sql             # Incremental schema migrations
│   └── pom.xml                     # Maven dependencies
│
├── neuro-frontend/                  # React frontend
│   ├── src/
│   │   ├── pages/                  # Page-level components (by role)
│   │   ├── components/             # Reusable components
│   │   ├── services/               # Axios API service modules
│   │   ├── context/                # Auth context
│   │   ├── hooks/                  # Custom React hooks
│   │   └── App.js                  # Router + auth guards
│   └── package.json                # npm dependencies
│
└── README.md
```

---

## Setup & Running the Project

### Prerequisites

| Tool | Version |
|------|---------|
| Java JDK | 17+ |
| Maven | 3.9+ (or use included `mvnw`) |
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8+ |

---

### Step 1: Database Setup

1. Start your MySQL server.
2. Run the initial schema script:

```sql
-- In MySQL Workbench / CLI:
source d:/path/to/NeuroFleetX/neuro-backend/SqlScript.sql;
```

This creates the `neurofleetx` database with the `users`, `vehicles`, `bookings`, `feedbacks`, and `vehicle_images` tables.

Then run the migration scripts in order to add all newer tables:

```sql
source HealthMonitoringMigration.sql;
source HealthHistoryMigration.sql;
source MaintenanceAlertsMigration.sql;
source MaintenanceScheduleMigration.sql;
source MaintenanceThresholdsMigration.sql;
source UpdateScript.sql;
```

---

### Step 2: Backend Configuration

Open `neuro-backend/src/main/resources/application.properties` and update:

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/neurofleetx?useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=YOUR_MYSQL_USERNAME
spring.datasource.password=YOUR_MYSQL_PASSWORD

# OpenRouteService API Key (get yours free at openrouteservice.org)
openrouteservice.api.key=YOUR_ORS_API_KEY
openrouteservice.api.url=https://api.openrouteservice.org/v2/directions/driving-car
```

> **Note**: The `DataInitializer.java` will auto-seed a default **Admin** and **Manager** user on first startup if no users exist.

---

### Step 3: Run the Backend

```bash
cd neuro-backend

# Using Maven Wrapper (recommended)
./mvnw spring-boot:run

# Or on Windows
mvnw.cmd spring-boot:run
```

Backend starts on: **http://localhost:8080**

---

### Step 4: Run the Frontend

```bash
cd neuro-frontend

# Install dependencies
npm install

# Start dev server
npm start
```

Frontend starts on: **http://localhost:3000**

---

### Step 5: Access the Application

Open your browser and go to **http://localhost:3000**

Default seeded credentials (set by `DataInitializer.java`):

| Role | Email | Password |
|------|-------|----------|
| Admin | *(check DataInitializer.java)* | *(check DataInitializer.java)* |
| Manager | *(check DataInitializer.java)* | *(check DataInitializer.java)* |

New Drivers and Customers can self-register via the `/register` page.

---

## API Reference

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/login` | Public | Login with email + password → returns JWT |
| POST | `/api/auth/register` | Public | Register new Driver or Customer |

### Driver

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/driver/profile` | Driver | Get driver profile |
| PUT | `/api/driver/update` | Driver | Update profile info |
| POST | `/api/driver/upload-documents` | Driver | Upload license, Aadhaar, profile image |
| GET | `/api/driver/vehicle` | Driver | Get assigned vehicle |

### Admin

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/admin/drivers` | Admin/Manager | List all drivers |
| PUT | `/api/admin/verify-driver/{id}` | Admin | Approve/reject driver verification |
| GET | `/api/admin/vehicles` | Admin/Manager | List all vehicles |
| PUT | `/api/admin/approve-vehicle/{id}` | Admin | Approve vehicle |
| GET | `/api/admin/users` | Admin | Get all users |

### Bookings & Trips

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/bookings/create` | Customer | Create a new booking |
| GET | `/api/bookings/customer` | Customer | View customer's bookings |
| GET | `/api/bookings/track/{id}` | Customer | Get real-time tracking info |
| POST | `/api/trips/create` | Driver/Admin | Create a scheduled trip |
| GET | `/api/trips/driver` | Driver | Get driver's trips |
| PUT | `/api/trips/{id}/start` | Driver | Start a trip |
| PUT | `/api/trips/{id}/complete` | Driver | Complete a trip |

### Vehicle Health

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/health/fleet` | Manager/Admin | Fleet-wide health overview |
| GET | `/api/health/vehicle/{id}` | Authenticated | Vehicle health details |
| GET | `/api/health/alerts` | Driver/Manager/Admin | Active maintenance alerts |
| PUT | `/api/health/alerts/{id}/resolve` | Driver | Resolve a maintenance alert |

### Routes

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/routes/calculate` | Authenticated | Calculate route via OpenRouteService |

### Reports

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/reports/fleet/pdf` | Admin/Manager | Download fleet health PDF report |
| GET | `/api/reports/trips/csv` | Admin/Manager | Download trip history CSV |

---

## Environment Configuration

### Backend — `application.properties`

```properties
# Server
server.port=8080

# MySQL Database
spring.datasource.url=jdbc:mysql://localhost:3306/neurofleetx?useSSL=false&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=true

# File Upload Limits
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=50MB

# OpenRouteService
openrouteservice.api.key=YOUR_API_KEY
openrouteservice.api.url=https://api.openrouteservice.org/v2/directions/driving-car
```

### Frontend — Axios Base URL

The frontend Axios services point to `http://localhost:8080`. To change the backend URL, update all service files in `neuro-frontend/src/services/`.

---

## License

This project is developed under the **Infosys Springboard 6.0 Internship Program**.  
See [LICENSE](LICENSE) for details.

---

*Built with ❤️ by the NeuroFleetX team — Infosys Springboard 6.0*
