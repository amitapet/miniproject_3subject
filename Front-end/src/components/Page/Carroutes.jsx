import { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import './carRoutes.css';

function CarRoutes() {
    const [routes, setRoutes] = useState([]);
    const [stations, setStations] = useState([]);
    const [form, setForm] = useState({
        ID: "",
        NAME_ROUTE: "",
        selectedStations: [],
    });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");


    // เรียกดูข้อมูลเส้นทาง และ สถานี
    const fetchData = async () => {
        try {
            const [routesRes, stationsRes] = await Promise.all([
                axios.get("http://localhost:3000/carroutes"),
                axios.get("http://localhost:3000/stations"),
            ]);
            setRoutes(routesRes.data);
            setStations(stationsRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            Swal.fire("Error", "Failed to fetch data from the server.", "error");
        }
    };
    // เรียกดูข้อมูล route_stations ตอนแก้ไข
    const fetchRouteStations = async (routeId) => {
        try {
            const response = await axios.get(`http://localhost:3000/route_stations/${routeId}`);
            return response.data.map(rs => ({
                stationId: rs.STOPS_ID,
                time: rs.STATION_TIME,
                seq_no: rs.SEQ_NO
            }));
        } catch (error) {
            console.error('❌ fetchRouteStations error:', error.response?.data || error.message);
            return [];
        }
    };

    // เวลาแก้ไขเส้นทาง โหลด stations จาก route_stations ด้วย
    const handleEdit = async (route) => {
        try {
            const routeStations = await fetchRouteStations(route.ID);

            setForm({
                ID: route.ID,
                NAME_ROUTE: route.NAME_ROUTE,
                selectedStations: routeStations
            });
            setEditingId(route.ID);
            setShowForm(true);
        } catch (err) {
            console.error("❌ handleEdit error:", err);
            Swal.fire("ผิดพลาด", "โหลดข้อมูลจุดจอดไม่สำเร็จ", "error");
        }
    };


    useEffect(() => {
        fetchData();
        fetchRouteStations();
    }, []);

    // คำนวณเวลารวมเมื่อมีการเปลี่ยนแปลง
    useEffect(() => {
        const total = form.selectedStations.reduce((sum, station) => sum + (parseInt(station.time) || 0), 0);
        setForm(prevForm => ({ ...prevForm, TOTALSUM_TIME: total }));
    }, [form.selectedStations]);

    // ปรับปรุงฟอร์ม เมื่อมีการเปลี่ยนแปลง input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // เพิ่มแถวสถานีใหม่
    const handleAddStation = () => {
        setForm({
            ...form,
            selectedStations: [...form.selectedStations, { stationId: '', time: 0 }]
        });
    };

    // อัปเดตสถานีที่เลือกในแถวที่ระบุ
    const handleStationChange = (index, value) => {
        const newStations = [...form.selectedStations];
        newStations[index].stationId = value;
        setForm({ ...form, selectedStations: newStations });
    };

    // อัปเดตเวลาในแถวที่ระบุ
    const handleTimeChange = (index, value) => {
        const newStations = [...form.selectedStations];
        newStations[index].time = parseInt(value, 10) || 0;
        setForm({ ...form, selectedStations: newStations });
    };

    // ลบแถวสถานีที่ระบุ
    const handleRemoveStation = (index) => {
        const newStations = form.selectedStations.filter((_, i) => i !== index);
        setForm({ ...form, selectedStations: newStations });
    };

    // ปุมบันทึก
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nameRoute: form.NAME_ROUTE,
                totalTime: form.TOTALSUM_TIME || 0,
                stations: form.selectedStations.map((s, idx) => ({
                    stops_id: Number(s.stationId),
                    station_time: Number(s.time),
                    seq_no: idx + 1,
                }))
            };

            if (editingId) {
                const response = await axios.put(`http://localhost:3000/carroutes/${editingId}`, payload);
                console.log("Update response:", response.data);
            } else {
                const response = await axios.post("http://localhost:3000/carroutes", {
                    id: form.ID,
                    ...payload
                });
                console.log("Create response:", response.data);
            }

            Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว!", "success");
        } catch (error) {
            console.error("Error details:", error.response?.data || error.message);

            if (error.response?.status === 400) {
                Swal.fire("ผิดพลาด", error.response.data.error, "error");
            } else if (error.response?.status === 404) {
                Swal.fire("ผิดพลาด", "ไม่พบเส้นทางนี้ในระบบ", "error");
            } else {
                Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์", "error");
            }
        }
    };

    // ปุ่มลบเส้นทาง
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "คุณแน่ใจหรือไม่?",
            text: "คุณต้องการลบเส้นทางนี้จริงๆ หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ใช่, ลบเลย!",
            cancelButtonText: "ยกเลิก",
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:3000/carroutes/${id}`);
                Swal.fire("ลบเรียบร้อย!", "เส้นทางถูกลบแล้ว", "success");
                fetchData();
            } catch (err) {
                console.error("Deletion error:", err);
                Swal.fire("ผิดพลาด", "การลบล้มเหลว ในเส้นทางมีจุดอยู่", "error");
            }
        }
    };

    // ป๊อปอัพฟอร์มเพิ่มเส้นทางใหม่
    const handleAddNew = () => {
        resetForm();
        setShowForm(true);
    };

    // ยกเลิกป๊อปอัพฟอร์ม
    const handleCancel = () => {
        resetForm();
        setShowForm(false);
    };

    // ตั้งค่าเริ่มต้นฟอร์ม
    const resetForm = () => {
        setForm({
            ID: "",
            NAME_ROUTE: "",
            selectedStations: []
        });
        setEditingId(null);
    };

    // ค้นหาเส้นทาง
    const filteredRoutes = routes.filter((route) =>
        route.NAME_ROUTE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.ID.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="car-routes-container">
            <div className="header">
                <h1>จัดการเส้นทางรถ</h1>
                <button className="add-button" onClick={handleAddNew}>
                    เพิ่มเส้นทาง
                </button>
            </div>
            <div className="search-box">
                <input
                    type="text"
                    placeholder="🔍 ค้นหารหัสเส้นทาง, ชื่อเส้นทาง"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>รหัสเส้นทาง</th>
                            <th>ชื่อเส้นทาง</th>
                            <th>เวลารวม (นาที)</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRoutes.length > 0 ? (
                            filteredRoutes.map((route) => (
                                <tr key={route.ID}>
                                    <td>{route.ID}</td>
                                    <td>{route.NAME_ROUTE}</td>
                                    <td>{route.TOTALSUM_TIME}</td>
                                    <td>
                                        <button className="edit-button" onClick={() => handleEdit(route)}>
                                            แก้ไข
                                        </button>
                                        <button className="delete-button" onClick={() => handleDelete(route.ID)}>
                                            ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="no-data">ไม่พบข้อมูลเส้นทาง</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Modal Form */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingId ? "แก้ไขเส้นทาง" : "เพิ่มเส้นทางใหม่"}</h2>
                            <button className="close-button" onClick={handleCancel}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>รหัสเส้นทาง:</label>
                                <input
                                    type="text"
                                    name="ID"
                                    value={form.ID}
                                    onChange={handleChange}
                                    required
                                    disabled={!!editingId}
                                />
                            </div>
                            <div className="form-group">
                                <label>ชื่อเส้นทาง:</label>
                                <input
                                    type="text"
                                    name="NAME_ROUTE"
                                    value={form.NAME_ROUTE}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="station-list-section">
                                <div className="section-header">
                                    <label>รายการจุดจอด</label>
                                    <button
                                        type="button"
                                        className="add-station-button"
                                        onClick={handleAddStation}
                                    >
                                        + เพิ่มจุดจอด
                                    </button>
                                </div>
                                {form.selectedStations.map((station, index) => (
                                    <div key={index} className="station-row">
                                        <div className="station-number">{index + 1}</div>
                                        <select
                                            className="station-select"
                                            value={station.stationId}
                                            onChange={(e) => handleStationChange(index, e.target.value)}
                                        >
                                            <option value="">เลือกสถานี</option>
                                            {stations.map(s => (
                                                <option key={s.ID} value={s.ID}>
                                                    {s.NAME}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={station.time}
                                            onChange={(e) => handleTimeChange(index, e.target.value)}
                                            placeholder="เวลา (นาที)"
                                            min="0"
                                        />
                                        <button
                                            type="button"
                                            className="remove-station-button"
                                            onClick={() => handleRemoveStation(index)}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <div className="total-time-display">
                                    เวลารวม: {form.TOTALSUM_TIME || 0} นาที
                                </div>
                            </div>
                            <div className="button-group">
                                <button type="button" className="cancel-button" onClick={handleCancel}>
                                    ยกเลิก
                                </button>
                                <button type="submit" className="submit-button">
                                    {editingId ? "อัปเดตเส้นทาง" : "บันทึกเส้นทาง"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CarRoutes;