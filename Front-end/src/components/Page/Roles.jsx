import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Roles.css";

function Positions() {
  const [positions, setPositions] = useState([]);
  const [form, setForm] = useState({
    NAME: "",
    MGMT_STATION: 0,
    MGMT_ROUTE: 0,
    MGMT_CAR: 0,
    MGMT_TRIP: 0,
    MGMT_PERMISSION: 0,
    MGMT_EMPLOYEE: 0,
    MGMT_DEPARTMENT: 0,
    VIEWREPORT: 0,
    PROFILE: 0,
    WORK_SCHEDULE: 0,
    ASSIGNMENT: 0,
    CURRENTJOB: 0,
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // โหลดข้อมูลตำแหน่งพร้อมสิทธิ์
  const fetchPositions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/POSITION");
      setPositions(res.data);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดข้อมูลตำแหน่งได้");
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  // อัปเดต form
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: checked ? 1 : 0 });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // เพิ่ม/แก้ไขตำแหน่ง
  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบชื่อซ้ำ
    const isDuplicate = positions.some(
      (pos) =>
        pos.NAME.toLowerCase() === form.NAME.toLowerCase() &&
        pos.ID !== editingId
    );
    if (isDuplicate) {
      alert("ชื่อตำแหน่งนี้มีอยู่แล้ว");
      return;
    }

    try {
      const permissions = {
        MGMT_STATION: form.MGMT_STATION,
        MGMT_ROUTE: form.MGMT_ROUTE,
        MGMT_CAR: form.MGMT_CAR,
        MGMT_TRIP: form.MGMT_TRIP,
        MGMT_PERMISSION: form.MGMT_PERMISSION,
        MGMT_EMPLOYEE: form.MGMT_EMPLOYEE,
        MGMT_DEPARTMENT: form.MGMT_DEPARTMENT,
        VIEWREPORT: form.VIEWREPORT,
        PROFILE: form.PROFILE,
        WORK_SCHEDULE: form.WORK_SCHEDULE,
        ASSIGNMENT: form.ASSIGNMENT,
        CURRENTJOB: form.CURRENTJOB,
      };

      if (editingId) {
        await axios.put(`http://localhost:3000/POSITION/${editingId}`, {
          NAME: form.NAME,
          permissions,
        });
        alert("แก้ไขตำแหน่งเรียบร้อยแล้ว!");
      } else {
        await axios.post("http://localhost:3000/POSITION", {
          NAME: form.NAME,
          permissions,
        });
        alert("เพิ่มตำแหน่งเรียบร้อยแล้ว!");
      }

      // Reset form and reload data
      setForm({
        NAME: "",
        MGMT_STATION: 0,
        MGMT_ROUTE: 0,
        MGMT_CAR: 0,
        MGMT_TRIP: 0,
        MGMT_PERMISSION: 0,
        MGMT_EMPLOYEE: 0,
        MGMT_DEPARTMENT: 0,
        VIEWREPORT: 0,
        PROFILE: 0,
        WORK_SCHEDULE: 0,
        ASSIGNMENT: 0,
        CURRENTJOB: 0,
      });
      setEditingId(null);
      setShowModal(false);
      fetchPositions();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  // แก้ไขตำแหน่ง
  const handleEdit = (pos) => {
    setForm({
      NAME: pos.NAME,
      MGMT_STATION: pos.MGMT_STATION,
      MGMT_ROUTE: pos.MGMT_ROUTE,
      MGMT_CAR: pos.MGMT_CAR,
      MGMT_TRIP: pos.MGMT_TRIP,
      MGMT_PERMISSION: pos.MGMT_PERMISSION,
      MGMT_EMPLOYEE: pos.MGMT_EMPLOYEE,
      MGMT_DEPARTMENT: pos.MGMT_DEPARTMENT,
      VIEWREPORT: pos.VIEWREPORT,
      PROFILE: pos.PROFILE,
      WORK_SCHEDULE: pos.WORK_SCHEDULE,
      ASSIGNMENT: pos.ASSIGNMENT,
      CURRENTJOB: pos.CURRENTJOB,
    });
    setEditingId(pos.ID);
    setShowModal(true);
  };

  // ลบตำแหน่ง
  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าต้องการลบตำแหน่งนี้?")) return;
    try {
      await axios.delete(`http://localhost:3000/POSITION/${id}`);
      alert("ลบตำแหน่งเรียบร้อยแล้ว!");
      fetchPositions();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบตำแหน่งได้");
    }
  };

  const filteredPositions = positions.filter(
    (pos) =>
      pos.ID.toString().toLowerCase().includes(search.toLowerCase()) ||
      pos.NAME.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="positions-wrapper">
      <Sidebar />
      <div className="positions-content">
        <h2>จัดการตำแหน่งและสิทธิ์</h2>
        <button className="butn-add" onClick={() => setShowModal(true)}>
          เพิ่มตำแหน่ง
        </button>
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหา ID หรือ ชื่อตำแหน่ง"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="positions-search"
          />
        </div>

        <div className="scroll">
          <table className="positions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ชื่อตำแหน่ง</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPositions.length > 0 ? (
                filteredPositions.map((pos) => (
                  <tr key={pos.ID}>
                    <td>{pos.ID}</td>
                    <td>{pos.NAME}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(pos)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(pos.ID)}
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center" }}>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal เพิ่ม/แก้ไข */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{editingId ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่งใหม่"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="NAME"
                placeholder="ชื่อตำแหน่ง"
                value={form.NAME}
                onChange={handleChange}
                required
              />

              <p>
                <b>จัดการสิทธิ์</b>
              </p>

              <div className="permissions-checkbox">
                {[
                  "MGMT_STATION",
                  "MGMT_ROUTE",
                  "MGMT_CAR",
                  "MGMT_TRIP",
                  "MGMT_PERMISSION",
                  "MGMT_EMPLOYEE",
                  "MGMT_DEPARTMENT",
                  "VIEWREPORT",
                  "PROFILE",
                  "WORK_SCHEDULE",
                  "ASSIGNMENT",
                  "CURRENTJOB",
                  "REPORTFORCEO"
                ].map((perm) => (
                  <label key={perm}>
                    <input
                      type="checkbox"
                      name={perm}
                      checked={form[perm] === 1}
                      onChange={handleChange}
                    />
                    {perm}
                  </label>
                ))}
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? "บันทึกการแก้ไข" : "เพิ่มตำแหน่ง"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setForm({
                      NAME: "",
                      MGMT_STATION: 0,
                      MGMT_ROUTE: 0,
                      MGMT_CAR: 0,
                      MGMT_TRIP: 0,
                      MGMT_PERMISSION: 0,
                      MGMT_EMPLOYEE: 0,
                      MGMT_DEPARTMENT: 0,
                      VIEWREPORT: 0,
                      PROFILE: 0,
                      WORK_SCHEDULE: 0,
                      ASSIGNMENT: 0,
                      CURRENTJOB: 0,
                      REPORTFORCEO:0,
                    });
                    setEditingId(null);
                  }}
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Positions;
