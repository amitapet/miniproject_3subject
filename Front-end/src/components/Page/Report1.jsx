import Sidebar from '../Sidebar';
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from "recharts";
import styles from "./Report1.module.css";

function Report1() {
    const [data, setData] = useState([]);
    const [year, setYear] = useState(2025);
    const [market, setMarket] = useState("ขาขึ้น");

    const thaiMonths = [
        "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
        "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
    ];

    // แสดงผลปีเป็น พ.ศ.
    const displayYear = year + 543;

    useEffect(() => {
        axios.get(`http://localhost:3000/report1?year=${year}`)
            .then((res) => setData(res.data))
            .catch((err) => console.error(err));
    }, [year]);

    // pivot สำหรับกราฟ
    const pivotData = thaiMonths.map((m, i) => {
        const monthNum = i + 1;
        const row = { MONTH: m };

        data.filter(r => r.MONTH === monthNum).forEach(r => {
            row[r.STATION_NAME] = market === "ขาขึ้น" ? r.PASSENGER_IN : r.PASSENGER_OUT;
        });

        return row;
    });

    // รายชื่อสถานี
    const stations = [...new Set(data.map(r => r.STATION_NAME))];

    // ชุดสี
    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042",
        "#0088FE", "#00C49F", "#FFBB28", "#FF6666"];

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>📊 รายงานผู้โดยสาร ปี {displayYear}</h1>

            {/* เลือกปี */}
            <div>
                <label>เลือกปี: </label>
                <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                    <option value="2024">2567</option>
                    <option value="2025">2568</option>
                </select>
            </div>

            {/* เลือกขาขึ้น/ขาลง */}
            <div>
                <label>เลือกขาขึ้น-ลง: </label>
                <select value={market} onChange={(e) => setMarket(e.target.value)}>
                    <option value="ขาขึ้น">ขาขึ้น</option>
                    <option value="ขาลง">ขาลง</option>
                </select>
            </div>

            {/* ตารางรายงาน */}
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th rowSpan="2">สถานี</th>
                        {thaiMonths.map((m, idx) => (
                            <th key={idx} colSpan="2">{m}</th>
                        ))}
                        <th colSpan="2">รวม</th>
                    </tr>
                    <tr>
                        {thaiMonths.map((_, idx) => (
                            <React.Fragment key={idx}>
                                <th>ขึ้น</th>
                                <th>ลง</th>
                            </React.Fragment>
                        ))}
                        <th>ขึ้น</th>
                        <th>ลง</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(
                        data.reduce((acc, row) => {
                            if (!acc[row.STATION_NAME]) acc[row.STATION_NAME] = {};
                            acc[row.STATION_NAME][row.MONTH] = row;
                            return acc;
                        }, {})
                    ).map(([station, rows], idx) => {
                        const totalIn = Object.values(rows).reduce((sum, r) => sum + (r?.PASSENGER_IN || 0), 0);
                        const totalOut = Object.values(rows).reduce((sum, r) => sum + (r?.PASSENGER_OUT || 0), 0);

                        return (
                            <tr key={idx}>
                                <td>{station}</td>
                                {Array.from({ length: 12 }, (_, i) => {
                                    const month = i + 1;
                                    const r = rows[month] || {};
                                    return (
                                        <React.Fragment key={month}>
                                            <td>{r.PASSENGER_IN || 0}</td>
                                            <td>{r.PASSENGER_OUT || 0}</td>
                                        </React.Fragment>
                                    );
                                })}
                                <td>{totalIn}</td>
                                <td>{totalOut}</td>
                            </tr>
                        );
                    })}
                    {/* แถวรวมทุกสถานี */}
                    <tr className={styles.totalRow}>
                        <td>รวมทุกสถานี</td>
                        {Array.from({ length: 12 }, (_, i) => {
                            const month = i + 1;
                            const totalInMonth = data.filter(r => r.MONTH === month)
                                .reduce((sum, r) => sum + (r.PASSENGER_IN || 0), 0);
                            const totalOutMonth = data.filter(r => r.MONTH === month)
                                .reduce((sum, r) => sum + (r.PASSENGER_OUT || 0), 0);
                            return (
                                <React.Fragment key={month}>
                                    <td>{totalInMonth}</td>
                                    <td>{totalOutMonth}</td>
                                </React.Fragment>
                            );
                        })}
                        <td>
                            {data.reduce((sum, r) => sum + (r.PASSENGER_IN || 0), 0)}
                        </td>
                        <td>
                            {data.reduce((sum, r) => sum + (r.PASSENGER_OUT || 0), 0)}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* กราฟ grouped bar */}
            <h2 className={styles.chartTitle}>
                จำนวนผู้โดยสาร {market} รายเดือน ปี {displayYear}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={pivotData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="MONTH" />
                    <YAxis />
                    <Tooltip />
                    <Legend /> {/* 👈 แสดงชื่อสถานีและสี */}
                    {stations.map((st, idx) => (
                        <Bar
                            key={st}
                            dataKey={st}
                            fill={colors[idx % colors.length]}
                            name={st}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

export default Report1;
