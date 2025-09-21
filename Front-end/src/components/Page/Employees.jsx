import Sidebar from '../Sidebar';
import axios from "axios";
import { FaSearch } from "react-icons/fa";
import { useEffect, useState } from "react";
import "./Employees.css";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]); // สำหรับ combobox
  const [positions, setPositions] = useState([]);     // สำหรับ combobox
  const [form, setForm] = useState({
    FNAME: "",
    LNAME: "",
    EMAIL: "",
    username: "",
    password: "",
    id_department: "",
    id_position: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // โหลดข้อมูลพนักงาน
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:3000/Employee");
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดข้อมูลพนักงานได้");
    }
  };

  // โหลดข้อมูลแผนกและตำแหน่ง
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("http://localhost:3000/DEPARTMENT");
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await axios.get("http://localhost:3000/POSITION"); 
      setPositions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchPositions();
  }, []);

  // อัปเดตฟอร์ม
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // เพิ่มหรือแก้ไขพนักงาน
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`http://localhost:3000/Employee/${editingId}`, form);
        alert("แก้ไขพนักงานเรียบร้อยแล้ว!");
      } else {
        await axios.post("http://localhost:3000/Employee", form);
        alert("เพิ่มพนักงานเรียบร้อยแล้ว!");
      }
      setForm({
        FNAME: "",
        LNAME: "",
        EMAIL: "",
        username: "",
        password: "",
        id_department: "",
        id_position: ""
      });
      setEditingId(null);
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  // กดแก้ไข
  const handleEdit = (emp) => {
    setForm({ ...emp });
    setEditingId(emp.ID);
    setShowModal(true);
  };

  // กดลบ
  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าต้องการลบพนักงานนี้?")) return;
    try {
      await axios.delete(`http://localhost:3000/Employee/${id}`);
      alert("ลบพนักงานเรียบร้อยแล้ว!");
      fetchEmployees();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบพนักงานได้");
    }
  };

  // filter ค้นหา (FNAME, LNAME, EMAIL, username)
  const filteredEmployees = employees.filter((emp) =>
    emp.FNAME.toLowerCase().includes(search.toLowerCase()) ||
    emp.LNAME.toLowerCase().includes(search.toLowerCase()) ||
    emp.EMAIL.toLowerCase().includes(search.toLowerCase()) ||
    emp.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="employees-wrapper">
      <Sidebar />
      <div className="employees-content">
        <h2>จัดการพนักงาน</h2>

        <button className="butn-add" onClick={() => setShowModal(true)}>
          เพิ่มพนักงาน
        </button>

        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหา ชื่อ, นามสกุล, Email, username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="employee-search"
          />
        </div>
        
        <table className="employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อ</th>
              <th>นามสกุล</th>
              <th>Email</th>
              <th>Username</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <tr key={emp.ID}>
                  <td>{emp.ID}</td>
                  <td>{emp.FNAME}</td>
                  <td>{emp.LNAME}</td>
                  <td>{emp.EMAIL}</td>
                  <td>{emp.username}</td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(emp)}>แก้ไข</button>
                    <button className="btn-delete" onClick={() => handleDelete(emp.ID)}>ลบ</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center" }}>ไม่พบข้อมูล</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{editingId ? "แก้ไขพนักงาน" : "เพิ่มพนักงานใหม่"}</h3>
            <form onSubmit={handleSubmit}>
              <input type="text" name="FNAME" className="FNAME" placeholder="ชื่อ" value={form.FNAME} onChange={handleChange} required />
              <input type="text" name="LNAME" className="LNAME" placeholder="นามสกุล" value={form.LNAME} onChange={handleChange} required />
              <input type="email" name="EMAIL" className="EMAIL" placeholder="Email" value={form.EMAIL} onChange={handleChange} required />
              <input type="text" name="username" className="username" placeholder="Username" value={form.username} onChange={handleChange} required />
              <input type="password" name="password" className="password" placeholder="Password" value={form.password} onChange={handleChange} required={!editingId} />

              {/* Combobox แผนก */}
              <select name="id_department" className="combo-dep" value={form.id_department} onChange={handleChange} required>
                <option value="">เลือกแผนก</option>
                {departments.map(dep => (
                  <option key={dep.ID} value={dep.ID}>{dep.NAME}</option>
                ))}
              </select>

              {/* Combobox ตำแหน่ง */}
              <select name="id_position"className="combo-pos" value={form.id_position} onChange={handleChange} required>
                <option value="">เลือกตำแหน่ง</option>
                {positions.map(pos => (
                  <option key={pos.ID} value={pos.ID}>{pos.NAME}</option>
                ))}
              </select>

              <div className="modal-actions">
                <button type="submit" className="btn-submit">{editingId ? "บันทึกการแก้ไข" : "เพิ่มพนักงาน"}</button>
                <button type="button"className="btn-cancel" onClick={() => {
                  setShowModal(false);
                  setForm({
                    FNAME: "",
                    LNAME: "",
                    EMAIL: "",
                    username: "",
                    password: "",
                    id_department: "",
                    id_position: ""
                  });
                  setEditingId(null);
                }}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Employees;
