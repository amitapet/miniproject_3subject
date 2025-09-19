import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // เก็บ token + user ลง localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        Swal.fire({
          title: "✅ ล็อกอินสำเร็จ",
          text: data.message || "ยินดีต้อนรับ!",
          icon: "success",
          confirmButtonText: "ตกลง",
        }).then(() => {
          // สมมุติว่า backend ส่ง role กลับมาพร้อม employee
          if (data.employee?.role === "employee") {
            navigate("/Sidebar"); // ไปหน้า Dashboard พนักงาน
          } else if (data.employee?.role === "customer") {
            navigate("/Sidebar"); // ไปหน้า Dashboard ลูกค้า
          } else {
            navigate("/Sidebar"); // ค่า default
          }
        });
      } else {
        Swal.fire({
          title: "❌ ล็อกอินล้มเหลว",
          text: data.message || "Invalid username or password",
          icon: "error",
          confirmButtonText: "ลองอีกครั้ง",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "⚠️ เกิดข้อผิดพลาด",
        text: error.message,
        icon: "error",
        confirmButtonText: "ปิด",
      });
    }
  };

  return (
    <div className="login-container">
      <h2>ลงชื่อเข้าใช้</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
