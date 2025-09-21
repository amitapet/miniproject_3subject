import { useEffect, useState } from "react";

import '../Sidebar.css';
import Sidebar from '../Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';

function Carroutes() {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [routeId, setRouteId] = useState("");
    const [routeName, setRouteName] = useState("");
    const [selectedStations, setSelectedStations] = useState([]);
    const [totalTime, setTotalTime] = useState(0);

    // ดึงสถานีจาก backend พร้อม error handling
    useEffect(() => {
        const fetchStations = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch("http://localhost:3000/stations");

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                console.log("Fetched stations:", data); // Debug log

                // ตรวจสอบว่าข้อมูลเป็น array หรือไม่
                if (Array.isArray(data)) {
                    setStations(data);
                } else if (data && Array.isArray(data.stations)) {
                    setStations(data.stations);
                } else {
                    console.warn("Invalid data format:", data);
                    setStations([]);
                }
            } catch (err) {
                console.error("Error fetching stations:", err);
                setError(`ไม่สามารถดึงข้อมูลสถานีได้: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchStations();
    }, []);

    // เพิ่มสถานีลงในเส้นทาง
    const addStation = () => {
        setSelectedStations([...selectedStations, { stationId: "", duration: 0 }]);
    };

    // ลบสถานีออกจากเส้นทาง
    const removeStation = (index) => {
        const updated = selectedStations.filter((_, i) => i !== index);
        setSelectedStations(updated);

        // คำนวณเวลารวมใหม่
        const sum = updated.reduce((acc, s) => acc + Number(s.duration || 0), 0);
        setTotalTime(sum);
    };

    // เปลี่ยนค่า station/duration
    const updateStation = (index, field, value) => {
        const updated = [...selectedStations];
        updated[index][field] = value;
        setSelectedStations(updated);

        // คำนวณเวลารวม
        const sum = updated.reduce((acc, s) => acc + Number(s.duration || 0), 0);
        setTotalTime(sum);
    };

    // บันทึกเส้นทางไป DB
    const saveRoute = async () => {
        // Validation
        if (!routeId.trim()) {
            alert("กรุณาระบุรหัสเส้นทาง");
            return;
        }

        if (!routeName.trim()) {
            alert("กรุณาระบุชื่อเส้นทาง");
            return;
        }

        if (selectedStations.length === 0) {
            alert("กรุณาเพิ่มจุดจอดอย่างน้อย 1 จุด");
            return;
        }

        // ตรวจสอบว่าทุกจุดจอดได้เลือกสถานีแล้ว
        const invalidStations = selectedStations.some(s => !s.stationId);
        if (invalidStations) {
            alert("กรุณาเลือกสถานีสำหรับทุกจุดจอด");
            return;
        }

        try {
            const response = await fetch("http://localhost:3000/carroutes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: routeId,
                    nameRoute: routeName,
                    stations: selectedStations,
                    totalTime,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            alert("บันทึกเส้นทางสำเร็จ");

            // รีเซ็ตฟอร์ม
            setRouteId("");
            setRouteName("");
            setSelectedStations([]);
            setTotalTime(0);

        } catch (err) {
            console.error("Error saving route:", err);
            alert(`เกิดข้อผิดพลาดในการบันทึก: ${err.message}`);
        }
    };

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 bg-gray-100 p-6">
                <div className="bg-white shadow rounded p-6 max-w-4xl">
                    <h1 className="text-xl font-bold mb-4">เพิ่มจัดการเส้นทางรถ</h1>

                    {/* แสดง error */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}



                    {/* ฟอร์ม */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="รหัสเส้นทาง"
                            value={routeId}
                            onChange={(e) => setRouteId(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                            type="text"
                            placeholder="ชื่อเส้นทาง"
                            value={routeName}
                            onChange={(e) => setRouteName(e.target.value)}
                            className="w-full border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* รายการจุดจอด */}
                        <div className="border border-gray-300 p-4 rounded bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                                <span className="font-medium">รายการจุดจอด</span>
                                <button
                                    onClick={addStation}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors"
                                >
                                    + เพิ่มจุดจอด
                                </button>
                            </div>

                            {selectedStations.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">
                                    ยังไม่มีจุดจอด กดปุ่ม "+ เพิ่มจุดจอด" เพื่อเริ่มต้น
                                </p>
                            ) : (
                                selectedStations.map((s, i) => (
                                    <div key={i} className="flex gap-2 mb-3 items-center">
                                        <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                            {i + 1}
                                        </div>
                                        <select
                                            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={s.stationId}
                                            onChange={(e) =>
                                                updateStation(i, "stationId", e.target.value)
                                            }
                                        >
                                            <option value="">เลือกสถานี</option>
                                            {stations.map((station) => (
                                                <option key={station.id} value={station.id}>
                                                    {station.name || station.NAME || `สถานี ${station.id}`}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            placeholder="นาที"
                                            min="0"
                                            value={s.duration}
                                            onChange={(e) =>
                                                updateStation(i, "duration", e.target.value)
                                            }
                                            className="w-20 border border-gray-300 rounded px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => removeStation(i)}
                                            className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded transition-colors"
                                            title="ลบจุดจอดนี้"
                                        >
                                            ×ลบจุด×
                                        </button>
                                    </div>
                                ))
                            )}

                            <div className="mt-3 p-2 bg-blue-50 rounded">
                                <p className="text-sm text-gray-700 font-medium">
                                    เวลารวม: {totalTime} นาที
                                </p>
                            </div>
                        </div>

                        {/* ปุ่มบันทึก */}
                        <button
                            onClick={saveRoute}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded transition-colors"
                        >
                            {loading ? "กำลังบันทึก..." : "บันทึกเส้นทาง"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Carroutes;