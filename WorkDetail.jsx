import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import "./Driver.css";

function WorkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Dropdown selections
  const [pickupSelect, setPickupSelect] = useState("");
  const [dropoffSelect, setDropoffSelect] = useState("");

  // Filters applied on search
  const [pickupFilter, setPickupFilter] = useState("");
  const [dropoffFilter, setDropoffFilter] = useState("");

  // Option lists
  const [pickupOptions, setPickupOptions] = useState([]);
  const [dropoffOptions, setDropoffOptions] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const empId = user?.id || "";

  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/assignmentdetail/${id}`
        );
        setPassengers(res.data);

        // สร้าง option lists แบบ unique
        setPickupOptions([
          ...new Set(res.data.map((p) => p.PICKUP_NAME).filter(Boolean)),
        ]);
        setDropoffOptions([
          ...new Set(res.data.map((p) => p.DROPOFF_NAME).filter(Boolean)),
        ]);
      } catch (err) {
        console.error("❌ Fetch passengers error:", err);
      }
    };

    const fetchSchedule = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/workdetail/${id}`);
        const trip = res.data.find((t) => String(t.ID) === String(id));
        setSchedule(trip);
      } catch (err) {
        console.error("❌ Fetch schedule error:", err);
      }
    };

    if (empId) fetchSchedule();
    fetchPassengers();
  }, [id, empId]);

  const handleGetWork = async () => {
    //
    try {
      await axios.post("http://localhost:3000/work", {
        emp_id: empId,
        trip_id: id,
      });
      alert("✅ รับงานเรียบร้อยแล้ว");
      setShowModal(false);
    } catch (err) {
      console.error("❌ Start work error:", err);
      if (err.response?.status === 400) {
        alert(err.response.data.error);
      } else {
        alert("ไม่สามารถรับงานได้");
      }
    }
  };

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

  const filteredPassengers = passengers.filter((p) => {
    return (
      (!pickupFilter || p.PICKUP_NAME === pickupFilter) &&
      (!dropoffFilter || p.DROPOFF_NAME === dropoffFilter)
    );
  });

  const bookedSeats = passengers
    .filter((p) => p.STATUS?.toLowerCase() !== "cancel")
    .reduce((total, p) => total + Number(p.SEAT || 0), 0);

  const availableSeats = schedule ? schedule.SEAT - bookedSeats : 0;

  return (
    <div className="page-container">
      <button className="btn-back" onClick={() => navigate(-1)}>
        ⬅ กลับ
      </button>

      {schedule && (
        <div className="job-info-card">
          <div className="job-info">
            <h3>รายละเอียดงาน</h3>
            <p>รอบที่ {schedule.ID}</p>
            <p>เส้นทาง : {schedule.NAME_ROUTE}</p>
            <p>วันที่ {schedule.TRIPDATE}</p>
            <p>เวลารถออก : {formatTime(schedule.TIMEOUT)} น.</p>
          </div>
          <div className="job-extra">
            <p>ทะเบียนรถ: {schedule.ID_CAR}</p>
            <p>ประเภทรถ: {schedule.NAME}</p>
          </div>
          <div className="job-extra">
            <p>ที่นั่งทั้งหมด : {schedule.SEAT} ที่นั่ง</p>
            <p>ลูกค้าจองแล้ว : {bookedSeats} ที่นั่ง</p>
            <p>ที่ว่างเหลือ : {availableSeats} ที่นั่ง</p>
          </div>
        </div>
      )}

      <div className="search-box">
        <label>
          จุดรับ:
          <select
            value={pickupSelect}
            onChange={(e) => setPickupSelect(e.target.value)}
          >
            <option value="">ตั้งแต่ต้นทาง</option>
            {pickupOptions.map((pickup, idx) => (
              <option key={idx} value={pickup}>
                {pickup}
              </option>
            ))}
          </select>
        </label>

        <label>
          จุดส่ง:
          <select
            value={dropoffSelect}
            onChange={(e) => setDropoffSelect(e.target.value)}
          >
            <option value="">ถึงปลายทาง</option>
            {dropoffOptions.map((dropoff, idx) => (
              <option key={idx} value={dropoff}>
                {dropoff}
              </option>
            ))}
          </select>
        </label>

        <button
          className="search-btn"
          onClick={() => {
            setPickupFilter(pickupSelect);
            setDropoffFilter(dropoffSelect);
          }}
        >
          <FaSearch />
        </button>
      </div>

      <h3>ข้อมูลผู้โดยสาร</h3>
      <table className="passenger-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>เบอร์โทรศัพท์</th>
            <th>ชื่อ</th>
            <th>จุดรับ</th>
            <th>จุดส่ง</th>
            <th>ที่นั่ง</th>
            <th>สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {filteredPassengers.map((p, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{p.TEL}</td>
              <td>
                {p.FNAME} {p.LNAME}
              </td>
              <td>{p.PICKUP_NAME}</td>
              <td>{p.DROPOFF_NAME}</td>
              <td>{p.SEAT}</td>
              <td>{p.STATUS}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn-start" onClick={() => setShowModal(true)}>
        รับงาน
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>ยืนยันการรับงานหรือไม่</h3>
            <p>หากยืนยัน คุณไม่สามารถย้อนกลับได้</p>
            <div className="modal-actions">
              <button className="btn-confirm" onClick={handleGetWork}>
                ยืนยัน
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkDetail;
