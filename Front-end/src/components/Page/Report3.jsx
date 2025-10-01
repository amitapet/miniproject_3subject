import Sidebar from "../Sidebar";
import "./Report3.css";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function Report3() {
  const [start, setStartDate] = useState("");
  const [end, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartData = reportData.map((row) => ({
    USERNAME: row.USERNAME,
    TOTAL_RESERVES: row.TOTAL_RESERVES,
    RIDES_ACTUAL: row.RIDES_ACTUAL,
    CANCELLED: row.CANCELLED,
    NO_SHOW: row.NO_SHOW,
  }));

  useEffect(() => {
    if (start && end) {
      setLoading(true);
      setError(null);

      axios
        .get(`http://localhost:3000/reports/report3`, {
          params: {
            start_date: start,
            end_date: end,
          },
        })
        .then((res) => {
          setReportData(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์");
          setLoading(false);
          setReportData([]);
        });
    }
  }, [start, end]);

  return (
    <div className="positions-wrapper" style={{ display: "flex" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: "20px" }}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
          รายงานพฤติกรรมผู้ใช้งาน
        </h2>

        {/* Date Picker */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div>
            <label>เลือกวันที่เริ่มต้น</label>
            <br />
            <input
              type="date"
              value={start}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label>เลือกวันที่สิ้นสุด</label>
            <br />
            <input
              type="date"
              value={end}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ color: "red", textAlign: "center" }}>{error}</div>
        )}

        {/* Loading */}
        {loading && <div style={{ textAlign: "center" }}>กำลังโหลด...</div>}

        {/* Table */}
        <div>
          <table
            border="1"
            style={{
              width: "100%",
              marginTop: "20px",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1976d2", color: "white" }}>
                <th style={{ backgroundColor: "#05375a" }}>ผู้ใช้</th>
                <th style={{ backgroundColor: "#05375a" }}>การจองทั้งหมด</th>
                <th style={{ backgroundColor: "#05375a" }}>ขึ้นรถจริง</th>
                <th style={{ backgroundColor: "#05375a" }}>ยกเลิก</th>
                <th style={{ backgroundColor: "#05375a" }}>No Show</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? (
                reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.USERNAME}</td>
                    <td style={{ textAlign: "center" }}>
                      {row.TOTAL_RESERVES}
                    </td>
                    <td style={{ textAlign: "center" }}>{row.RIDES_ACTUAL}</td>
                    <td style={{ textAlign: "center" }}>{row.CANCELLED}</td>
                    <td style={{ textAlign: "center" }}>{row.NO_SHOW}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", padding: "20px" }}
                  >
                    {start && end
                      ? "ไม่พบข้อมูลในช่วงเวลาที่เลือก"
                      : "กรุณาเลือกช่วงวันที่"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Graph */}
          <div
            style={{
              width: "90%", // same as table
              height: "400px",
              marginTop: "40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginLeft: "40px",
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="USERNAME" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="TOTAL_RESERVES" fill="#1976d2" />
                <Bar dataKey="RIDES_ACTUAL" fill="#00c853" />
                <Bar dataKey="CANCELLED" fill="#ff9800" />
                <Bar dataKey="NO_SHOW" fill="#d32f2f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report3;
