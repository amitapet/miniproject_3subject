import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Customer.css";

function RentInfo() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    // mock data — คุณสามารถเปลี่ยนเป็น API จริงของคุณได้
    const mockData = [
      {
        id: 1,
        origin: "โลตัสหนองจอก",
        destination: "ร้านส้มตำเป๋าปาง",
        vehicle: "รถบัส",
        driver: "สมชาย",
        startDate: "07/09/2568",
        startTime: "9:35",
        arrivalDate: "07/09/2568",
        arrivalTime: "9:43",
        seats: 3,
        status: "กำลังจอง",
      },
      {
        id: 2,
        origin: "โลตัสหนองจอก",
        destination: "รพ.หนองจอก",
        vehicle: "รถตู้",
        driver: "สมโชค",
        startDate: "06/09/2568",
        startTime: "9:40",
        arrivalDate: "06/09/2568",
        arrivalTime: "9:50",
        seats: 1,
        status: "ไม่มา",
      },
      {
        id: 3,
        origin: "Big C หนองจอก",
        destination: "ร้านส้มตำเป๋าปาง",
        vehicle: "รถบัส",
        driver: "สมชัย",
        startDate: "05/09/2568",
        startTime: "9:30",
        arrivalDate: "05/09/2568",
        arrivalTime: "9:35",
        seats: 1,
        status: "จองแล้ว",
      },
    ];
    setBookings(mockData);
  }, []);

  const handleCancel = (id) => {
    if (window.confirm("คุณต้องการยกเลิกการจองนี้หรือไม่?")) {
      setBookings((prev) => prev.filter((b) => b.id !== id));
    }
  };

  const handleTicket = (booking) => {
    alert(
      `ตั๋วของคุณ\n\nจาก ${booking.origin} ไป ${booking.destination}\nรถ: ${booking.vehicle}\nเวลาออก: ${booking.startDate} ${booking.startTime}\nถึง: ${booking.arrivalDate} ${booking.arrivalTime}\nที่นั่ง: ${booking.seats}`
    );
  };

  return (
    <div className="rentinfo-container">
      <Sidebar />
      <title>รายการจอง</title>
      <div className="rentinfo-content">
        {/* Filter bar */}
        <div className="search-bar">
          <label>
            ต้นทาง :
            <select>
              <option>ทุกเส้นทาง</option>
            </select>
          </label>
          <label>
            ปลายทาง :
            <select>
              <option>ทุกเส้นทาง</option>
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

        {/* ตารางรายการจอง */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>จุดขึ้น</th>
                <th>จุดลง</th>
                <th>รถ</th>
                <th>คนขับ</th>
                <th>เวลาออกเดินทาง</th>
                <th>เวลาที่ถึงปลายทาง</th>
                <th>ที่นั่ง</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.origin}</td>
                  <td>{b.destination}</td>
                  <td>{b.vehicle}</td>
                  <td>{b.driver}</td>
                  <td>
                    {b.startDate} {b.startTime}
                  </td>
                  <td>
                    {b.arrivalDate} {b.arrivalTime}
                  </td>
                  <td>{b.seats}</td>
                  <td>{b.status}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="ticket-btn"
                        onClick={() => handleTicket(b)}
                      >
                        ตั๋ว
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => handleCancel(b.id)}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="note">
          *หากเวลาถึงปัจจุบัน - เวลาที่จะถึง &lt; 10 นาที จะไม่สามารถกดยกเลิกได้
        </p>
      </div>
    </div>
  );
}

export default RentInfo;
