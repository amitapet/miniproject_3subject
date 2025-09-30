import { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import axios from "axios";
import "./Schedules.css";

function Schedules() {
  const [trips, setTrips] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [form, setForm] = useState({
    DATE_TRIP: "",
    TIMEOUT: "",
    ID_CAR: "",
    ID_EMPLOYEE: "",
    ID_ROUTE: ""
  });
  const [cars, setCars] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchTrips();
    fetchCars();
    fetchEmployees();
    fetchRoutes();
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await axios.get("http://localhost:3000/TRIP");
      console.log("TRIP resp:", res.data);
      setTrips(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch TRIP error:", err.response?.data || err.message);
      alert("Fetch TRIP error - ดู console");
    }
  };

  const fetchCars = async () => {
    try {
      const res = await axios.get("http://localhost:3000/CARS");
      console.log("CARS resp:", res.data);
      setCars(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch CARS error:", err.response?.data || err.message);
      setCars([]);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:3000/Employee");
      console.log("EMP resp:", res.data);
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch EMP error:", err.response?.data || err.message);
      setEmployees([]);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await axios.get("http://localhost:3000/carroutes");
      console.log("ROUTES resp:", res.data);
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch ROUTES error:", err.response?.data || err.message);
      setRoutes([]);
    }
  };

  const openAddModal = () => {
    setEditingTrip(null);
    setForm({ DATE_TRIP: "", TIMEOUT: "", ID_CAR: "", ID_EMPLOYEE: "", ID_ROUTE: "" });
    setShowModal(true);
  };

  const openEditModal = (trip) => {
    setEditingTrip(trip);
    setForm({
      DATE_TRIP: trip.DATE_TRIP || "",
      TIMEOUT: trip.TIMEOUT || "",
      ID_CAR: trip.CAR?.ID || "",
      ID_EMPLOYEE: trip.EMPLOYEE?.ID || "",
      ID_ROUTE: trip.ROUTE?.ID || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("ยืนยันการลบ TRIP นี้?")) return;
    try {
      const res = await axios.delete(`http://localhost:3000/TRIP/${id}`);
      console.log("Delete resp:", res.data);
      fetchTrips();
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      alert("ลบไม่สำเร็จ ดู console");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // prepare payload types
    const payload = {
      DATE_TRIP: form.DATE_TRIP, // 'YYYY-MM-DD' string
      TIMEOUT: Number(form.TIMEOUT) || 0,
      ID_CAR: String(form.ID_CAR || ""),
      ID_EMPLOYEE: String(form.ID_EMPLOYEE || ""),
      ID_ROUTE: String(form.ID_ROUTE || "")
    };

    console.log("Submit payload:", payload);

    try {
      if (editingTrip) {
        const res = await axios.put(`http://localhost:3000/TRIP/${editingTrip.TRIP_ID}`, payload);
        console.log("PUT resp:", res.data);
      } else {
        const res = await axios.post("http://localhost:3000/TRIP", payload);
        console.log("POST resp:", res.data);
      }
      setShowModal(false);
      fetchTrips();
    } catch (err) {
      console.error("Submit error:", err.response?.data || err.message);
      alert("เกิดข้อผิดพลาด! ดู console");
    }
  };

  return (
    <>
      <Sidebar />
      <div className="employees-wrapper">
        <div className="employees-content">
          <h2>รอบเวลาเดินรถ</h2>
          <button className="butn-add" onClick={openAddModal}>เพิ่มรอบเวลา</button>

          <div className="scroll">
            <table className="employee-table">
              <thead>
                <tr>
                  <th>เส้นทาง</th>
                  <th>รถ</th>
                  <th>คนขับ</th>
                  <th>เวลาออก (นาฬิกา)</th>
                  <th>เวลาเดินทาง (นาที)</th> 
                  <th>วันที่</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trips.map(trip => (
                  <tr key={trip.TRIP_ID}>
                    <td>{trip.ROUTE?.NAME || "-"}</td>
                    <td>{trip.CAR ? `${trip.CAR.ID} - ${trip.CAR.TYPE?.NAME || ""}` : "-"}</td>
                    <td>{trip.EMPLOYEE?.NAME || "-"}</td>
                    <td>{trip.TIMEOUT}</td>
                    <td>{trip.ROUTE?.TOTALSUM_TIME || "-"}</td>
                    <td>{trip.DATE_TRIP || "-"}</td>
                    <td>
                      <button className="btn-edit" onClick={() => openEditModal(trip)}>แก้ไข</button>
                      <button className="btn-delete" onClick={() => handleDelete(trip.TRIP_ID)}>ลบ</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showModal && (
            <div className="modal-overlay">
              <div className="modal-box">
                <h3>{editingTrip ? "แก้ไขรอบเวลา" : "เพิ่มรอบเวลา"}</h3>
                <form onSubmit={handleSubmit}>
                  <label>วันที่</label>
                  <input type="date" value={form.DATE_TRIP} onChange={e => setForm({ ...form, DATE_TRIP: e.target.value })} required />

                  <label>เวลาออก</label>
                  <input type="number" value={form.TIMEOUT} onChange={e => setForm({ ...form, TIMEOUT: e.target.value })} required />

                  <label>รถ</label>
                  <select value={form.ID_CAR} onChange={e => setForm({ ...form, ID_CAR: e.target.value })} required>
                    <option value="">เลือก</option>
                    {cars.map(c => <option key={c.ID} value={c.ID}>{c.ID} {c.TYPE_NAME ? ` - ${c.TYPE_NAME}` : (c.TYPE?.NAME ? ` - ${c.TYPE.NAME}` : '')}</option>)}
                  </select>

                  <label>คนขับ</label>
                    <select
                      value={form.ID_EMPLOYEE}
                      onChange={e => setForm({ ...form, ID_EMPLOYEE: e.target.value })}
                      required
                    >
                      <option value="">เลือก</option>
                      {employees
                          .filter(emp => emp.POSITION?.NAME === "Driver")
                          .map(emp => (
                            <option key={emp.ID} value={emp.ID}>
                              {emp.FNAME} {emp.LNAME}
                            </option>
                          ))}
                    </select>

                  <label>เส้นทาง</label>
                  <select value={form.ID_ROUTE} onChange={e => setForm({ ...form, ID_ROUTE: e.target.value })} required>
                    <option value="">เลือก</option>
                    {routes.map(r => <option key={r.ID} value={r.ID}>{r.NAME_ROUTE}</option>)}
                  </select>
                  
                  
                      {/* ตารางสถานีของเส้นทางที่เลือก */}
                      {form.ID_ROUTE && (() => {
                        const selectedRoute = routes.find(r => r.ID === form.ID_ROUTE);
                        return (
                          <div className="route-stations">
                            <h4>จุดจอดในเส้นทาง</h4>
                            <table className="stations-table">
                              <thead>
                                <tr>
                                  <th>ลำดับ</th>
                                  <th>สถานี</th>
                                  <th>เวลาเดินทาง (นาที)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedRoute?.STATIONS?.map(st => (
                                  <tr key={st.ROUTE_STATIONS_ID}>
                                    <td>{st.SEQ_NO}</td>
                                    <td>{st.STATION_NAME}</td>
                                    <td>{st.STATION_TIME}</td>
                                  </tr>
                                )) || (
                                  <tr><td colSpan="3">ไม่มีข้อมูลสถานี</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}


                  <div className="modal-actions">
                    <button type="submit" className="btn-submit">บันทึก</button>
                    <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>ยกเลิก</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Schedules;
