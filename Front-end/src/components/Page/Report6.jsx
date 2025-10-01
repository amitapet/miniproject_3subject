import React, { useState } from "react";
import "./Report6.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Report6() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      alert("กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด");
      return;
    }

    const res = await fetch(
      `http://localhost:3000/report6?start=${startDate}&end=${endDate}`
    );
    const result = await res.json();
    setData(result);
  };

  // สร้างข้อมูลสำหรับกราฟ (ไม่รวมแถว 'รวมทั้งหมด')
  const chartData = Array.isArray(data)
    ? data.filter((row) => row.EMPLOYEE_ID) // ตัดแถวรวมทั้งหมดออก
    : [];

  return (
    <div className="report6-container">
      <h2>รายงานจำนวนรอบงานพนักงาน</h2>

      <div className="date-filter">
        <label>Start Date: </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <label>End Date: </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={fetchReport}>ค้นหา</button>
      </div>

      <table className="report6-table">
        <thead>
          <tr>
            <th>รหัสพนักงาน</th>
            <th>ชื่อ-นามสกุล</th>
            <th>รวมทั้งหมด</th>
            <th>ก่อน 17:00</th>
            <th>หลัง 17:00</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(data) &&
            data.map((row) => (
              <tr key={row.EMPLOYEE_ID + row.EMPLOYEE_NAME}>
                <td>{row.EMPLOYEE_ID}</td>
                <td>{row.EMPLOYEE_NAME}</td>
                <td>{row.TOTAL}</td>
                <td>{row.BEFORE17}</td>
                <td>{row.AFTER17}</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* กราฟ */}
      <h3 className="report6-chart-title">กราฟจำนวนรอบงาน (ก่อน/หลัง 17:00)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <XAxis dataKey="EMPLOYEE_NAME" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="BEFORE17" fill="#1976d2" name="ก่อน 17:00" />
          <Bar dataKey="AFTER17" fill="#ff9800" name="หลัง 17:00" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Report6;
