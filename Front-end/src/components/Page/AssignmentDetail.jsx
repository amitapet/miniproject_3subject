import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import "./Driver.css";

function AssignmentDetail() {
  const { id } = useParams(); // tripId จาก route
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [hasWork, setHasWork] = useState(false);
  const [currentWorkTrip, setCurrentWorkTrip] = useState(null);

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

  // เอา empId จาก localStorage
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
          ...new Set(res.data.map((p) => p.TIME_IN).filter(Boolean)),
        ]);
        setDropoffOptions([
          ...new Set(res.data.map((p) => p.TIME_IN_1).filter(Boolean)),
        ]);
      } catch (err) {
        console.error("❌ Fetch passengers error:", err);
      }
    };

    const fetchSchedule = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/assignment/${empId}`
        );
        const trip = res.data.find((t) => String(t.ID) === String(id));
        setSchedule(trip);
      } catch (err) {
        console.error("❌ Fetch schedule error:", err);
      }
    };

    const checkWork = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/work/check/${empId}`
        );
        if (res.data.hasWork) {
          setHasWork(true);
          setCurrentWorkTrip(res.data.tripId);
        } else {
          setHasWork(false);
        }
      } catch (err) {
        console.error("❌ Check work error:", err);
      }
    };

    checkWork();
    if (empId) fetchSchedule();
    fetchPassengers();
  }, [id, empId]);

  const handleConfirm = async () => {
    try {
      await axios.post("http://localhost:3000/work", {
        emp_id: empId,
        trip_id: id,
      });
      alert("✅ เริ่มงานเรียบร้อยแล้ว");
      setShowModal(false);
    } catch (err) {
      console.error("❌ Start work error:", err);
      if (err.response?.status === 400) {
        alert(err.response.data.error);
      } else {
        alert("ไม่สามารถเริ่มงานได้");
      }
    }
  };

  // กรองผู้โดยสารตามจุดรับ/จุดส่ง
  const filteredPassengers = passengers.filter((p) => {
    return (
      (!pickupFilter || (p.TIME_IN || "") === pickupFilter) &&
      (!dropoffFilter || (p.TIME_IN_1 || "") === dropoffFilter)
    );
  });

  return (
    <>
      <title>รายละเอียดงานที่ได้รับมอบหมาย</title>
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
              <p>เวลารถออก : {schedule.TIMEOUT} น.</p>
            </div>
            <div className="job-extra">
              <p>ทะเบียนรถ: {schedule.ID_CAR}</p>
              <p>ประเภทรถ: {schedule.NAME}</p>
              <p>
                ลูกค้าจองแล้ว :{" "}
                {passengers.reduce(
                  (total, p) => total + Number(p.SEAT || 0),
                  0
                )}{" "}
                ที่นั่ง
              </p>
            </div>
            <div className="job-route">
              <p>เริ่มงาน เวลา : {schedule.TIMEOUT} น.</p>
              <button className="btn-route">เส้นทาง</button>
            </div>
          </div>
        )}

        {/* Search ผู้โดยสาร */}
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
                <td>{p.TIME_IN}</td>
                <td>{p.TIME_IN_1}</td>
                <td>{p.SEAT}</td>
                <td>{p.STATUS}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className="btn-start"
          onClick={() => setShowModal(true)}
          disabled={hasWork && String(currentWorkTrip) !== String(id)}
        >
          เริ่มงาน
        </button>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>ยืนยันการเริ่มทำงานหรือไม่</h3>
              <p>หากยืนยัน คุณไม่สามารถย้อนกลับได้</p>
              <div className="modal-actions">
                <button className="btn-confirm" onClick={handleConfirm}>
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

        {hasWork && String(currentWorkTrip) !== String(id) && (
          <p style={{ color: "red", marginTop: "10px" }}>
            ⚠ คุณมีงานที่กำลังทำอยู่ (Trip {currentWorkTrip})
            กรุณาสิ้นสุดงานก่อน
          </p>
        )}
      </div>
    </>
  );
}

export default AssignmentDetail;
