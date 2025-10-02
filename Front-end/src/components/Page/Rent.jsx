import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Customer.css";

function Rent() {
  const user = JSON.parse(localStorage.getItem("user"));
  const cus_id = user.id;

  const [stations, setStations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    origin: { id: "", name: "" },
    destination: { id: "", name: "" },
    vehicle: "ทุกประเภท",
    date: "",
    seats: 1,
  });

  const [bookedSeats, setBookedSeats] = useState({}); // เก็บจำนวนที่จองต่อ trip ID

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await axios.get("http://localhost:3000/rstation");
        const mapped = res.data.map((s) => ({
          id: s.ID ?? s.id,
          name: s.NAME ?? s.name,
        }));
        setStations(mapped);
      } catch (error) {
        console.error("❌ โหลดข้อมูลสถานีไม่สำเร็จ:", error);
      }
    };
    fetchStations();
  }, []);

  const handleStationChange = (e, field) => {
    const stationId = e.target.value;
    const station = stations.find((s) => String(s.id) === stationId);
    setForm((prev) => ({
      ...prev,
      [field]: station ? { id: station.id, name: station.name } : { id: "", name: "" },
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getArrivalTime = (timeout, duration = 30) => {
    const hour = Math.floor(timeout);
    const minute = Math.round((timeout - hour) * 60);
    const start = new Date();
    start.setHours(hour, minute);
    start.setMinutes(start.getMinutes() + duration);
    return `${start.getHours()}:${String(start.getMinutes()).padStart(2, "0")} น.`;
  };

  const handleSearch = async () => {
    if (!form.origin.id || !form.destination.id) {
      alert("กรุณาเลือกต้นทางและปลายทางก่อนค้นหา");
      return;
    }
    try {
      const url = `http://localhost:3000/rentinfo/${form.origin.id}/${form.destination.id}`;
      const res = await axios.get(url);
      setSchedules(res.data);
      setCurrentPage(1);
    } catch (error) {
      console.error("❌ โหลดข้อมูลรอบรถไม่สำเร็จ:", error);
      alert("เกิดข้อผิดพลาดขณะค้นหาข้อมูลรอบรถ");
    }
  };

  const handleBooking = async (trip) => {
    if (!form.date) {
      alert("กรุณาเลือกวันเดินทางก่อนจอง");
      return;
    }

    const booked = bookedSeats[trip.ID] || 0;
    const seatsLeft = trip.SEAT - booked;

    if (seatsLeft <= 0) {
      alert("รอบนี้เต็มแล้ว");
      return;
    }

    // ถ้า user ใส่จำนวนเกิน seatsLeft ให้ปรับลง
    const seatsToBook = Math.min(form.seats, seatsLeft);

    try {
      const postData = {
        start: form.origin.id,
        stop: form.destination.id,
        seat: seatsToBook,
        cus_id: cus_id,
        route_id: trip.ID_ROUTE,
        trip_id: trip.ID,
      };

      const res = await axios.post("http://localhost:3000/rent", postData);
      alert(res.data.message);

      // ลดจำนวนที่นั่งเฉพาะ frontend
      setBookedSeats((prev) => ({
        ...prev,
        [trip.ID]: (prev[trip.ID] || 0) + form.seats,
      }));
    } catch (err) {
      console.error("❌ จองไม่สำเร็จ:", err);
      alert("เกิดข้อผิดพลาดขณะจอง");
    }
  };

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = schedules.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(schedules.length / rowsPerPage);

  return (
    <div className="rent-container">
      <Sidebar />
      <title>จองรอบรถ</title>
      <div className="rent-content">
        <div className="search-bar">
          <label>
            ต้นทาง :
            <select value={form.origin.id} onChange={(e) => handleStationChange(e, "origin")}>
              <option value="">-- เลือกต้นทาง --</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </label>

          <label>
            ปลายทาง :
            <select value={form.destination.id} onChange={(e) => handleStationChange(e, "destination")}>
              <option value="">-- เลือกปลายทาง --</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </label>

          <label>
            ประเภทรถ :
            <select name="vehicle" value={form.vehicle} onChange={handleChange}>
              <option>ทุกประเภท</option>
              <option>รถบัส</option>
              <option>รถตู้</option>
            </select>
          </label>

          <label>
            วันเดินทาง :
            <input type="date" name="date" value={form.date} onChange={handleChange} />
          </label>

          <label>
            ที่นั่ง :
            <input type="number" name="seats" min="1" value={form.seats} onChange={handleChange} />
          </label>

          <button className="search-btn" onClick={handleSearch}><FaSearch /></button>
        </div>

        <table className="table-container">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เวลาออกรถ</th>
              <th>ประเภทรถ</th>
              <th>จำนวนที่นั่งเหลือ</th>
              <th>เวลาถึง (ประมาณ)</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length > 0 ? (
              currentRows.map((trip) => {
                const booked = bookedSeats[trip.ID] || 0;
                const seatsReal = trip.SEAT - booked;

                return (
                  <tr key={trip.ID}>
                    <td>{trip.DATE_TRIP}</td>
                    <td>{trip.TIMEOUT}</td>
                    <td>{trip.NAME}</td>
                    <td>{seatsReal > 0 ? seatsReal : 0}</td>
                    <td>{getArrivalTime(trip.TIMEOUT)}</td>
                    <td>
                      <button
                        className="book-btn"
                        onClick={() => handleBooking(trip)}
                        disabled={seatsReal <= 0}
                      >
                        จอง
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>ไม่มีข้อมูลรอบรถ</td>
              </tr>
            )}
          </tbody>
        </table>

        {schedules.length > rowsPerPage && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              ก่อนหน้า
            </button>
            <span>หน้า {currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rent;
