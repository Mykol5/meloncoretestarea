# MELON CORE

This project is the backend for the **Melon Application** — a platform built to streamline data collection, monitoring, reporting, geospatial insights, and impact evaluation for development operations.

> Built with [NestJS](https://nestjs.com/) and [MongoDB](https://www.mongodb.com/), this API powers all core functionalities for the **Kajari Platform**.

---

## 🚀 Technologies

- **NodeJS**
- **NestJS**
- **TypeScript**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**
- **Modular Architecture**
- **RESTful APIs**

---

## ⚙️ Getting Started

### ✅ Prerequisites

- Node.js (LTS recommended)
- npm v9.0.0 or higher
- MongoDB (local or Atlas)

### 🛠️ Installation

Clone the project:

```bash
git clone git@github.com:MelonNigeria/melon-core.git
cd melon-core
```

Install dependencies:

```bash
npm install
```

### 🛠️ Configuration

Create a `.env` file in the root directory and add the following environment variables:

```env
MONGODB_URI=mongodb://localhost:27017/melon
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 🏃‍♂️ Running the Application

Start the development server:

```bash
npm run start:dev
```

## 🔗 Complete API Endpoints Reference

This section outlines the full set of RESTful API endpoints available in the Melon Core backend. Organized by module, it provides HTTP methods, paths, and concise descriptions.

---

### 🔐 Authentication

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| POST   | `/auth/signup`        | User signup          |
| POST   | `/auth/login`         | User login           |
| POST   | `/auth/logout`        | Logout user          |
| POST   | `/auth/refresh-token` | Refresh access token |

---

### 📋 Reports Module

| Method | Endpoint                      | Description                      |
| ------ | ----------------------------- | -------------------------------- |
| POST   | `/reports/create`             | Create new report                |
| GET    | `/reports/all`                | Get all reports with filters     |
| GET    | `/reports/dashboard`          | Dashboard statistics             |
| GET    | `/reports/details/:id`        | Get single report                |
| GET    | `/reports/public/:shareToken` | Get public report by share token |
| PUT    | `/reports/update/:id`         | Update report                    |
| PATCH  | `/reports/:id/status`         | Update report status             |
| POST   | `/reports/:id/publish`        | Publish report                   |
| POST   | `/reports/:id/duplicate`      | Duplicate report                 |
| DELETE | `/reports/delete/:id`         | Delete report                    |
| GET    | `/reports/:id/share-link`     | Generate share link              |
| POST   | `/reports/:id/export`         | Export report data               |
| GET    | `/reports/categories`         | Get available categories         |

---

### 📊 Responses Module

| Method | Endpoint                                | Description                    |
| ------ | --------------------------------------- | ------------------------------ |
| POST   | `/responses/submit`                     | Submit response to report      |
| GET    | `/responses/report/:reportId`           | Get all responses for a report |
| GET    | `/responses/:id`                        | Get single response            |
| PUT    | `/responses/:id`                        | Update response                |
| DELETE | `/responses/:id`                        | Delete response                |
| GET    | `/responses/report/:reportId/analytics` | Response analytics             |
| POST   | `/responses/report/:reportId/export`    | Export responses               |
| GET    | `/responses/report/:reportId/summary`   | Get summary for report         |
| POST   | `/responses/bulk-import`                | Bulk import responses          |

---

### 📁 Portfolio Module

| Method | Endpoint                                  | Description                   |
| ------ | ----------------------------------------- | ----------------------------- |
| POST   | `/portfolio/create`                       | Create new project            |
| GET    | `/portfolio/all`                          | Get all projects with filters |
| GET    | `/portfolio/dashboard`                    | Dashboard stats               |
| GET    | `/portfolio/details/:id`                  | Get single project            |
| PUT    | `/portfolio/update/:id`                   | Update project                |
| PATCH  | `/portfolio/:id/status`                   | Update project status         |
| POST   | `/portfolio/:id/duplicate`                | Duplicate project             |
| DELETE | `/portfolio/delete/:id`                   | Delete project                |
| GET    | `/portfolio/:id/reports`                  | Get linked reports            |
| POST   | `/portfolio/:id/reports/link`             | Link report to project        |
| DELETE | `/portfolio/:id/reports/:reportId/unlink` | Unlink report from project    |
| GET    | `/portfolio/sectors`                      | Get available sectors         |
| GET    | `/portfolio/regions`                      | Get available regions         |
| POST   | `/portfolio/:id/export`                   | Export project data           |
| GET    | `/portfolio/:id/timeline`                 | Project timeline              |
| POST   | `/portfolio/:id/phases`                   | Add project phase             |
| PUT    | `/portfolio/:id/phases/:phaseId`          | Update project phase          |

---

### 🗺️ Geospatial Module

| Method | Endpoint                           | Description                     |
| ------ | ---------------------------------- | ------------------------------- |
| GET    | `/geospatial/projects`             | Get all projects with locations |
| GET    | `/geospatial/analytics`            | Geographic analytics            |
| GET    | `/geospatial/heatmap`              | Heatmap data                    |
| GET    | `/geospatial/coverage/:projectId`  | Project coverage area           |
| GET    | `/geospatial/nearby/:projectId`    | Nearby projects                 |
| POST   | `/geospatial/service-gaps`         | Calculate service gaps          |
| GET    | `/geospatial/regions`              | Region boundaries               |
| POST   | `/geospatial/route-optimization`   | Optimize agent routes           |
| GET    | `/geospatial/demographics/:region` | Demographic data                |
| POST   | `/geospatial/export`               | Export geospatial data          |

---

### 📈 Impact Metrics Module

| Method | Endpoint                         | Description              |
| ------ | -------------------------------- | ------------------------ |
| GET    | `/impact-metrics/dashboard`      | Overview metrics         |
| GET    | `/impact-metrics/project/:id`    | Project-specific metrics |
| POST   | `/impact-metrics/calculate`      | Calculate impact scores  |
| GET    | `/impact-metrics/kpis`           | Get KPIs                 |
| POST   | `/impact-metrics/kpis`           | Create custom KPI        |
| PUT    | `/impact-metrics/kpis/:id`       | Update KPI               |
| DELETE | `/impact-metrics/kpis/:id`       | Delete KPI               |
| GET    | `/impact-metrics/benchmarks`     | Get benchmarks           |
| POST   | `/impact-metrics/benchmarks`     | Create benchmark         |
| GET    | `/impact-metrics/trends`         | Metric trends            |
| POST   | `/impact-metrics/export`         | Export metric data       |
| GET    | `/impact-metrics/sector/:sector` | Sector-specific metrics  |

---

### 🏠 Dashboard Module

| Method | Endpoint                            | Description               |
| ------ | ----------------------------------- | ------------------------- |
| GET    | `/dashboard/overview`               | Main dashboard overview   |
| GET    | `/dashboard/widgets`                | Get dashboard widgets     |
| POST   | `/dashboard/widgets`                | Create custom widget      |
| PUT    | `/dashboard/widgets/:id`            | Update widget             |
| DELETE | `/dashboard/widgets/:id`            | Delete widget             |
| GET    | `/dashboard/recent-activity`        | Get recent activities     |
| GET    | `/dashboard/notifications`          | Get notifications         |
| PATCH  | `/dashboard/notifications/:id/read` | Mark notification as read |
| GET    | `/dashboard/quick-stats`            | Quick statistics          |
| POST   | `/dashboard/export`                 | Export dashboard data     |

---

### 📊 Visualizations Module

| Method | Endpoint                        | Description                 |
| ------ | ------------------------------- | --------------------------- |
| GET    | `/visualizations/all`           | Get all visualizations      |
| POST   | `/visualizations/create`        | Create new visualization    |
| GET    | `/visualizations/:id`           | Get single visualization    |
| PUT    | `/visualizations/:id`           | Update visualization        |
| DELETE | `/visualizations/:id`           | Delete visualization        |
| POST   | `/visualizations/:id/duplicate` | Duplicate visualization     |
| GET    | `/visualizations/charts/types`  | Available chart types       |
| POST   | `/visualizations/charts/data`   | Get chart data              |
| POST   | `/visualizations/export`        | Export visualizations       |
| GET    | `/visualizations/templates`     | Get visualization templates |
| POST   | `/visualizations/share`         | Share visualization         |

---

### 📁 File Upload Module

| Method | Endpoint                           | Description           |
| ------ | ---------------------------------- | --------------------- |
| POST   | `/upload/single`                   | Upload single file    |
| POST   | `/upload/multiple`                 | Upload multiple files |
| GET    | `/upload/file/:id`                 | Get file by ID        |
| DELETE | `/upload/file/:id`                 | Delete file           |
| GET    | `/upload/files/project/:projectId` | Get project files     |
| GET    | `/upload/files/report/:reportId`   | Get report files      |
| POST   | `/upload/bulk`                     | Bulk file upload      |
| GET    | `/upload/download/:id`             | Download file         |
| POST   | `/upload/process/csv`              | Process CSV file      |
| POST   | `/upload/process/excel`            | Process Excel file    |

---

### 📊 Analytics & Reporting (Cross-module)

| Method | Endpoint                   | Description            |
| ------ | -------------------------- | ---------------------- |
| GET    | `/analytics/overview`      | System-wide analytics  |
| GET    | `/analytics/usage`         | Usage statistics       |
| GET    | `/analytics/performance`   | Performance metrics    |
| POST   | `/analytics/custom-report` | Generate custom report |
| GET    | `/analytics/export`        | Export analytics data  |

## Authors

- [@vicodevv](https://www.github.com/vicodevv)

## License

[MIT](https://choosealicense.com/licenses/mit/)

```

```
