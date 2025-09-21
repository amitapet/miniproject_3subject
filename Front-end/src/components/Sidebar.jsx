import "./Sidebar.css";
import { useNavigate } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from "react";
import {
  FaMapMarkerAlt,
  FaRoute,
  FaCar,
  FaClock,
  FaUserShield,
  FaUserTie,
  FaBuilding,
  FaChartBar,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();
  const [showReportDropdown, setShowReportDropdown] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const user = JSON.parse(localStorage.getItem("user"));
  const userid = user?.id || {};
  const permission = user?.permission || {};

  return (
    <nav className="sidebar">
      <ul className="side-links">
        {permission.MGMT_STATION === 1 && (
          <li>
            <a href="/stations">
              <FaMapMarkerAlt /> จัดการจุดสถานี
            </a>
          </li>
        )}
        {permission.MGMT_ROUTE === 1 && (
          <li>
            <a href="/carroutes">
              <FaRoute /> จัดการเส้นทางรถ
            </a>
          </li>
        )}
        {permission.MGMT_CAR === 1 && (
          <li>
            <a href="/cars">
              <FaCar /> จัดการรถ
            </a>
          </li>
        )}
        {permission.MGMT_TRIP === 1 && (
          <li>
            <a href="/schedules">
              <FaClock /> จัดรอบเวลาเดินรถ
            </a>
          </li>
        )}
        {permission.MGMT_PERMISSION === 1 && (
          <li>
            <a href="/roles">
              <FaUserShield /> จัดการสิทธิ
            </a>
          </li>
        )}
        {permission.MGMT_EMPLOYEE === 1 && (
          <li>
            <a href="/employees">
              <FaUserTie /> จัดการพนักงาน
            </a>
          </li>
        )}
        {permission.MGMT_DEPARTMENT === 1 && (
          <li>
            <a href="/departments">
              <FaBuilding /> จัดการแผนก
            </a>
          </li>
        )}
        {permission.VIEWREPORT === 1 && (
          <li
            className="dropdown-item"
            onMouseEnter={() => setShowReportDropdown(true)}
            onMouseLeave={() => setShowReportDropdown(false)}
          >
            <div className="dropdown-trigger">
              <FaChartBar /> รายงาน <FaChevronDown className="dropdown-arrow" />
            </div>
            {showReportDropdown && (
              <ul className="dropdown-menu">
                <li>
                  <a href="/reports/report1">รายงาน 1</a>
                </li>
                <li>
                  <a href="/reports/report3">รายงาน 3</a>
                </li>
                <li>
                  <a href="/reports/report6">รายงาน 6</a>
                </li>
              </ul>
            )}
          </li>
        )}

        {permission.PROFILE === 1 && (
          <li>
            <a href="/profile">
              <FaCar /> โปรไฟล์
            </a>
          </li>
        )}

        {permission.WORK_SCHEDULE === 1 && (
          <li>
            <a href="/work-schedule">
              <FaCar /> ตารางงาน
            </a>
          </li>
        )}

        {permission.ASSIGNMENT === 1 && (
          <li>
            <a href="/assignment">
              <FaCar /> งานที่ได้รับมอบหมาย
            </a>
          </li>
        )}

        {permission.CURRENTJOB === 1 && (
          <li>
            <a href="/current-job">
              <FaCar /> งานปัจจุบัน
            </a>
          </li>
        )}

        {userid.substring(0, 1) == "C" && (
          <li>
            <a href="/Rent">
              <FaCar /> จองรอบรถ
            </a>
          </li>
        )}

        {userid.substring(0, 1) == "C" && (
          <li>
            <a href="/RentInfo">
              <FaCar /> รายการจอง
            </a>
          </li>
        )}
      </ul>

      <div>
        <div className="account">
          Account <br />
          {user?.name || "Guest"}
        </div>
        <div className="logout" onClick={handleLogout}>
          <FaSignOutAlt />
          Logout
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;