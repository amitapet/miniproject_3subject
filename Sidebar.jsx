import './Sidebar.css';
import { FaMapMarkerAlt, FaRoute, FaCar, FaClock, FaUserShield, FaUserTie, FaBuilding, FaChartBar, FaSignOutAlt } from "react-icons/fa";

function Sidebar() {
  return (
    <nav className="sidebar">
      <ul className="side-links">
        <li><a href="/"><FaMapMarkerAlt /> จัดการจุดสถานี</a></li>
        <li><a href="/carroutes"><FaRoute /> จัดการเส้นทางรถ</a></li>
        <li><a href="/cars"><FaCar /> จัดการรถ</a></li>
        <li><a href="/schedules"><FaClock /> จัดรอบเวลาเดินรถ</a></li>
        <li><a href="/roles"><FaUserShield /> จัดการสิทธิ</a></li>
        <li><a href="/employees"><FaUserTie /> จัดการพนักงาน</a></li>
        <li><a href="/departments"><FaBuilding /> จัดการแผนก</a></li>
        <li><a href="/reports"><FaChartBar /> รายงาน ▾</a></li>
      </ul>
      <div>
        <div className="account">
          Account <br />User  {/* ต้องเชื่อมจากฐานข้อมูลมาแสดง */}
        </div>
        <div className="logout"><FaSignOutAlt/>Logout</div>
      </div>
    </nav>
  );
}

export default Sidebar;
