import "./Sidebar.css";
import { useNavigate } from "react-router-dom";
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
} from "react-icons/fa";

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const user = JSON.parse(localStorage.getItem("user"));
  const permission = user?.permission || {};

  return (
    <nav className="sidebar">
      <ul className="side-links">
        {permission.MGMT_STATION === 1 && (
          <li>
            <a href="/">
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
          <li>
            <a href="/reports">
              <FaChartBar /> รายงาน
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
