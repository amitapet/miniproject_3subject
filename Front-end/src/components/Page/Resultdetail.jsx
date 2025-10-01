import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar";
import "./Driver.css";

function Resultdetail() {
  const { tripId } = useParams();
  const [tripInfo, setTripInfo] = useState(null);
  const [stops, setStops] = useState([]); // stops จาก DB
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripDetail = async () => {
      try {
        // 1. ดึง trip detail
        const res = await axios.get(
          `http://localhost:3000/workdetail/${tripId}`
        );
        if (res.data && res.data.length > 0) {
          const trip = res.data[0];
          setTripInfo(trip);

          // 2. ดึง stops ของ route
          const Rid = trip.ROUTEID;
          if (Rid || Rid === 0) {
            const stopRes = await axios.get(
              `http://localhost:3000/result/${Rid}`
            );
            const stopsData = stopRes.data || [];

            // 3. ดึงจำนวนขึ้นลงต่อจุด
            const boardingRes = await axios.get(
              `http://localhost:3000/result/count/${tripId}`
            );
            const boardingData = boardingRes.data;

            // 4. merge ข้อมูล
            const mergedStops = stopsData.map((stop) => {
              const board = boardingData.find(
                (b) => b.STATION_NAME === stop.NAME
              );
              return {
                ...stop,
                boarding: board ? board.BOARDING : 0,
                alighting: board ? board.ALIGHTING : 0,
              };
            });

            setStops(mergedStops);
          }
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
  function calculateArrivalTimes(timeoutHour, stationTimes) {
    const arrivalTimes = [];
    let totalMinutes = timeoutHour * 60; // เวลาเริ่มต้นเป็นนาที
    for (let i = 0; i < stationTimes.length; i++) {
      totalMinutes += stationTimes[i]; // บวกสะสม
      const h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      arrivalTimes.push(
        `${String(h).padStart(2, "0")}.${String(m).padStart(2, "0")}`
      );
    }
    return arrivalTimes;
  }
  const arrivalTimes = calculateArrivalTimes(
    tripInfo.TIMEOUT,
    stops.map((s) => s.STATION_TIME)
  );

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
              {stops.map((stop, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{stop.NAME}</td>
                  <td>{arrivalTimes[index]}</td>
                  <td>{stop.boarding}</td>
                  <td>{stop.alighting}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default Resultdetail;
