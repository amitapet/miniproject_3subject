import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../Sidebar";
import { FaSearch } from "react-icons/fa";
import "./Cars.css";

function Cars() {
  const [cars, setCars] = useState([]);
  const [form, setForm] = useState({ LICENSE: "", TYPE: "", SEATS: "" });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [carTypes, setCarTypes] = useState([]);
  const [typeForm, setTypeForm] = useState({ NAME: "", SEAT: "" });

  const handleTypeFormChange = (e) => {
    setTypeForm({ ...typeForm, [e.target.name]: e.target.value });
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าต้องการลบประเภทรถนี้?")) return;
    try {
      await axios.delete(`http://localhost:3000/TYPE_CAR/${id}`);
      fetchCarTypes();
      alert("ลบประเภทรถเรียบร้อยแล้ว!");
    } catch (err) {
      alert("ไม่สามารถลบประเภทรถได้");
    }
  };

  const handleTypeFormSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/TYPE_CAR", {
        NAME: typeForm.NAME,
        SEAT: Number(typeForm.SEAT),
      });
      setTypeForm({ NAME: "", SEAT: "" });
      fetchCarTypes();
      alert("เพิ่มประเภทรถสำเร็จ");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเพิ่มประเภทรถ");
    }
  };

  const fetchCars = async () => {
    try {
      const res = await axios.get("http://localhost:3000/CARS");
      const mapped = res.data.map((car) => ({
        ID: car.ID,
        LICENSE: car.ID,
        TYPE: car.TYPE_NAME,
        SEATS: car.SEAT,
      }));
      setCars(mapped);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดข้อมูลรถได้");
    }
  };

  const fetchCarTypes = async () => {
    try {
      const res = await axios.get("http://localhost:3000/TYPE_CAR");
      setCarTypes(res.data);
    } catch (err) {
      setCarTypes([]);
    }
  };

  useEffect(() => {
    fetchCars();
    fetchCarTypes();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let payload;
    if (editingId) {
      payload = {
        SEAT: Number(form.SEATS),
        ID_TYPECAR: Number(form.TYPE),
      };
    } else {
      payload = {
        ID: form.LICENSE,
        SEAT: Number(form.SEATS),
        ID_TYPECAR: Number(form.TYPE),
      };
    }

    try {
      if (editingId) {
        await axios.put(`http://localhost:3000/CARS/${editingId}`, payload);
        alert("แก้ไขข้อมูลรถเรียบร้อยแล้ว!");
      } else {
        await axios.post("http://localhost:3000/CARS", payload);
        alert("เพิ่มรถเรียบร้อยแล้ว!");
      }
      setForm({ LICENSE: "", TYPE: "", SEATS: "" });
      setEditingId(null);
      setShowModal(false);
      fetchCars();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    }
  };

  const handleEdit = (car) => {
    let typeId =
      carTypes.find((t) => t.NAME === car.TYPE)?.ID || car.TYPE || "";
    setForm({
      LICENSE: car.LICENSE,
      TYPE: typeId,
      SEATS: car.SEATS,
    });
    setEditingId(car.ID);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าต้องการลบข้อมูลรถนี้?")) return;
    try {
      await axios.delete(`http://localhost:3000/CARS/${id}`);
      alert("ลบรถเรียบร้อยแล้ว!");
      fetchCars();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบรถได้");
    }
  };

  const filteredCars = cars.filter(
    (car) =>
      car.LICENSE.toLowerCase().includes(search.toLowerCase()) ||
      car.TYPE.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="cars-wrapper">
      <Sidebar />
      <div className="cars-content">
        <h2>จัดการรถ</h2>

        {/* ปุ่มเพิ่ม */}
        <button className="btn-add" onClick={() => setShowModal(true)}>
          เพิ่มรถ
        </button>

        {/* ช่องค้นหา */}
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="ทะเบียนรถ, ประเภทรถ"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="car-search"
          />
        </div>

        {/* ตารางรถ */}
        <table className="car-table">
          <thead>
            <tr>
              <th>ทะเบียนรถ</th>
              <th>ประเภทรถ</th>
              <th>จำนวนที่นั่ง</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCars.length > 0 ? (
              filteredCars.map((car) => (
                <tr key={car.ID}>
                  <td>{car.LICENSE}</td>
                  <td>{car.TYPE}</td>
                  <td>{car.SEATS}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleEdit(car)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(car.ID)}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  ไม่พบข้อมูล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>{editingId ? "แก้ไขข้อมูลรถ" : "เพิ่มประเภท"}</h3>

            {/* ฟอร์มเพิ่มประเภทรถ */}
            <form onSubmit={handleTypeFormSubmit} className="type-form-wrapper">
              <input
                type="text"
                name="NAME"
                placeholder="ชื่อประเภทรถ"
                value={typeForm.NAME}
                onChange={handleTypeFormChange}
                required
              />
              <button type="button" className="btn-submit">
                เพิ่ม
              </button>
            </form>

            {/* Dropdown ลบประเภทรถ */}
            <div className="delete-type-row">
              <select className="delete-type-dropdown" defaultValue="">
                <option value="" disabled>
                  เลือกประเภทรถเพื่อลบ
                </option>
                {carTypes.map((type) => (
                  <option key={type.ID} value={type.ID}>
                    {type.NAME}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-delete"
                onClick={() => {
                  const select = document.querySelector(
                    ".delete-type-dropdown"
                  );
                  const id = select.value;
                  if (id) handleDeleteType(id);
                }}
              >
                ลบ
              </button>
            </div>

            <h3>{editingId ? "" : "เพิ่มทะเบียนรถ"}</h3>
            {/* ฟอร์มหลักเพิ่ม/แก้ไขรถ */}
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="input-group">
                <input
                  type="text"
                  name="LICENSE"
                  placeholder="ทะเบียนรถ"
                  value={form.LICENSE}
                  onChange={handleChange}
                  required
                  readOnly={!!editingId}
                  className="input-license"
                />
                <input
                  type="number"
                  name="SEATS"
                  placeholder="จำนวนที่นั่ง"
                  value={form.SEATS}
                  onChange={handleChange}
                  required
                  min={1}
                  className="input-seats"
                />
                <select
                  name="TYPE"
                  value={form.TYPE}
                  onChange={handleChange}
                  required
                  className="input-type"
                >
                  <option value="">เลือกประเภทรถ</option>
                  {carTypes.map((type) => (
                    <option key={type.ID} value={type.ID}>
                      {type.NAME}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-submit">
                  {editingId ? "บันทึกการแก้ไข" : "บันทึก"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ LICENSE: "", TYPE: "", SEATS: "" });
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

export default Cars;
