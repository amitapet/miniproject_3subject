import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar";
import "./Driver.css";

function Resultdetail() {
  const { tripId } = useParams(); // ดึง tripId จาก URL
  const [tripInfo, setTripInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log("trip = ",tripId);

  // mock stops (ตรงนี้คุณอาจทำ API แยกเหมือนกันได้)
  const stops = [
    { id: 1, name: "ตลาดนิน", time: "09:32 น.", up: 3, down: 0 },
    { id: 2, name: "สะพาน", time: "09:36 น.", up: 0, down: 0 },
    { id: 3, name: "โลตัส", time: "09:43 น.", up: 0, down: 0 },
    { id: 4, name: "ปตท.", time: "09:48 น.", up: 1, down: 0 },
    { id: 5, name: "kfc", time: "09:51 น.", up: 0, down: 0 },
    { id: 6, name: "แยกหนองจอก", time: "09:55 น.", up: 6, down: 0 },
    { id: 7, name: "7-11", time: "10:00 น.", up: 0, down: 0 },
    { id: 8, name: "สำนักสิช", time: "10:10 น.", up: 0, down: 0 },
    { id: 9, name: "สะพานยอดฮิต", time: "10:20 น.", up: 0, down: 0 },
    { id: 10, name: "บางกอกอารีนา", time: "10:25 น.", up: 0, down: 1 },
  ];

  useEffect(() => {
    const fetchTripDetail = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/workdetail/${tripId}`
        );
        if (res.data && res.data.length > 0) {
          setTripInfo(res.data[0]); // API return เป็น array
        }
      } catch (err) {
        console.error("❌ Error fetching trip detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetail();
  }, [tripId]);

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="page-container">
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </>
    );
  }

  if (!tripInfo) {
    return (
      <>
        <Sidebar />
        <div className="page-container">
          <p>ไม่พบข้อมูลการเดินรถ</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="page-container">
        {/* กล่องรายละเอียดเส้นทาง */}
        <div className="job-info-card">
          <div className="job-info">
            <p>
              <b>เส้นทางการเดินรถ รอบที่ {tripInfo.ID}</b>
            </p>
            <p>เส้นทาง: {tripInfo.NAME_ROUTE}</p>
            <p>
              รถ: {tripInfo.NAME} &nbsp; ทะเบียน: {tripInfo.ID_CAR}
            </p>
            <p>เวลาเดินทาง: {tripInfo.TIMEOUT}</p>
            <p>มีผู้ใช้บริการจองทั้งหมด : {tripInfo.SEAT} ที่นั่ง</p>
          </div>
          <div className="job-extra">
            <p>สถานี: ต้นทาง - ปลายทาง</p>
            <p>{tripInfo.NAME_ROUTE}</p>
          </div>
        </div>

        {/* ตารางข้อมูลจุดจอด */}
        <div>
          <h3>ข้อมูลจุดจอด</h3>
          <table className="passenger-table">
            <thead>
              <tr>
                <th>จุดที่</th>
                <th>จุดจอด</th>
                <th>เวลาถึงจุดหมาย</th>
                <th>จำนวนขึ้น</th>
                <th>จำนวนลง</th>
              </tr>
            </thead>
            <tbody>
              {stops.map((stop) => (
                <tr key={stop.id}>
                  <td>{stop.id}</td>
                  <td>{stop.name}</td>
                  <td>{stop.time}</td>
                  <td>{stop.up} คน</td>
                  <td>{stop.down} คน</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button>{"<"}</button>
          <span>1/2 หน้า</span>
          <button>{">"}</button>
        </div>
      </div>
    </>
  );
}

export default Resultdetail;
