import Sidebar from '../Sidebar';
import { useEffect, useState } from "react";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from "recharts";
import styles from "./Report1.module.css";

function Report1() {
    const [data, setData] = useState([]);
    const [year, setYear] = useState(2568);
    const [market, setMarket] = useState("ขาขึ้น");

    useEffect(() => {
        axios.get(`http://localhost:3000/reports?year=${year}`)
            .then((res) => setData(res.data))
            .catch((err) => console.error(err));
    }, [year]);

    useEffect(() => {
        axios.get(`http://localhost:3000/reports?year=${year}&market=${market}`)
            .then((res) => setData(res.data))
            .catch((err) => console.error(err));
    }, [market, year]);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>📊 รายงานผู้โดยสาร ปี {year}</h1>

            <div>
                <label>เลือกปี: </label>
                <select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="2567">2567</option>
                    <option value="2568">2568</option>
                </select>
            </div>

            <div>
                <label>เลือกขาขึ้น-ลง: </label>
                <select value={market} onChange={(e) => setMarket(e.target.value)}>
                    <option value="ขาขึ้น">ขาขึ้น</option>
                    <option value="ขาลง">ขาลง</option>
                </select>
            </div>

            {/* ตารางรายงาน */}
            <table className={styles.table}>
                <thead >
                    <tr >
                        <th>สถานี</th>
                        <th>เดือน</th>
                        <th>ขึ้น (คน)</th>
                        <th>ลง (คน)</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.values(
                        data.reduce((acc, row) => {
                            if (!acc[row.STATION_NAME]) acc[row.STATION_NAME] = [];
                            acc[row.STATION_NAME].push(row);
                            return acc;
                        }, {})
                    ).map((rows, idx) => {
                        const totalIn = rows.reduce((sum, r) => sum + r.PASSENGER_IN, 0);
                        const totalOut = rows.reduce((sum, r) => sum + r.PASSENGER_OUT, 0);

                        return (
                            <React.Fragment key={idx}>
                                {rows.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.STATION_NAME}</td>
                                        <td>{row.MONTH}</td>
                                        <td>{row.PASSENGER_IN}</td>
                                        <td>{row.PASSENGER_OUT}</td>
                                        <td>{row.PASSENGER_IN + row.PASSENGER_OUT}</td>
                                    </tr>
                                ))}
                                <tr className={styles.totalRow}>
                                    <td colSpan="2">รวม {rows[0].STATION_NAME}</td>
                                    <td>{totalIn}</td>
                                    <td>{totalOut}</td>
                                    <td>{totalIn + totalOut}</td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>

            {/* กราฟ ผู้โดยสารขึ้น */}
            <h2 className={styles.chartTitle}>จำนวนผู้โดยสารขึ้น รายเดือน ปี {year}</h2>
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
            <h2 className={styles.chartTitle}>จำนวนผู้โดยสารลง รายเดือน ปี {year}</h2>
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
