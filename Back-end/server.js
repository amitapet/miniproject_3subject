const express = require("express");
const oracledb = require("oracledb");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Load Thick mode
const clientLibDir =
  process.platform === "win32"
    ? "C:\\oracle_sv\\instantclient_23_9" // <-- เปลี่ยน path ของคุณ
    : "/opt/oracle/instantclient_11_2";

oracledb.initOracleClient({ libDir: clientLibDir });

// Oracle DB config
const dbConfig = {
  user: "DBT68031",
  password: "64812",
  connectString: `(DESCRIPTION=
    (ADDRESS=(PROTOCOL=TCP)(HOST=203.188.54.7)(PORT=1521))
    (CONNECT_DATA=(SID=Database))
  )`,
};

async function initOracle() {
  try {
    await oracledb.createPool(dbConfig);
    console.log("✅ Oracle DB connected");
  } catch (err) {
    console.error("❌ Oracle DB connection error:", err);
    process.exit(1);
  }
}

initOracle().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

// ส่วนของ API login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection();

    let result = await connection.execute(
      `SELECT e.ID,
          e.USERNAME,
          e.FNAME,
          e.LNAME,
          p.NAME AS POSITION_NAME,
          per.MGMT_STATION,
          per.MGMT_ROUTE,
          per.MGMT_CAR,
          per.MGMT_TRIP,
          per.MGMT_PERMISSION,
          per.MGMT_EMPLOYEE,
          per.MGMT_DEPARTMENT,
          per.VIEWREPORT,
          per.PROFILE,
          per.WORK_SCHEDULE,
          per.ASSIGNMENT,
          per.CURRENTJOB
   FROM EMPLOYEE e
   JOIN POSITION p ON e.ID_POSITION = p.ID
   JOIN PERMISSION per ON p.IDPERMISSION = per.ID
   WHERE e.USERNAME = :username AND e.PASSWORD = :password`,
      [username, password],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return res.json({
        success: true,
        role: "employee",
        message: "✅ Employee login success",
        user: {
          id: user.ID,
          username: user.USERNAME,
          name: user.FNAME + " " + user.LNAME,
          position: user.POSITION_NAME,
          permission: {
            MGMT_STATION: user.MGMT_STATION,
            MGMT_ROUTE: user.MGMT_ROUTE,
            MGMT_CAR: user.MGMT_CAR,
            MGMT_TRIP: user.MGMT_TRIP,
            MGMT_PERMISSION: user.MGMT_PERMISSION,
            MGMT_EMPLOYEE: user.MGMT_EMPLOYEE,
            MGMT_DEPARTMENT: user.MGMT_DEPARTMENT,
            VIEWREPORT: user.VIEWREPORT,
            PROFILE: user.PROFILE,
            WORK_SCHEDULE: user.WORK_SCHEDULE,
            ASSIGNMENT: user.ASSIGNMENT,
            CURRENTJOB: user.CURRENTJOB,
          },
        },
      });
    }

    result = await connection.execute(
      `SELECT ID, USERNAME ,FNAME, LNAME , TEL
       FROM CUSTOMER 
       WHERE USERNAME = :username AND USER_PASSWORD = :password`,
      [username, password],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      return res.json({
        success: true,
        role: "customer",
        message: "✅ Customer login success",
        user: {
          id: user.ID,
          username: user.USERNAME,
          name: user.FNAME + " " + user.LNAME,
          tel: user.TEL,
        },
      });
    }

    return res
      .status(401)
      .json({ success: false, message: "❌ Invalid username or password" });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ success: false, message: "DB Error" });
  } finally {
    if (connection) await connection.close();
  }
});
//สิ้นสุดส่วนของ API login


//ส่วนของ API แผนก
// ดึงข้อมูล DEPARTMENT
app.get("/DEPARTMENT", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`SELECT ID, NAME FROM DEPARTMENT`);
    const DEPARTMENT = result.rows.map((row) => ({ ID: row[0], NAME: row[1] }));
    res.json(DEPARTMENT);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  } finally {
    if (connection) await connection.close();
  }
});

// เพิ่ม DEPARTMENT
app.post("/DEPARTMENT", async (req, res) => {
  const { NAME } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`SELECT MAX(ID) FROM DEPARTMENT`);
    let newId = "001";
    if (result.rows[0][0]) {
      const lastId = result.rows[0][0];
      newId = (parseInt(lastId) + 1).toString().padStart(3, "0");
    }
    await connection.execute(
      `INSERT INTO DEPARTMENT (ID, NAME) VALUES (:ID, :NAME)`,
      { ID: newId, NAME },
      { autoCommit: true }
    );
    res.json({ message: "DEPARTMENT inserted successfully!", ID: newId });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Insert Error");
  } finally {
    if (connection) await connection.close();
  }
});

// อัปเดต DEPARTMENT
app.put("/DEPARTMENT/:id", async (req, res) => {
  const { id } = req.params;
  const { NAME } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(
      `UPDATE DEPARTMENT SET NAME = :NAME WHERE ID = :ID`,
      { NAME, ID: id },
      { autoCommit: true }
    );
    res.json({ message: "Updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Update Error");
  } finally {
    if (connection) await connection.close();
  }
});

// ลบ DEPARTMENT
app.delete("/DEPARTMENT/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(`DELETE FROM DEPARTMENT WHERE ID = :ID`, { ID: id }, { autoCommit: true });
    res.json({ message: "Deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Delete Error");
  } finally {
    if (connection) await connection.close();
  }
});

//สิ้นสุดส่วนของ API แผนก
