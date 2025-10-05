import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../Sidebar";
import "./Driver.css";

function Resultdetail() {
  const { tripId } = useParams();
  const [tripInfo, setTripInfo] = useState(null);
  const [stops, setStops] = useState([]);
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

            // 3. ดึง reserve (จำนวนขึ้น/ลง)
            const boardingRes = await axios.get(
              `http://localhost:3000/result/count/${tripId}`
            );

            // ใช้ object เก็บจำนวนขึ้น/ลงโดยอิงจากชื่อสถานี
            const boardingData = {};
            boardingRes.data.forEach((row) => {
              if (row.STATUS === "getin") {
                // คนขึ้นที่ NAME
                if (!boardingData[row.NAME])
                  boardingData[row.NAME] = { boarding: 0, alighting: 0 };
                boardingData[row.NAME].boarding += row.SEAT;

                // คนลงที่ NAME_1
                if (!boardingData[row.NAME_1])
                  boardingData[row.NAME_1] = { boarding: 0, alighting: 0 };
                boardingData[row.NAME_1].alighting += row.SEAT;
              }
            });

            // 4. merge ข้อมูลกับ stops
            const mergedStops = stopsData.map((stop) => {
              const board = boardingData[stop.NAME] || {
                boarding: 0,
                alighting: 0,
              };
              return {
                ...stop,
                boarding: board.boarding,
                alighting: board.alighting,
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

  // ฟังก์ชันคำนวณเวลาถึง
  function calculateArrivalTimes(timeoutHour, stationTimes) {
    const arrivalTimes = [];
    let totalMinutes = timeoutHour * 60;
    for (let i = 0; i < stationTimes.length; i++) {
      totalMinutes += stationTimes[i];
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
            <p>เวลาเดินทาง: {formatTime(tripInfo.TIMEOUT)}</p>
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
