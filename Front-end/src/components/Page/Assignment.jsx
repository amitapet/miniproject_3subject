import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Driver.css";

function Assignment() {
  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user?.id || {};
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/assignment/${empId}`
        );
        setSchedules(res.data);
      } catch (err) {
        console.error("❌ Fetch schedules error:", err);
      }
    };

    fetchData();
  }, [empId]);

  // คำนวณข้อมูลที่จะโชว์ในหน้าปัจจุบัน
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchedules = schedules.slice(indexOfFirstItem, indexOfLastItem);

  // จำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(schedules.length / itemsPerPage);

  return (
    <>
      <Sidebar />
      <title>งานที่ได้รับมอบหมาย</title>
      <div className="page-container">
        {/* Search Box */}
        <div className="search-box">
          <label>
            เส้นทาง : <br />
            <select>
              <option>mut to mut</option>
            </select>
          </label>
          <label>
            วันที่ : <br />
            <input type="date" />
          </label>
          <label>
            เวลา : <br />
            <select>
              <option>09:30 - 10:00</option>
            </select>
          </label>
          <label>
            ประเภทรถ : <br />
            <select>
              <option>รถตู้</option>
            </select>
          </label>
          <button className="search-btn">
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
                  รอบที่ {s.ID} วันที่ {s.TRIPDATE} | ออกเวลา {s.TIMEOUT} น.
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
