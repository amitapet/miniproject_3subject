import { useState, useEffect } from 'react';
import '../Sidebar.css';
import Sidebar from '../Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';
import styles from './station.module.css';

/*ส่วนโค้ดของ จัดการจุดสถานี*/
function Stations() {

    const [stations, setStations] = useState([]);
    const [form, setForm] = useState({
        NAME: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    //สำหรับ search
    const [searchTerm, setSearchTerm] = useState("");

    // Load stations
    const fetchStations = async () => {
        try {
            const res = await axios.get("http://localhost:3000/stations");
            setStations(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStations();
    }, []);

    // Handle form change
    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Handle submit (insert or update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                // Update
                await axios.put(`http://localhost:3000/stations/${editingId}`, form);
                Swal.fire("สำเร็จ", "อัปเดตจุดจอดเรียบร้อยแล้ว!", "success");
            } else {
                // Insert
                await axios.post("http://localhost:3000/stations", form);
                Swal.fire("สำเร็จ", "เพิ่มจุดจอดเรียบร้อยแล้ว!", "success");
            }
            setForm({ NAME: "" });
            setEditingId(null);
            setShowForm(false);
            fetchStations();
        } catch (err) {
            console.error(err);
            Swal.fire("ผิดพลาด", "การดำเนินการล้มเหลว", "error");
        }
    };

    // Handle edit
    const handleEdit = (station) => {
        setForm({
            NAME: station.NAME,
        });
        setEditingId(station.ID);
        setShowForm(true);
    };

    // Handle delete
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "คุณแน่ใจหรือไม่?",
            text: "คุณต้องการลบจุดจอดนี้จริงๆ หรือไม่?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "ใช่, ลบเลย!",
            cancelButtonText: "ยกเลิก",
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`http://localhost:3000/stations/${id}`);
                Swal.fire("ลบเรียบร้อย!", "จุดจอดถูกลบแล้ว", "success");
                fetchStations();
            } catch (err) {
                console.error(err);
                Swal.fire("ผิดพลาด", "การลบล้มเหลว", "error");
            }
        }
    };

    // Handle add new button
    const handleAddNew = () => {
        setForm({ NAME: "" });
        setEditingId(null);
        setShowForm(true);
    };

    // Handle cancel form
    const handleCancel = () => {
        setForm({ NAME: "" });
        setEditingId(null);
        setShowForm(false);
    };

    // กรองข้อมูลค้นหา
    const filteredStations = stations.filter((station) =>
        station.NAME.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>จัดการจุดจอด</h1>
                <button
                    className={styles.addButton}
                    onClick={handleAddNew}
                >
                    + เพิ่มจุดจอดใหม่
                </button>
            </div>

            {/* Search box */}
            <div className={styles.searchBox}>
                <input
                    type="text"
                    placeholder="🔍 ค้นหาชื่อจุดจอด..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.input}
                />
            </div>

            {/* Form Modal/Popup */}
            {showForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>{editingId ? "แก้ไขจุดจอด" : "เพิ่มจุดจอดใหม่"}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>ชื่อจุดจอด:</label>
                                <input
                                    name="NAME"
                                    placeholder="ใส่ชื่อจุดจอด"
                                    value={form.NAME}
                                    onChange={handleChange}
                                    required
                                    className={styles.input}
                                />
                            </div>
                            <div className={styles.buttonGroup}>
                                <button type="submit" className={styles.submitButton}>
                                    {editingId ? "อัปเดต" : "เพิ่ม"}
                                </button>
                                <button
                                    type="button"
                                    className={styles.cancelButton}
                                    onClick={handleCancel}
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Station Cards */}
            <div className={styles.stationGrid}>
                {filteredStations.map((station, index) => (
                    <div key={station.ID} className={styles.stationCard}>
                        <div className={styles.stationNumber}>
                            {String(index + 1).padStart(2, '0')}
                        </div>
                        <div className={styles.stationName}>
                            {station.NAME}
                        </div>
                        <div className={styles.actionButtons}>
                            <button
                                className={styles.editBtn}
                                onClick={() => handleEdit(station)}
                            >
                                แก้ไข
                            </button>
                            <button
                                className={styles.deleteBtn}
                                onClick={() => handleDelete(station.ID)}
                            >
                                ลบ
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Stations;
