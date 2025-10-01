import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { QrReader } from "react-qr-reader";
import { FaQrcode, FaSearch } from "react-icons/fa";
import "./Driver.css";

function Currentjob() {
  const navigate = useNavigate();
  const [tripId, setTripId] = useState(null);
  const [passengers, setPassengers] = useState([]);
  const [schedule, setSchedule] = useState(null);

  const [showEndModal, setShowEndModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  //Nowork
  const [noWork, setNoWork] = useState(false);

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

  // ✅ ดึง trip_id ของพนักงานจาก /work/:empId
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ 1) ดึง trip_id จาก /work/:empId
        const resWork = await axios.get(`http://localhost:3000/work/${empId}`);
        if (!resWork.data.length) {
          // ไม่มีงาน → redirect
          setNoWork(true);
          return;
        }

        const tripId = resWork.data[0].TRIP_ID;
        setTripId(tripId);

        // ✅ 2) ดึงข้อมูลผู้โดยสาร
        const resPassengers = await axios.get(
          `http://localhost:3000/assignmentdetail/${tripId}`
        );
        setPassengers(resPassengers.data);

        // สร้าง options จากข้อมูลผู้โดยสาร
        setPickupOptions([
          ...new Set(
            resPassengers.data.map((p) => p.PICKUP_NAME).filter(Boolean)
          ),
        ]);
        setDropoffOptions([
          ...new Set(
            resPassengers.data.map((p) => p.DROPOFF_NAME).filter(Boolean)
          ),
        ]);

        // ✅ 3) ดึงตารางงานทั้งหมดของพนักงาน
        const resSchedule = await axios.get(
          `http://localhost:3000/workdetail/${tripId}`
        );
        const trip = resSchedule.data.find(
          (t) => String(t.ID) === String(tripId)
        );
        setSchedule(trip);
      } catch (err) {
        console.error("❌ Fetch data error:", err);
      }
    };

    if (empId) {
      fetchData();
    }
  }, [empId, navigate]);

  // ✅ จบงาน
  const handleEndWork = async () => {
    try {
      await axios.put("http://localhost:3000/work/end", {
        emp_id: empId,
        trip_id: tripId,
      });
      alert("✅ จบงานเรียบร้อยแล้ว");
      setShowEndModal(false);
      navigate("/assignment");
    } catch (err) {
      console.error("❌ End work error:", err);
      alert("ไม่สามารถจบงานได้");
    }
  };

  const handleScanResult = async (result) => {
    if (!result) return;

    const scannedId = result.text; // เลข QR code
    setShowScanner(false);

    try {
      // ✅ ตรวจสอบว่า QR อยู่ใน trip นี้ไหม
      const resCheck = await axios.get(
        `http://localhost:3000/work/checkcus/${tripId}/${scannedId}`
      );

      if (!resCheck.data.valid) {
        alert("⚠️ QR Code นี้ไม่ตรงกับรอบงานปัจจุบัน");
        return;
      }

      // ✅ ถ้า pass → update status
      const resUpdate = await axios.put("http://localhost:3000/work/scan", {
        reserve_id: scannedId,
      });

      alert(resUpdate.data.message || "อัปเดตสถานะเรียบร้อยแล้ว");

      // รีเฟรชข้อมูลผู้โดยสาร
      const resPassengers = await axios.get(
        `http://localhost:3000/assignmentdetail/${tripId}`
      );
      setPassengers(resPassengers.data);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || "ไม่สามารถอัปเดตสถานะได้";
      alert(msg);
    }
  };

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
      {noWork ? (
        <h2 class="nowork">โชคดีจริงๆไม่มีงานเลยเย่ๆ 🎉</h2>
      ) : (
        <>
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
              </div>
              <div className="job-extra">
                <p>ที่นั่งทั้งหมด : {schedule.SEAT} ที่นั่ง</p>
                <p>ลูกค้าจองแล้ว : {bookedSeats} ที่นั่ง</p>
                <p>ที่ว่างเหลือ : {availableSeats} ที่นั่ง</p>
              </div>
            </div>
          )}

          {/* 🔎 Search filter */}
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

          <div className="qr-scan-section">
            <button onClick={() => setShowScanner(true)}>
              <FaQrcode />
            </button>

            {showScanner && (
              <div className="scanner-modal">
                <QrReader
                  constraints={{ facingMode: "environment" }}
                  style={{ width: "100%", maxWidth: 400 }}
                  onResult={(result, error) => {
                    if (result !== null) {
                      handleScanResult(result);
                    }

                    if (error) {
                      console.warn(error);
                    }
                  }}
                />
                <button onClick={() => setShowScanner(false)}>ปิด</button>
              </div>
            )}
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

          {/* ปุ่มจบงาน */}
          {tripId && (
            <div className="job-buttons">
              <button className="btn-end" onClick={() => setShowEndModal(true)} 
              disabled={passengers.some(p => !p.STATUS || p.STATUS === "-")}>
                จบงาน
              </button>
            </div>
          )}

          {/* Modal จบงาน */}
          {showEndModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>ยืนยันการจบงานหรือไม่</h3>
                <p>หากยืนยัน คุณไม่สามารถย้อนกลับได้</p>
                <div className="modal-actions">
                  <button className="btn-confirm" onClick={handleEndWork}>
                    ยืนยัน
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setShowEndModal(false)}
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
export default Currentjob;
