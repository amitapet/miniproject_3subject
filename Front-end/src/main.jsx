import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

// นำเข้า Component
import Layout from "./components/Layout";
import Stations from "./components/Page/Stations";
import Carroutes from "./components/Page/Carroutes";
import Cars from "./components/Page/Cars";
import Schedules from "./components/Page/Schedules";
import Roles from "./components/Page/Roles";
import Employees from "./components/Page/Employees";
import Departments from "./components/Page/Departments";
import Reports from "./components/Page/Reports";
import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Profile from "./components/Page/Profile";
import Workschedule from "./components/Page/Workschedule";
import Assignment from "./components/Page/Assignment";
import Currentjob from "./components/Page/Currentjob";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  {
    path: "/sidebar",
    element: (
      <ProtectedRoute>
        <Sidebar />
      </ProtectedRoute>
    ),
  },
  { path: "/stations", element: <Layout><Stations /></Layout> },
  { path: "/carroutes", element: <Layout><Carroutes /></Layout> },
  { path: "/cars", element: <Layout><Cars /></Layout> },
  { path: "/schedules", element: <Layout><Schedules /></Layout> },
  { path: "/roles", element: <Layout><Roles /></Layout> },
  { path: "/employees", element: <Layout><Employees /></Layout> },
  { path: "/departments", element: <Layout><Departments /></Layout> },
  { path: "/reports", element: <Layout><Reports /></Layout> },
  { path: "/profile", element: <Layout><Profile /></Layout> },
  { path: "/work-schedule", element: <Layout><Workschedule /></Layout> },
  { path: "/assignment", element: <Layout><Assignment /></Layout> },
  { path: "/current-job", element: <Layout><Currentjob /></Layout> },

]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
