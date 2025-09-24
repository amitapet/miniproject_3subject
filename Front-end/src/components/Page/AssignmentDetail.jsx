import { useParams, useNavigate } from "react-router-dom";
import "./Driver.css";

function AssignmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const passengers = [
    {
      id: 1,
      phone: "098-999-9999",
      name: "สมศักดิ์ นวมวงศ์",
      from: "ตลาดนัด",
      to: "หน้ามอ",
      seat: 2,
    },
    {
      id: 2,
      phone: "098-999-9999",
      name: "สมศรี นวมวงศ์",
      from: "ตลาดนัด",
      to: "บางกอกกรีฑา",
      seat: 1,
    },
    {
      id: 3,
      phone: "098-999-9999",
      name: "สมใจ นวมวงศ์",
      from: "ปตท",
      to: "หน้ามอ",
      seat: 1,
    },
  ];

  return (
    <>
      <title>รายละเอียดงานที่ได้รับมอบหมาย</title>
      <div className="page-container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          ⬅ กลับ
        </button>

        <div className="job-info-card">
          <div className="job-info">
            <h3>รายละเอียดงาน</h3>
            <p>รอบที่ {id}</p>
            <p>สถานี : ตลาดนัด → หน้ามอ</p>
            <p>วันที่ 01/01/2568</p>
            <p>เวลารถออก : 9.30 น.</p>
          </div>
          <div className="job-extra">
            <p>จุดจอดทั้งหมด : 11 จุด</p>
            <p>ที่นั่งทั้งหมด : 12 ที่นั่ง</p>
            <p>ลูกค้าจองแล้ว : 10 ที่นั่ง</p>
          </div>
          <div className="job-route">
            <p>เริ่มงาน เวลา : 9.30 น.</p>
            <button className="btn-route">เส้นทาง</button>
          </div>
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
            {passengers.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{p.phone}</td>
                <td>{p.name}</td>
                <td>{p.from}</td>
                <td>{p.to}</td>
                <td>{p.seat}</td>
                <td>-</td>
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
