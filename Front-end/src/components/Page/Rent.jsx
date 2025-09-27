import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Customer.css";

function Rent() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    vehicle: "ทุกประเภท",
    date: "",
    seats: 1,
  });

  useEffect(() => {
    // mock data
    const mockData = [
      {
        id: 1,
        date: "01/01/68",
        time: "9:30 น.",
        type: "รถบัส",
        available: 4,
        duration: 12,
        origin: "Big C หนองออก",
        destination: "มหาวิทยาลัยเทคโนโลยีมหานคร",
      },
      {
        id: 2,
        date: "01/01/68",
        time: "9:32 น.",
        type: "รถตู้",
        available: 2,
        duration: 30,
        origin: "มหาวิทยาลัยเทคโนโลยีมหานคร",
        destination: "มหาวิทยาลัยเทคโนโลยีมหานคร",
      },
      {
        id: 3,
        date: "01/01/68",
        time: "9:35 น.",
        type: "รถตู้",
        available: 6,
        duration: 13,
        origin: "มหาวิทยาลัยเทคโนโลยีมหานคร",
        destination: "ร้านส้มตำเป๋าปาง",
      },
    ];
    setSchedules(mockData);
  }, []);

  // ฟังก์ชันคำนวณเวลา "ถึง"
  const getArrivalTime = (time, duration) => {
    const [hour, minute] = time.replace(" น.", "").split(":").map(Number);
    const start = new Date();
    start.setHours(hour, minute);
    start.setMinutes(start.getMinutes() + duration);

    return `${start.getHours()}:${String(start.getMinutes()).padStart(
      2,
      "0"
    )} น.`;
  };

  return (
    <div className="rent-container">
      <Sidebar />
      <title>จองรอบรถ</title>
      <div className="rent-content">
        {/* ฟอร์มค้นหา */}
        <div className="search-bar">
          <label>
            ต้นทาง :
            <select>
              <option>โลตัสหนองจอก</option>
            </select>
          </label>
          <label>
            ปลายทาง :
            <select>
              <option>ร้านส้มตำเป๋าปาง</option>
            </select>
          </label>

          <label>
            ประเภทรถ :
            <select>
              <option>ทุกประเภท</option>
            </select>
          </label>

          <label>
            วันเดินทาง :
            <input type="date" />
          </label>

          <label>
            ที่นั่ง :
            <input type="number" min="1" defaultValue={1} />
          </label>

          <button className="search-btn">
            <FaSearch />
          </button>
        </div>

        {/* ตาราง */}
        <table className="table-container">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เวลาออกรถ</th>
              <th>ประเภทรถ</th>
              <th>ที่นั่งว่าง</th>
              <th>เวลาที่ถึง</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td>{s.date}</td>
                <td>{s.time}</td>
                <td>{s.type}</td>
                <td>{s.available}</td>
                <td>{getArrivalTime(s.time, s.duration)}</td>
                <td>
                  <button className="book-btn">จอง</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Rent;
