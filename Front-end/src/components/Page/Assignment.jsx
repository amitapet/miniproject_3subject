import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Driver.css";

function Assignment() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    // mock data
    setSchedules([
      { round: 1, date: "01/01/2568", plate: "สข 2591", time: "9.30-10.30" },
      { round: 2, date: "01/01/2568", plate: "สข 2592", time: "9.30-10.30" },
      { round: 3, date: "01/01/2568", plate: "สข 2593", time: "9.30-10.30" },
      { round: 4, date: "01/01/2568", plate: "สข 2594", time: "9.30-10.30" },
    ]);
  }, []);

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
          {schedules.map((s) => (
            <div key={s.round} className="schedule-card">
              <div className="schedule-info">
                <div>จาก : ตลาดนัด → ถึง : หน้ามอ</div>
                <div>
                  รอบที่ {s.round} วันที่ {s.date} | เวลาที่รถออกและถึงโดยประมาณ{" "}
                  {s.time}
                </div>
                <div>ทะเบียนรถ: {s.plate} | ประเภทรถ: รถตู้</div>
              </div>
              <button
                className="detail-btn"
                onClick={() => navigate(`/assignment/${s.round}`)}
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
