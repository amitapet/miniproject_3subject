const express = require("express");
const oracledb = require("oracledb");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ========================Load Thick mode============================
const clientLibDir =
  process.platform === "win32"
    ? "C:\\oracle_sv\\instantclient_23_9" // <-- เปลี่ยน path ของคุณ
    : "/opt/oracle/instantclient_11_2";

oracledb.initOracleClient({ libDir: clientLibDir });

// ========================Oracle DB config===========================
const dbConfig = {
  user: "DBT68031",
  password: "64812",
  connectString: `(DESCRIPTION=
    (ADDRESS=(PROTOCOL=TCP)(HOST=203.188.54.7)(PORT=1521))
    (CONNECT_DATA=(SID=Database3))
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

// =================================ส่วนของ API login==================================
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
          e.EMAIL,
          d.NAME AS DEPARTMENT_NAME,
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
   join DEPARTMENT d on e.ID_DEPARTMENT = d.id 
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
          email: user.EMAIL,
          department: user.DEPARTMENT_NAME,
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

//=============================ส่วนของ API ข้อมูลสถานี=====================================

app.get("/stations", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT ID, NAME FROM STATION ORDER BY ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log("Query result:", result.rows); // Debug log
    res.json(result.rows);
  } catch (err) {
    console.error("GET /stations error:", err);
    res
      .status(500)
      .json({ error: "Database query failed", details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Connection close error:", err);
      }
    }
  }
});

//  Create stations with auto ID
app.post("/stations", async (req, res) => {
  const { NAME } = req.body;

  if (!NAME || NAME.trim() === "") {
    return res.status(400).json({ error: "Station name is required" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection();

    // 1. Find max current station ID
    const maxResult = await connection.execute(
      `SELECT NVL(MAX(ID), 0) as MAX_ID FROM STATION`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const newId = (maxResult.rows[0].MAX_ID || 0) + 1;
    console.log("New ID will be:", newId); // Debug log

    // 2. Insert station
    const insertResult = await connection.execute(
      `INSERT INTO STATION (ID, NAME) VALUES (:ID, :NAME)`,
      { ID: newId, NAME: NAME.trim() },
      { autoCommit: true }
    );

    console.log("Insert result:", insertResult); // Debug log

    res.json({
      message: "Station inserted successfully!",
      ID: newId,
      NAME: NAME.trim(),
    });
  } catch (err) {
    console.error("POST /stations error:", err);
    res.status(500).json({
      error: "Database insert failed",
      details: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Connection close error:", err);
      }
    }
  }
});

//  Update station
app.put("/stations/:id", async (req, res) => {
  const { id } = req.params;
  const { NAME } = req.body;

  if (!NAME || NAME.trim() === "") {
    return res.status(400).json({ error: "Station name is required" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `UPDATE STATION SET NAME = :NAME WHERE ID = :id`,
      { NAME: NAME.trim(), id: parseInt(id) },
      { autoCommit: true }
    );

    console.log("Update result:", result); // Debug log

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Station not found" });
    }

    res.json({ message: "Station updated successfully!" });
  } catch (err) {
    console.error("PUT /stations/:id error:", err);
    res.status(500).json({
      error: "Database update failed",
      details: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Connection close error:", err);
      }
    }
  }
});

//  Delete station
app.delete("/stations/:id", async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `DELETE FROM STATION WHERE ID = :id`,
      { id: parseInt(id) },
      { autoCommit: true }
    );

    console.log("Delete result:", result); // Debug log

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Station not found" });
    }

    res.json({ message: "Station deleted successfully!" });
  } catch (err) {
    console.error("DELETE /stations/:id error:", err);
    res.status(500).json({
      error: "Database delete failed",
      details: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Connection close error:", err);
      }
    }
  }
});

//=============================ส่วนของ API ตำแหน่งกับสิทธิ=====================================
// ดึงข้อมูล POSITION พร้อม PERMISSION
app.get("/POSITION", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT p.ID, 
              p.NAME, 
              per.ID AS PERMISSION_ID,
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
       FROM POSITION p
       LEFT JOIN PERMISSION per 
         ON p.IDPERMISSION = per.ID`
    );

    const POSITION = result.rows.map((row) => ({
      ID: row[0],
      NAME: row[1],
      PERMISSION_ID: row[2],
      MGMT_STATION: row[3],
      MGMT_ROUTE: row[4],
      MGMT_CAR: row[5],
      MGMT_TRIP: row[6],
      MGMT_PERMISSION: row[7],
      MGMT_EMPLOYEE: row[8],
      MGMT_DEPARTMENT: row[9],
      VIEWREPORT: row[10],
      PROFILE: row[11],
      WORK_SCHEDULE: row[12],
      ASSIGNMENT: row[13],
      CURRENTJOB: row[14],
    }));

    res.json(POSITION);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  } finally {
    if (connection) await connection.close();
  }
});

// เพิ่ม POSITION (สร้าง PERMISSION ไปพร้อมกัน)
app.post("/POSITION", async (req, res) => {
  const { NAME, permissions } = req.body;

  let connection;
  try {
    connection = await oracledb.getConnection();

    // หา id ใหม่สำหรับ PERMISSION
    const resultPer = await connection.execute(
      `SELECT MAX(ID) FROM PERMISSION`
    );
    let newPerId = "001";
    if (resultPer.rows[0][0]) {
      newPerId = (parseInt(resultPer.rows[0][0]) + 1)
        .toString()
        .padStart(3, "0");
    }

    // Insert PERMISSION
    await connection.execute(
      `INSERT INTO PERMISSION 
        (ID, MGMT_STATION, MGMT_ROUTE, MGMT_CAR, MGMT_TRIP, MGMT_PERMISSION, 
         MGMT_EMPLOYEE, MGMT_DEPARTMENT, VIEWREPORT, PROFILE, 
         WORK_SCHEDULE, ASSIGNMENT, CURRENTJOB)
       VALUES 
        (:ID, :MGMT_STATION, :MGMT_ROUTE, :MGMT_CAR, :MGMT_TRIP, :MGMT_PERMISSION, 
         :MGMT_EMPLOYEE, :MGMT_DEPARTMENT, :VIEWREPORT, :PROFILE, 
         :WORK_SCHEDULE, :ASSIGNMENT, :CURRENTJOB)`,
      {
        ID: newPerId,
        ...permissions,
      }
    );
    await connection.commit();

    // หา id ใหม่สำหรับ POSITION
    const resultPos = await connection.execute(`SELECT MAX(ID) FROM POSITION`);
    let newPosId = "001";
    if (resultPos.rows[0][0]) {
      newPosId = (parseInt(resultPos.rows[0][0]) + 1)
        .toString()
        .padStart(3, "0");
    }

    // Insert POSITION พร้อมเชื่อมกับ PERMISSION
    await connection.execute(
      `INSERT INTO POSITION (ID, NAME, IDPERMISSION) VALUES (:ID, :NAME, :IDPERMISSION)`,
      { ID: newPosId, NAME, IDPERMISSION: newPerId },
      { autoCommit: true }
    );

    res.json({
      message: "POSITION inserted successfully!",
      ID: newPosId,
      PERMISSION_ID: newPerId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Insert Error");
  } finally {
    if (connection) await connection.close();
  }
});

// อัปเดต POSITION พร้อม PERMISSION
app.put("/POSITION/:id", async (req, res) => {
  const { id } = req.params;
  const { NAME, permissions } = req.body; // permissions = object ของสิทธิ
  let connection;

  try {
    connection = await oracledb.getConnection();

    // อัปเดต POSITION
    await connection.execute(
      `UPDATE POSITION SET NAME = :NAME WHERE ID = :ID`,
      { NAME, ID: id }
    );

    // อัปเดต PERMISSION ของตำแหน่งนี้
    const result = await connection.execute(
      `SELECT IDPERMISSION FROM POSITION WHERE ID = :ID`,
      { ID: id }
    );
    const permissionId = result.rows[0] ? result.rows[0][0] : null;

    if (permissionId && permissions) {
      await connection.execute(
        `UPDATE PERMISSION SET 
          MGMT_STATION = :MGMT_STATION,
          MGMT_ROUTE = :MGMT_ROUTE,
          MGMT_CAR = :MGMT_CAR,
          MGMT_TRIP = :MGMT_TRIP,
          MGMT_PERMISSION = :MGMT_PERMISSION,
          MGMT_EMPLOYEE = :MGMT_EMPLOYEE,
          MGMT_DEPARTMENT = :MGMT_DEPARTMENT,
          VIEWREPORT = :VIEWREPORT,
          PROFILE = :PROFILE,
          WORK_SCHEDULE = :WORK_SCHEDULE,
          ASSIGNMENT = :ASSIGNMENT,
          CURRENTJOB = :CURRENTJOB,
          REPORTFORCEO = :REPORTFORCEO,
         WHERE ID = :ID`,
        { ID: permissionId, ...permissions }
      );
    }

    await connection.commit();
    res.json({ message: "POSITION and PERMISSION updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Update Error");
  } finally {
    if (connection) await connection.close();
  }
});

// ลบ POSITION พร้อมลบ PERMISSION
app.delete("/POSITION/:id", async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await oracledb.getConnection();

    // หา IDPERMISSION ของตำแหน่งที่จะลบ
    const result = await connection.execute(
      `SELECT IDPERMISSION FROM POSITION WHERE ID = :ID`,
      { ID: id }
    );
    const permissionId = result.rows[0] ? result.rows[0][0] : null;

    // ลบตำแหน่ง
    await connection.execute(`DELETE FROM POSITION WHERE ID = :ID`, { ID: id });

    // ลบสิทธิ์ถ้ามี
    if (permissionId) {
      await connection.execute(`DELETE FROM PERMISSION WHERE ID = :ID`, {
        ID: permissionId,
      });
    }

    await connection.commit();
    res.json({
      message: "POSITION and associated PERMISSION deleted successfully!",
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Delete Error");
  } finally {
    if (connection) await connection.close();
  }
});

//================================ส่วนของ API ตำแหน่งสำหรับพนักงาน======================================
app.get("/POSITION/simple", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`SELECT ID, NAME FROM POSITION`);
    const positions = result.rows.map((row) => ({
      ID: row[0],
      NAME: row[1],
    }));
    res.json(positions);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  } finally {
    if (connection) await connection.close();
  }
});

//================================ส่วนของ API แผนก================================================
// ดึงข้อมูล DEPARTMENT
app.get("/DEPARTMENT", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT ID,
       NAME FROM DEPARTMENT
       `
    );
    const DEPARTMENT = result.rows.map((row) => ({
      ID: row[0],
      NAME: row[1],
    }));
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
    await connection.execute(
      `DELETE FROM DEPARTMENT WHERE ID = :ID`,
      { ID: id },
      { autoCommit: true }
    );
    res.json({ message: "Deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Delete Error");
  } finally {
    if (connection) await connection.close();
  }
});

//=================================ส่วนของ API พนักงาน========================================
// ดึงข้อมูลพนักงาน
app.get("/Employee", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT 
        emp.ID, 
        emp.FNAME,
        emp.LNAME,
        emp.EMAIL,
        emp.username,
        emp.password,
        emp.id_department,
        emp.id_position,
        dep.NAME AS DEPARTMENT_NAME,
        pos.NAME AS POSITION_NAME
      FROM Employee emp
      LEFT JOIN Department dep ON emp.id_department = dep.ID
      LEFT JOIN Position pos ON emp.id_position = pos.ID
      ORDER BY TO_NUMBER(SUBSTR( emp.ID, 2))`
    );

    const Employee = result.rows.map((row) => ({
      ID: row[0],
      FNAME: row[1],
      LNAME: row[2],
      EMAIL: row[3],
      username: row[4],
      password: row[5],
      id_department: row[6],
      id_position: row[7],
      DEPARTMENT_NAME: row[8], // สำหรับตารางแสดงผล
      POSITION_NAME: row[9], // สำหรับตารางแสดงผล
      DEPARTMENT: row[8] ? { ID: row[6], NAME: row[8] } : null, // สำหรับ combobox
      POSITION: row[9] ? { ID: row[7], NAME: row[9] } : null, // สำหรับ combobox
    }));

    res.json(Employee);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  } finally {
    if (connection) await connection.close();
  }
});
// เพิ่มรหัสพนักงานอัตโนมัติ
app.post("/Employee", async (req, res) => {
  const {
    FNAME,
    LNAME,
    EMAIL,
    username,
    password,
    id_department,
    id_position,
  } = req.body;

  let connection;

  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`SELECT MAX(ID) FROM Employee`);
    let newId = "E0001";
    if (result.rows[0][0]) {
      const lastId = result.rows[0][0];
      const num = parseInt(lastId.replace("E", "")) + 1;
      newId = "E" + num.toString().padStart(4, "0");
    }

    // เพิ่ม Employee
    await connection.execute(
      `INSERT INTO Employee (
      ID,
      FNAME,
      LNAME,
      EMAIL,
      username,
      password,
      id_department,
      id_position) VALUES (
      :ID, 
      :FNAME, 
      :LNAME, 
      :EMAIL, 
      :username, 
      :password, 
      :id_department, 
      :id_position)`,
      {
        ID: newId,
        FNAME,
        LNAME,
        EMAIL,
        username,
        password,
        id_department,
        id_position,
      },
      { autoCommit: true }
    );
    res.json({ message: "Employee inserted successfully!", ID: newId });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Insert Error");
  } finally {
    if (connection) await connection.close();
  }
});

// อัปเดต Employee
app.put("/Employee/:id", async (req, res) => {
  const { id } = req.params;
  const {
    FNAME,
    LNAME,
    EMAIL,
    username,
    password,
    id_department,
    id_position,
  } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(
      `UPDATE Employee SET FNAME = :FNAME , 
      LNAME = :LNAME ,
      EMAIL = :EMAIL ,
      username = :username , 
      password = :password , 
      id_department = :id_department , 
      id_position = :id_position
      WHERE ID = :ID`,
      {
        FNAME,
        LNAME,
        EMAIL,
        username,
        password,
        id_department,
        id_position,
        ID: id,
      },
      { autoCommit: true }
    );
    res.json({ message: "Employee Updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Update Error");
  } finally {
    if (connection) await connection.close();
  }
});

// ลบ Employee
app.delete("/Employee/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection();
    await connection.execute(
      `DELETE FROM Employee WHERE ID = :ID`,
      { ID: id },
      { autoCommit: true }
    );
    res.json({ message: "Employee Deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Delete Error");
  } finally {
    if (connection) await connection.close();
  }
});

//==========================ส่วนของ API การจัดการเส้นทางรถ=========================================
// ดึงข้อมูลสถานี
app.get("/stations", async (req, res) => {
  let connection;
  try {
    console.log("Fetching stations...");
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID, NAME FROM STATION ORDER BY ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`Found ${result.rows.length} stations`);
    console.log("Stations:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /stations error:", err);
    res.status(500).json({
      error: "Database query failed",
      details: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Connection close error:", closeErr);
      }
    }
  }
});

// ดึงข้อมูลเส้นทางรถ
app.get("/carroutes", async (req, res) => {
  let connection;
  try {
    console.log("Fetching routes...");
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT ID, NAME_ROUTE, TOTALSUM_TIME FROM ROUTE ORDER BY ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`Found ${result.rows.length} routes`);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /carroutes error:", err);
    res.status(500).json({
      error: "Database query failed",
      details: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Connection close error:", closeErr);
      }
    }
  }
});

// เพิ่มเส้นทางรถ
app.post("/carroutes", async (req, res) => {
  console.log("POST /carroutes request received");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const { id, nameRoute, stations, totalTime } = req.body;

  // ตรวจสอบข้อมูล
  if (!nameRoute || nameRoute.trim() === "") {
    console.log("Validation failed: nameRoute is required");
    return res.status(400).json({ error: "Route name is required" });
  }

  if (!stations || !Array.isArray(stations) || stations.length === 0) {
    console.log("Validation failed: stations are required");
    return res.status(400).json({ error: "At least one station is required" });
  }

  let connection;
  try {
    console.log("Connecting to database...");
    connection = await oracledb.getConnection(dbConfig);
    console.log("Database connected");
    let routeId = id && id.trim() ? id.trim() : null;

    // Insert Route
    console.log("Inserting route...");
    const insertResult = await connection.execute(
      `INSERT INTO ROUTE (ID, NAME_ROUTE, TOTALSUM_TIME) 
      VALUES (:ID, :NAME_ROUTE, :TOTALSUM_TIME)`,
      {
        ID: routeId,
        NAME_ROUTE: nameRoute.trim(),
        TOTALSUM_TIME: totalTime || 0,
      }
    );
    console.log(
      `Route inserted successfully. Rows affected: ${insertResult.rowsAffected}`
    );

    // แทรก stations
    const binds = stations.map((s) => ({
      routeId: routeId,
      stopsId: s.stops_id,
      stationTime: s.station_time,
      seqNo: s.seq_no,
    }));
    console.log("Binds:", binds);

    const stationResult = await connection.executeMany(
      `INSERT INTO ROUTE_STATIONS (ID, ID_ROUTE, STOPS_ID, STATION_TIME, SEQ_NO)
   VALUES (route_stations_seq.NEXTVAL, :routeId, :stopsId, :stationTime, :seqNo)`,
      binds
    );

    console.log(
      `Stations inserted successfully. Rows affected: ${stationResult.rowsAffected}`
    );

    // Commit ทั้งหมด
    await connection.commit();

    res.json({
      message: "Route and stations created successfully!",
      routeId: routeId,
      stationCount: stations.length,
      totalTime: totalTime || 0,
    });
  } catch (err) {
    console.error("POST /carroutes error:", err);

    // ตรวจสอบ ID ซ้ำ
    if (err.message && err.message.includes("ORA-00001")) {
      return res.status(400).json({
        error: "Route ID already exists",
        details: `Route with ID '${id}' already exists. Please use a different ID.`,
      });
    }

    res.status(500).json({
      error: "Database insert failed",
      details: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("Database connection closed");
      } catch (closeErr) {
        console.error("Connection close error:", closeErr);
      }
    }
  }
});

// ดึงข้อมูลเส้นทางรถจาก ID
app.get("/carroutes/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log("Fetching routes for ID:", id);
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID, STOPS_ID, ID_ROUTE, STATION_TIME , SEQ_NO
       FROM ROUTE_STATIONS 
       WHERE ID_ROUTE = :id
       ORDER BY SEQ_NO`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`Found ${result.rows.length} ROUTE_STATIONS`);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /carroutes/:id error:", err);
    res.status(500).json({
      error: "Database query failed",
      details: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Connection close error:", closeErr);
      }
    }
  }
});

// ดึงข้อมูลจากตาราง route_stations โดย id
app.get("/route_stations/:id", async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    console.log("Fetching routes for ID:", id);
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT ID, ID_ROUTE , STOPS_ID, STATION_TIME , SEQ_NO
       FROM ROUTE_STATIONS 
       WHERE ID_ROUTE = : ID
       ORDER BY SEQ_NO`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`Found ${result.rows.length} ROUTE_STATIONS`);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /route_stations error:", err);
    res.status(500).json({
      error: "Database query failed",
      details: err.message,
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Connection close error:", closeErr);
      }
    }
  }
});

// แก้ไขเส้นทางรถ + stations
app.put("/carroutes/:id", async (req, res) => {
  const { id } = req.params;
  const { nameRoute, totalTime, stations } = req.body;

  if (!nameRoute || nameRoute.trim() === "") {
    return res.status(400).json({ error: "Route name is required" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // อัพเดต ROUTE
    const result = await connection.execute(
      `UPDATE ROUTE 
       SET NAME_ROUTE = :NAME_ROUTE, TOTALSUM_TIME = :TOTALSUM_TIME 
       WHERE ID = :id`,
      {
        NAME_ROUTE: nameRoute.trim(),
        TOTALSUM_TIME: totalTime || 0,
        id,
      }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    // ถ้ามี stations ใน body -> อัพเดตตารางลูก
    if (stations && Array.isArray(stations)) {
      // 1. ลบข้อมูลเก่า
      await connection.execute(
        `DELETE FROM ROUTE_STATIONS WHERE ID_ROUTE = :id`,
        { id }
      );

      // 2. แทรกข้อมูลใหม่
      if (stations.length > 0) {
        const binds = stations.map((s) => ({
          routeId: id,
          stopsId: s.stops_id,
          stationTime: s.station_time,
          seqNo: s.seq_no,
        }));

        await connection.executeMany(
          `INSERT INTO ROUTE_STATIONS (ID, ID_ROUTE, STOPS_ID, STATION_TIME, SEQ_NO)
           VALUES (route_stations_seq.NEXTVAL, :routeId, :stopsId, :stationTime, :seqNo)`,
          binds
        );
      }
    }

    await connection.commit();

    res.json({ message: "Route and stations updated successfully!" });
  } catch (err) {
    console.error("PUT /carroutes/:id error:", err);
    res
      .status(500)
      .json({ error: "Database update failed", details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Connection close error:", closeErr);
      }
    }
  }
});

// ลบเส้นทางรถ
app.delete("/carroutes/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM ROUTE WHERE ID = :id`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Route not found" });
    }
    res.json({ message: "Route deleted successfully!" });
  } catch (err) {
    console.error("DELETE /carroutes/:id error:", err);
    res
      .status(500)
      .json({ error: "Database delete failed", details: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Connection close error:", closeErr);
      }
    }
  }
});

// ====================================== API ประเภทรถ ==================================================
// ดึงข้อมูลประเภทรถทั้งหมด
app.get("/TYPE_CAR", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT * FROM TYPE_CAR ORDER BY ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// เพิ่มประเภทรถใหม่
app.post("/TYPE_CAR", async (req, res) => {
  const { NAME } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // หา id ใหม่ (ID ล่าสุด + 1)
    const maxResult = await connection.execute(
      `SELECT NVL(MAX(ID), 0) AS MAX_ID FROM TYPE_CAR`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const newId = Number(maxResult.rows[0].MAX_ID) + 1;
    await connection.execute(
      `INSERT INTO TYPE_CAR (ID, NAME) VALUES (:ID, :NAME)`,
      { ID: newId, NAME },
      { autoCommit: true }
    );
    res.json({
      message: "TYPE_CAR inserted successfully!",
      ID: newId,
      NAME,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ลบประเภทรถ
app.delete("/TYPE_CAR/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `DELETE FROM TYPE_CAR WHERE ID = :id`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "TYPE_CAR not found" });
    }
    res.json({ message: "TYPE_CAR deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ดึงรถทั้งหมด
app.get("/CARS", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT C.ID, C.SEAT, T.ID AS TYPE_ID, T.NAME AS TYPE_NAME
   FROM CAR C
   JOIN TYPE_CAR T ON C.ID_TYPECAR = T.ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// เพิ่มรถ
app.post("/CARS", async (req, res) => {
  const { ID, SEAT, ID_TYPECAR } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `INSERT INTO CAR (ID, SEAT, ID_TYPECAR) VALUES (:ID, :SEAT, :ID_TYPECAR)`,
      { ID, SEAT, ID_TYPECAR },
      { autoCommit: true }
    );
    res.json({ message: "CAR inserted successfully!", ID, SEAT, ID_TYPECAR });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// แก้ไขรถ
app.put("/CARS/:id", async (req, res) => {
  const { id } = req.params;
  const { SEAT, ID_TYPECAR } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `UPDATE CAR SET SEAT = :SEAT, ID_TYPECAR = :ID_TYPECAR WHERE ID = :id`,
      { SEAT, ID_TYPECAR, id },
      { autoCommit: true }
    );
    res.json({
      message: "CAR updated successfully!",
      id,
      SEAT,
      ID_TYPECAR,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ลบรถ
app.delete("/CARS/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(
      `DELETE FROM CAR WHERE ID = :id`,
      { id },
      { autoCommit: true }
    );
    res.json({ message: "CAR deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// =========================== ส่วนของ API TRIP =============================

// ---------- GET TRIP ทั้งหมด (คืน DATE_TRIP เป็น 'YYYY-MM-DD' string เพื่อเลี่ยง timezone) ----------
app.get("/TRIP", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT 
          t.ID AS TRIP_ID,
          TO_CHAR(t.DATE_TRIP,'YYYY-MM-DD') AS DATE_TRIP,
          t.TIMEOUT,
          c.ID AS CAR_ID, c.SEAT,
          tc.ID AS TYPECAR_ID, tc.NAME AS TYPECAR_NAME,
          e.ID AS EMPLOYEE_ID, e.FNAME || ' ' || e.LNAME AS EMPLOYEE_NAME,
          p.ID AS POSITION_ID, p.NAME AS POSITION_NAME,
          r.ID AS ROUTE_ID, r.NAME_ROUTE, r.TOTALSUM_TIME,
          s.ID AS STATION_ID, s.NAME AS STATION_NAME,
          rs.ID AS ROUTE_STATIONS_ID, rs.STATION_TIME, rs.SEQ_NO
       FROM TRIP t
        LEFT JOIN CAR c ON t.ID_CAR = c.ID
        LEFT JOIN TYPE_CAR tc ON c.ID_TYPECAR = tc.ID
        LEFT JOIN EMPLOYEE e ON t.ID_EMPLOYEE = e.ID
        LEFT JOIN POSITION p ON e.ID_POSITION = p.ID
        LEFT JOIN ROUTE r ON t.ID_ROUTE = r.ID
        LEFT JOIN ROUTE_STATIONS rs ON r.ID = rs.ID_ROUTE
        LEFT JOIN STATION s ON rs.STOPS_ID = s.ID
       ORDER BY t.ID, rs.SEQ_NO`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // Build JSON same as before (DATE_TRIP now is string 'YYYY-MM-DD')
    const trips = result.rows.reduce((acc, row) => {
      let trip = acc.find((t) => t.TRIP_ID === row.TRIP_ID);
      if (!trip) {
        trip = {
          TRIP_ID: row.TRIP_ID,
          DATE_TRIP: row.DATE_TRIP,
          TIMEOUT: row.TIMEOUT,
          CAR: row.CAR_ID
            ? {
                ID: row.CAR_ID,
                SEAT: row.SEAT,
                TYPE: row.TYPECAR_ID
                  ? { ID: row.TYPECAR_ID, NAME: row.TYPECAR_NAME }
                  : null,
              }
            : null,
          EMPLOYEE: row.EMPLOYEE_ID
            ? {
                ID: row.EMPLOYEE_ID,
                NAME: row.EMPLOYEE_NAME,
                POSITION: row.POSITION_ID
                  ? { ID: row.POSITION_ID, NAME: row.POSITION_NAME }
                  : null,
              }
            : null,
          ROUTE: row.ROUTE_ID
            ? {
                ID: row.ROUTE_ID,
                NAME: row.NAME_ROUTE,
                TOTALSUM_TIME: row.TOTALSUM_TIME,
                STATIONS: [],
              }
            : null,
        };
        acc.push(trip);
      }

      if (trip.ROUTE && row.ROUTE_STATIONS_ID) {
        trip.ROUTE.STATIONS.push({
          ROUTE_STATIONS_ID: row.ROUTE_STATIONS_ID,
          STATION_ID: row.STATION_ID,
          STATION_NAME: row.STATION_NAME,
          STATION_TIME: row.STATION_TIME,
          SEQ_NO: row.SEQ_NO,
        });
      }
      return acc;
    }, []);

    res.json(trips);
  } catch (err) {
    console.error("GET /TRIP error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ---------- GET TRIP by id ----------
app.get("/TRIP/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT ID,
              TO_CHAR(DATE_TRIP,'YYYY-MM-DD') AS DATE_TRIP,
              TIMEOUT, ID_CAR, ID_ROUTE, ID_EMPLOYEE
       FROM TRIP WHERE ID = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "TRIP not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("GET /TRIP/:id error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ---------- POST TRIP (ใช้ TO_DATE เพื่อรับ 'YYYY-MM-DD' string safely) ----------
app.post("/TRIP", async (req, res) => {
  const { DATE_TRIP, TIMEOUT, ID_CAR, ID_EMPLOYEE, ID_ROUTE } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `INSERT INTO TRIP (ID, DATE_TRIP, TIMEOUT, ID_CAR, ID_EMPLOYEE, ID_ROUTE)
       VALUES ((SELECT NVL(MAX(ID),0)+1 FROM TRIP), TO_DATE(:DATE_TRIP,'YYYY-MM-DD'), :TIMEOUT, :ID_CAR, :ID_EMPLOYEE, :ID_ROUTE)
       RETURNING ID INTO :ID`,
      {
        DATE_TRIP,
        TIMEOUT,
        ID_CAR,
        ID_EMPLOYEE,
        ID_ROUTE,
        ID: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      },
      { autoCommit: true }
    );
    res
      .status(201)
      .json({ message: "TRIP created", TRIP_ID: result.outBinds.ID[0] });
  } catch (err) {
    console.error("POST /TRIP error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ---------- PUT TRIP (แก้ไข) ----------
app.put("/TRIP/:id", async (req, res) => {
  const { id } = req.params;
  const { DATE_TRIP, TIMEOUT, ID_CAR, ID_EMPLOYEE, ID_ROUTE } = req.body;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `UPDATE TRIP SET DATE_TRIP = TO_DATE(:DATE_TRIP,'YYYY-MM-DD'),
                       TIMEOUT = :TIMEOUT,
                       ID_CAR = :ID_CAR,
                       ID_EMPLOYEE = :ID_EMPLOYEE,
                       ID_ROUTE = :ID_ROUTE
       WHERE ID = :ID`,
      { DATE_TRIP, TIMEOUT, ID_CAR, ID_EMPLOYEE, ID_ROUTE, ID: id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: "TRIP not found" });
    res.json({ message: "TRIP updated" });
  } catch (err) {
    console.error("PUT /TRIP/:id error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ----- DELETE TRIP -----
app.delete("/TRIP/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `DELETE FROM TRIP WHERE ID = :ID`,
      [Number(id)],
      { autoCommit: true }
    );
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "TRIP not found" });
    }
    res.json({ message: "TRIP deleted" });
  } catch (err) {
    console.error("DELETE /TRIP/:id error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

//=================================ส่วนของ API แสดงตารางสถานี======================================
// GET route_stations by route ID

app.get("/trip/route_stations/:id", async (req, res) => {
  let connection;
  try {
    const routeId = req.params.id;
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT 
          rs.ID AS ROUTE_STATIONS_ID,
          rs.SEQ_NO,
          s.NAME AS STATION_NAME,
          rs.STATION_TIME
       FROM ROUTE_STATIONS rs
       JOIN STATION s ON rs.STOPS_ID = s.ID
       WHERE rs.ID_ROUTE = :routeId
       ORDER BY rs.SEQ_NO`,
      [routeId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching route stations" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Connection close error:", err);
      }
    }
  }
});

//=================================ส่วนของ API รายงาน1======================================
app.get("/report1", async (req, res) => {
  let connection;
  const { year, month } = req.query;

  try {
    connection = await oracledb.getConnection(dbConfig);

    let sql = `
      SELECT month_num, station_name,
             SUM(passenger_in)   AS PASSENGER_IN,
             SUM(passenger_out)  AS PASSENGER_OUT
      FROM (
        SELECT
          EXTRACT(MONTH FROM t.DATE_TRIP) AS month_num,
          s_in.name AS station_name,
          COUNT(*) AS passenger_in,
          0        AS passenger_out
        FROM RESERVE r
        JOIN TRIP t ON r.TRIP_ID = t.ID
        JOIN STATION s_in ON r.STARTT = s_in.ID
        WHERE 1=1
    `;

    const binds = {};

    //Filter ปี
    if (year) {
      let yearCE = parseInt(year);
      if (yearCE > 2500) {
        yearCE -= 543; // แปลง พ.ศ. → ค.ศ.
      }
      sql += ` AND EXTRACT(YEAR FROM t.DATE_TRIP) = :y `;
      binds.y = yearCE;
    }

    // Filter เดือน
    if (month) {
      sql += ` AND EXTRACT(MONTH FROM t.DATE_TRIP) = :m `;
      binds.m = parseInt(month);
    }

    sql += `
        GROUP BY EXTRACT(MONTH FROM t.DATE_TRIP), s_in.name
        UNION ALL
        SELECT
          EXTRACT(MONTH FROM t.DATE_TRIP) AS month_num,
          s_out.name AS station_name,
          0        AS passenger_in,
          COUNT(*) AS passenger_out
        FROM RESERVE r
        JOIN TRIP t ON r.TRIP_ID = t.ID
        JOIN STATION s_out ON r.STOPT = s_out.ID
        WHERE 1=1
    `;

    //เงื่อนไขปี (ขาลง)
    if (year) {
      sql += ` AND EXTRACT(YEAR FROM t.DATE_TRIP) = :y `;
    }

    //เงื่อนไขเดือน (ขาลง)
    if (month) {
      sql += ` AND EXTRACT(MONTH FROM t.DATE_TRIP) = :m `;
    }

    sql += `
        GROUP BY EXTRACT(MONTH FROM t.DATE_TRIP), s_out.name
      ) x
      GROUP BY month_num, station_name
      ORDER BY month_num, station_name
    `;

    const result = await connection.execute(sql, binds);

    // แปลงผลลัพธ์ให้อยู่ในรูปแบบที่ต้องการ
    const rows = result.rows.map((r) => ({
      MONTH: r[0], // เดือน (1–12)
      STATION_NAME: r[1], // ชื่อสถานี
      PASSENGER_IN: r[2], // จำนวนขึ้น
      PASSENGER_OUT: r[3], // จำนวนลง
    }));

    res.json(rows);
  } catch (err) {
    console.error("SQL Error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Close conn error:", err);
      }
    }
  }
});

// API report6
app.get("/report6", async (req, res) => {
  const { start, end } = req.query;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `
      SELECT 
        e.id AS EMPLOYEE_ID,
        e.fname || ' ' || e.lname AS EMPLOYEE_NAME,
        COUNT(sd.id) AS TOTAL,
        SUM(CASE WHEN TO_NUMBER(REGEXP_SUBSTR(sd.TIME_IN, '^[0-9]+(\.[0-9]+)?')) < 17 THEN 1 ELSE 0 END) AS BEFORE17,
        SUM(CASE WHEN TO_NUMBER(REGEXP_SUBSTR(sd.TIME_IN, '^[0-9]+(\.[0-9]+)?')) >= 17 THEN 1 ELSE 0 END) AS AFTER17
      FROM employee e
      JOIN work w ON w.EMP_ID = e.id AND w.STATUS = 'finished'
      JOIN trip t ON t.id = w.TRIP_ID
      JOIN stop_duration sd ON t.id = sd.id_trip
      WHERE t.date_trip BETWEEN TO_DATE(:startDate, 'YYYY-MM-DD') 
                AND TO_DATE(:endDate, 'YYYY-MM-DD')
      GROUP BY e.id, e.fname, e.lname
      ORDER BY TOTAL DESC
      `,
      { startDate: start, endDate: end },
      { outFormat: require("oracledb").OUT_FORMAT_OBJECT }
    );

    const rows = result.rows;
    if (rows.length > 0) {
      const grandTotal = {
        EMPLOYEE_ID: "",
        EMPLOYEE_NAME: "รวมทั้งหมด",
        TOTAL: rows.reduce((sum, r) => sum + (r.TOTAL || 0), 0),
        BEFORE17: rows.reduce((sum, r) => sum + (r.BEFORE17 || 0), 0),
        AFTER17: rows.reduce((sum, r) => sum + (r.AFTER17 || 0), 0),
      };
      rows.push(grandTotal);
    }
    res.json(rows);
  } catch (err) {
    console.error("Error in /report6:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Error closing connection:", err);
      }
    }
  }
});

// 404 handler
app.use((req, res) => {
  console.log(`404: ${req.method} ${req.url} not found`);
  res
    .status(404)
    .json({ error: `Endpoint ${req.method} ${req.url} not found` });
});
