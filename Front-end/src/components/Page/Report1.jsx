import Sidebar from '../Sidebar';
import { useEffect, useState } from "react";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from "recharts";

function Report1() {
    const [data, setData] = useState([]);
    const [year, setYear] = useState(2568);

    useEffect(() => {
        axios.get(`http://localhost:3000/reports?year=${year}`)
            .then((res) => setData(res.data))
            .catch((err) => console.error(err));
    }, [year]);

    return (
        <div style={{ padding: "20px" }}>
            <h1>📊 รายงานผู้โดยสาร ปี {year}</h1>

            {/* เลือกปี */}
            <div>
                <label>เลือกปี: </label>
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="2567">2567</option>
                    <option value="2568">2568</option>
                </select>
            </div>

            {/* ตารางรายงาน */}
            <table border="1" cellPadding="8" style={{ marginTop: "20px", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th>สถานี</th>
                        <th>เดือน</th>
                        <th>ขึ้น (คน)</th>
                        <th>ลง (คน)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={idx}>
                            <td>{row.STATION_NAME}</td>
                            <td>{row.MONTH}</td>
                            <td>{row.PASSENGER_IN}</td>
                            <td>{row.PASSENGER_OUT}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* กราฟ ผู้โดยสารขึ้น */}
            <h2 style={{ marginTop: "30px" }}>จำนวนผู้โดยสารขึ้น รายเดือน ปี {year}</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="MONTH" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="PASSENGER_IN" fill="#8884d8" name="ขึ้น" />
                </BarChart>
            </ResponsiveContainer>

            {/* กราฟ ผู้โดยสารลง */}
            <h2 style={{ marginTop: "30px" }}>จำนวนผู้โดยสารลง รายเดือน ปี {year}</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="MONTH" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="PASSENGER_OUT" fill="#82ca9d" name="ลง" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
export default Report1;