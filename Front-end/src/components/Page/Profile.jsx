import Sidebar from "../Sidebar";
import "./Profile.css";
function Profile() {
  const user = JSON.parse(localStorage.getItem("user"));
  const username = user?.name || {};
  const useremail = user?.email || {};
  const userdep = user?.department || {};
  const userpos = user?.position || {};
  return (
    <>
      <Sidebar />
      <title>โปรไฟล์</title>
      <div className="wrapper">
        <p>ชื่อ-นามสกุล : {username}</p>
        <p>อีเมล : {useremail}</p>
        <p>ตำแหน่ง : {userdep}</p>
        <p>แผนก : {userpos}</p>
      </div>
    </>
  );
}
export default Profile;
