import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Departments.css";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ NAME: "" });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false); // สำหรับเปิด/ปิด modal

  // โหลดข้อมูลแผนก
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:3000/DEPARTMENT");
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดข้อมูลแผนกได้");
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // อัปเดตฟอร์ม
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // เพิ่มหรือแก้ไขแผนก
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:3000/DEPARTMENT/${editingId}`, { NAME: form.NAME });
        alert("แก้ไขแผนกเรียบร้อยแล้ว!");
      } else {
        await axios.post("http://localhost:3000/DEPARTMENT", { NAME: form.NAME });
        alert("เพิ่มแผนกเรียบร้อยแล้ว!");
      }
      setForm({ NAME: "" });
      setEditingId(null);
      setShowModal(false); // ✅ ปิด modal หลังบันทึก
      fetchDepartments();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  // กดแก้ไข
  const handleEdit = (dep) => {
    setForm({ NAME: dep.NAME });
    setEditingId(dep.ID);
    setShowModal(true); // ✅ เปิด modal พร้อมข้อมูล
  };

  // กดลบ
  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าต้องการลบแผนกนี้?")) return;
    try {
      await axios.delete(`http://localhost:3000/DEPARTMENT/${id}`);
      alert("ลบแผนกเรียบร้อยแล้ว!");
      fetchDepartments();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบแผนกได้");
    }
  };

  // filter ค้นหา
  const filteredDepartments = departments.filter(
    (dep) =>
      dep.ID.toString().toLowerCase().includes(search.toLowerCase()) ||
      dep.NAME.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="departments-wrapper">
      <Sidebar />

      <div className="departments-content">
        <h2>จัดการแผนก</h2>

        {/* ปุ่มเพิ่ม */}
        <button className="btn-add" onClick={() => setShowModal(true)}>
           เพิ่มแผนก
        </button>

        {/* ช่องค้นหา */}
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหา ID หรือ ชื่อแผนก"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="department-search"
          />
        </div>

    

        {/* ตารางแผนก */}
        <table className="department-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อแผนก</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredDepartments.length > 0 ? (
              filteredDepartments.map((dep) => (
                <tr key={dep.ID}>
                  <td>{dep.ID}</td>
                  <td>{dep.NAME}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(dep)}>
                      แก้ไข
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(dep.ID)}>
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

      {/* Modal สำหรับเพิ่ม/แก้ไข */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{editingId ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}</h3>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="NAME"
                placeholder="ชื่อแผนก"
                value={form.NAME}
                onChange={handleChange}
                required
                className="input-name"
              />
              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? "บันทึกการแก้ไข" : "เพิ่มแผนก"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ NAME: "" });
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

export default Departments;
