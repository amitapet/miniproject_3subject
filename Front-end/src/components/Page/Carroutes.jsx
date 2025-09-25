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

    // Fetch routes and stations from the API
    const fetchData = async () => {
        try {
            const [routesRes, stationsRes] = await Promise.all([
                axios.get("http://localhost:3000/carroutes"),
                axios.get("http://localhost:3000/stations")
            ]);
            setRoutes(routesRes.data);
            setStations(stationsRes.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            Swal.fire("Error", "Failed to fetch data from the server.", "error");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Recalculate total time whenever selectedStations changes
    useEffect(() => {
        const total = form.selectedStations.reduce((sum, station) => sum + (parseInt(station.time) || 0), 0);
        setForm(prevForm => ({ ...prevForm, TOTALSUM_TIME: total }));
    }, [form.selectedStations]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    // Add a new station row
    const handleAddStation = () => {
        setForm({
            ...form,
            selectedStations: [...form.selectedStations, { stationId: '', time: 0 }]
        });
    };

    // Update station selection for a specific row
    const handleStationChange = (index, value) => {
        const newStations = [...form.selectedStations];
        newStations[index].stationId = value;
        setForm({ ...form, selectedStations: newStations });
    };

    // Update travel time for a specific row
    const handleTimeChange = (index, value) => {
        const newStations = [...form.selectedStations];
        newStations[index].time = parseInt(value, 10) || 0;
        setForm({ ...form, selectedStations: newStations });
    };

    // Remove a station row
    const handleRemoveStation = (index) => {
        const newStations = form.selectedStations.filter((_, i) => i !== index);
        setForm({ ...form, selectedStations: newStations });
    };

    // Handle form submission (add or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update route
                await axios.put(`http://localhost:3000/carroutes/${editingId}`, {
                    nameRoute: form.NAME_ROUTE,
                    totalTime: form.TOTALSUM_TIME
                });
                Swal.fire("สำเร็จ", "อัปเดตเส้นทางเรียบร้อยแล้ว!", "success");
            } else {
                // Add new route
                const stationsWithTime = form.selectedStations.map(s => ({
                    id: s.stationId,
                    time: s.time
                }));
                await axios.post("http://localhost:3000/carroutes", {
                    id: form.ID,
                    nameRoute: form.NAME_ROUTE,
                    stations: stationsWithTime,
                    totalTime: form.TOTALSUM_TIME
                });
                Swal.fire("สำเร็จ", "เพิ่มเส้นทางเรียบร้อยแล้ว!", "success");
            }
            resetForm();
            fetchData();
        } catch (err) {
            console.error("Submission error:", err);
            const errorMsg = err.response?.data?.details || "การดำเนินการล้มเหลว";
            Swal.fire("ผิดพลาด", errorMsg, "error");
        }
    };

    // Handle "Edit" button click
    const handleEdit = (route) => {
        setForm({
            ID: route.ID,
            NAME_ROUTE: route.NAME_ROUTE,
            selectedStations: route.STATIONS || [],
        });
        setEditingId(route.ID);
        setShowForm(true);
    };

    // Handle "Delete" button click
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
                Swal.fire("ผิดพลาด", "การลบล้มเหลว", "error");
            }
        }
    };

    // Show the add form
    const handleAddNew = () => {
        resetForm();
        setShowForm(true);
    };

    // Cancel and close the form
    const handleCancel = () => {
        resetForm();
        setShowForm(false);
    };

    // Reset form state to initial values
    const resetForm = () => {
        setForm({
            ID: "",
            NAME_ROUTE: "",
            selectedStations: []
        });
        setEditingId(null);
    };

    // Filter routes based on search term
    const filteredRoutes = routes.filter((route) =>
        route.NAME_ROUTE.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.ID.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="car-routes-container">
            {/* ... (existing table and header) ... */}
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