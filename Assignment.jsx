import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Driver.css";

function Assignment() {
  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user?.id || {}; // E0002
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Dropdown selections
  const [routeSelect, setRouteSelect] = useState("");
  const [dateSelect, setDateSelect] = useState("");
  const [timeSelect, setTimeSelect] = useState("");
  const [carTypeSelect, setCarTypeSelect] = useState("");

  // Filters applied on search
  const [routeFilter, setRouteFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [timeFilter, setTimeFilter] = useState("");
  const [carTypeFilter, setCarTypeFilter] = useState("");

  // Option lists
  const [routeOptions, setRouteOptions] = useState([]);
  const [timeOptions, setTimeOptions] = useState([]);
  const [carTypeOptions, setCarTypeOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/assignment/get/${empId}/get`
        );
        setSchedules(res.data);

        // สร้าง option lists แบบ unique
        setRouteOptions([...new Set(res.data.map((s) => s.NAME_ROUTE))]);
        setTimeOptions([...new Set(res.data.map((s) => s.TIMEOUT))]);
        setCarTypeOptions([...new Set(res.data.map((s) => s.NAME))]);
      } catch (err) {
        console.error("❌ Fetch schedules error:", err);
      }
    };

    fetchData();
  }, [empId]);

    //ทำให้เวลาสวย//
const formatTime = (time) => {
  if (!time) return "";

  let t = String(time);

  // แยกชั่วโมงกับนาที
  let [hour, minute] = t.split(".");

  // ถ้าไม่มีนาที ให้เป็น "00"
  if (!minute) minute = "00";

  // เติม 0 ด้านหน้าให้ครบ 2 หลัก
  hour = hour.padStart(2, "0");
  minute = minute.padEnd(2, "0");

  return `${hour}:${minute}`;
};
//ทำให้เวลาสวย//

  const filteredSchedules = schedules.filter((s) => {
    const [day, month, year] = s.TRIPDATE.split("/");
    const tripDateISO = `${year}-${month}-${day}`;

    return (
      (!routeFilter || s.NAME_ROUTE === routeFilter) &&
      (!dateFilter || tripDateISO === dateFilter) &&
      (!timeFilter || s.TIMEOUT === timeFilter) &&
      (!carTypeFilter || s.NAME === carTypeFilter)
    );
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchedules = filteredSchedules.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

  return (
    <>
      <Sidebar />
      <title>งานที่ได้รับมอบหมาย</title>
      <div className="page-container">
        {/* Search Box */}
        <div className="search-box">
          <label>
            เส้นทาง : <br />
            <select
              value={routeSelect}
              onChange={(e) => setRouteSelect(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              {routeOptions.map((route, idx) => (
                <option key={idx} value={route}>
                  {route}
                </option>
              ))}
            </select>
          </label>

          <label>
            วันที่ : <br />
            <input
              type="date"
              value={dateSelect}
              onChange={(e) => setDateSelect(e.target.value)}
            />
          </label>

          <label>
            เวลา : <br />
            <select
              value={timeSelect}
              onChange={(e) => setTimeSelect(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              {timeOptions.map((time, idx) => (
                <option key={idx} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </label>

          <label>
            ประเภทรถ : <br />
            <select
              value={carTypeSelect}
              onChange={(e) => setCarTypeSelect(e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              {carTypeOptions.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <button
            className="search-btn"
            onClick={() => {
              setRouteFilter(routeSelect);
              setDateFilter(dateSelect);
              setTimeFilter(timeSelect);
              setCarTypeFilter(carTypeSelect);
              setCurrentPage(1); // เริ่มหน้าหนึ่ง
            }}
          >
            <FaSearch /> ค้นหา
          </button>
        </div>

        {/* Schedule List */}
        <div className="schedule-list">
          {currentSchedules.map((s, index) => (
            <div key={index} className="schedule-card">
              <div className="schedule-info">
                <div>เส้นทาง : {s.NAME_ROUTE} </div>
                <div>
                  รอบที่ {s.ID} วันที่ {s.TRIPDATE} | ออกเวลา {formatTime(s.TIMEOUT)} น.
                </div>
                <div>
                  ทะเบียนรถ: {s.ID_CAR} | ประเภทรถ: {s.NAME}
                </div>
              </div>
              <button
                className="detail-btn"
                onClick={() => navigate(`/assignment/${s.ID}`)}
              >
                รายละเอียด
              </button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            ก่อนหน้า
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              className={currentPage === i + 1 ? "active-page" : ""}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            ถัดไป
          </button>
        </div>
      </div>
    </>
  );
}

export default Assignment;
