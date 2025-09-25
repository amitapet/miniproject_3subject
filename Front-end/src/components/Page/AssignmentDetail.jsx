import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./Driver.css";

function AssignmentDetail() {
  const { id } = useParams(); // tripId จาก route
  const navigate = useNavigate();
  const [passengers, setPassengers] = useState([]);
  const [schedule, setSchedule] = useState(null);

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
      } catch (err) {
        console.error("❌ Fetch passengers error:", err);
      }
    };

    const fetchSchedule = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/assignment/${empId}`
        );
        // หา trip ที่ id ตรงกับที่กดเข้ามา
        const trip = res.data.find((t) => String(t.ID) === String(id));
        setSchedule(trip);
      } catch (err) {
        console.error("❌ Fetch schedule error:", err);
      }
    };

    if (empId) {
      fetchSchedule();
    }
    fetchPassengers();
  }, [id, empId]);

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
              <p>ลูกค้าจองแล้ว : {passengers.length} ที่นั่ง</p>
            </div>
            <div className="job-route">
              <p>เริ่มงาน เวลา : {schedule.TIMEOUT} น.</p>
              <button className="btn-route">เส้นทาง</button>
            </div>
          </div>
        )}

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
            {passengers.map((p, i) => (
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
        <button className="btn-start">เริ่มงาน</button>
      </div>
    </>
  );
}

export default AssignmentDetail;
