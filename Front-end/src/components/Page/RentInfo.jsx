import { useEffect, useState } from "react";
//import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Customer.css";

function RentInfo() {
  //const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [fromStation, setFromStation] = useState(""); // ต้นทาง
  const [toStation, setToStation] = useState(""); // ปลายทาง
  const [carType, setCarType] = useState(""); // ประเภทรถ
  const [seats, setSeats] = useState(""); // จำนวนที่นั่ง
  const [filteredBookings, setFilteredBookings] = useState([]); //filterแล้ว

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const cus_id = user.id;

        const res = await fetch(`http://localhost:3000/reserve/${cus_id}`);
        const responseData = await res.json();

        const data = responseData.map((item) => ({
          id: item.ID,
          origin: item.PICKUP_NAME,
          destination: item.DROPOFF_NAME,
          vehicle: item.CAR_TYPE,
          driver: item.DRIVER_NAME,
          startDate: item.DATE_TRIP,
          startTime: item.PICKUP_TIME,
          arrivalDate: item.DATE_TRIP,
          arrivalTime: item.DROPOFF_TIME,
          seats: item.SEAT || 1,
          status: item.STATUS || "-",
        }));

        setBookings(data);
        setFilteredBookings(data);
      } catch (err) {
        console.error("❌ Fetch bookings error:", err);
      }
    };

    fetchBookings();
  }, []);

  const handleCancel = async (id) => {
    if (window.confirm("คุณต้องการยกเลิกการจองนี้หรือไม่?")) {
      try {
        await fetch(`http://localhost:3000/reserve/cancel/${id}`, {
          method: "POST",
        });

        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "ยกเลิก" } : b))
        );
        setFilteredBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status: "ยกเลิก" } : b))
        );
      } catch (err) {
        console.error("❌ Cancel booking error:", err);
        alert("ไม่สามารถยกเลิกได้ กรุณาลองใหม่");
      }
    }
  };

  const handleTicket = (booking) => {
    alert(
      `ตั๋วของคุณ\n\nจาก ${booking.origin} ไป ${booking.destination}\nรถ: ${booking.vehicle}\nเวลาออก: ${booking.startDate} ${booking.startTime}\nถึง: ${booking.arrivalDate} ${booking.arrivalTime}\nที่นั่ง: ${booking.seats}`
    );
  };

  const handleSearch = () => {
    const filtered = bookings.filter(
      (b) =>
        (fromStation === "" || b.origin === fromStation) &&
        (toStation === "" || b.destination === toStation) &&
        (carType === "" || b.vehicle === carType) &&
        (seats === "" || b.seats >= Number(seats))
    );
    setFilteredBookings(filtered);
  };

  const stations = Array.from(
    new Set(bookings.flatMap((b) => [b.origin, b.destination]))
  );
  const carTypes = Array.from(new Set(bookings.map((b) => b.vehicle)));

  return (
    <div className="rentinfo-container">
      <Sidebar />
      <title>รายการจอง</title>
      <div className="rentinfo-content">
        {/* Filter bar */}
        <div className="search-bar">
          <label>
            ต้นทาง :
            <select
              value={fromStation}
              onChange={(e) => setFromStation(e.target.value)}
            >
              <option value="">ทุกเส้นทาง</option>
              {stations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            ปลายทาง :
            <select
              value={toStation}
              onChange={(e) => setToStation(e.target.value)}
            >
              <option value="">ทุกเส้นทาง</option>
              {stations.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            ประเภทรถ :
            <select
              value={carType}
              onChange={(e) => setCarType(e.target.value)}
            >
              <option value="">ทุกประเภท</option>
              {carTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label>
            วันเดินทาง :
            <input type="date" />
          </label>

          <label>
            ที่นั่ง :
            <input
              type="number"
              min="1"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              placeholder="จำนวนที่นั่ง"
            />
          </label>

          <button className="search-btn" onClick={handleSearch}>
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
              {filteredBookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.origin}</td>
                  <td>{b.destination}</td>
                  <td>{b.vehicle}</td>
                  <td>{b.driver}</td>
                  <td>
                    {b.startDate}&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;
                    {Number(b.startTime).toFixed(2).padStart(5, "0")} น.
                  </td>
                  <td>
                    {b.arrivalDate}&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;
                    {Number(b.arrivalTime).toFixed(2).padStart(5, "0")} น.
                  </td>
                  <td>{b.seats}</td>
                  <td>{b.status}</td>
                  <td>
                    <div className="action-buttons">
                      {b.status !== "ยกเลิก" && (
                        <>
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
                        </>
                      )}
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
