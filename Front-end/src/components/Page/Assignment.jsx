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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/assignment/${empId}`
        );
        setSchedules(res.data); // เอาข้อมูลจาก backend มาใส่ state
      } catch (err) {
        console.error("❌ Fetch schedules error:", err);
      }
    };

    fetchData();
  }, [empId]);

  return (
    <>
      <Sidebar />
      <title>งานที่ได้รับมอบหมาย</title>
      <div className="page-container">
        {/* Search Box */}
        <div className="search-box">
          <label>
            ต้นทาง : <br />
            <select>
              <option>ตลาดนัด</option>
            </select>
          </label>
          <label>
            ปลายทาง : <br />
            <select>
              <option>หน้ามอ</option>
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
          {schedules.map((s, index) => (
            <div key={index} className="schedule-card">
              <div className="schedule-info">
                <div>เส้นทาง : {s.NAME_ROUTE} </div>
                <div>
                  รอบที่ {s.ID} วันที่ {s.TRIPDATE} | ออกเวลา {s.TIMEOUT}
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
        <div className="pagination">1/10 หน้า</div>
      </div>
    </>
  );
}

export default Assignment;
