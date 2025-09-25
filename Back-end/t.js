// server-merged.js
// รวมโค้ดจากทั้งสองไฟล์ ให้ทำงานร่วมกันได้โดยไม่มี route ซ้ำ และใช้ Oracle connection pool

const express = require("express");
const oracledb = require("oracledb");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ============Load Thick mode================ - ถ้าไม่มี instantclient ในเครื่องบาง environment อาจ throw
const clientLibDir =
  process.platform === "win32"
    ? "C:\\oracle_sv\\instantclient_23_9"// <-- เปลี่ยน path ของคุณ
    : "/opt/oracle/instantclient_11_2";

try {
  oracledb.initOracleClient({ libDir: clientLibDir });
  console.log("Oracle client init with:", clientLibDir);
} catch (err) {
  console.warn(
    "Oracle client init warning (may be fine in Thin mode or not needed):",
    err.message
  );
}

// ============Oracle DB config=============== (ใช้ .env เพื่อความปลอดภัยและให้ทุกเครื่องตั้งค่าได้)
const dbConfig = {
  user: "DBT68031",
  password: "64812",
  connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=203.188.54.7)(PORT=1521))(CONNECT_DATA=(SID=Database)))`,
};

// สร้าง pool
async function initOraclePool() {
  try {
    await oracledb.createPool({
      user: dbConfig.user,
      password: dbConfig.password,
      connectString: dbConfig.connectString,
      poolMin: 1,
      poolMax: 10,
      poolIncrement: 1,
    });
    console.log("✅ Oracle pool created");
  } catch (err) {
    console.error("❌ createPool error:", err);
    throw err;
  }
}

// helper
async function getConn() {
  return await oracledb.getConnection();
}

const EXEC_OPTS = { outFormat: oracledb.OUT_FORMAT_OBJECT };

// Start
initOraclePool()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("Failed to init DB pool, aborting:", err);
    process.exit(1);
  });

// =================================ส่วนของ API login==================================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let connection;
  try {
    connection = await getConn();

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
      EXEC_OPTS
    );

    if (result.rows && result.rows.length > 0) {
      const user = result.rows[0];
      return res.json({
        success: true,
        role: "employee",
        message: "✅ Employee login success",
        user: {
          id: user.ID,
          username: user.USERNAME,
          name: `${user.FNAME} ${user.LNAME}`,
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
      EXEC_OPTS
    );

    if (result.rows && result.rows.length > 0) {
      const user = result.rows[0];
      return res.json({
        success: true,
        role: "customer",
        message: "✅ Customer login success",
        user: {
          id: user.ID,
          username: user.USERNAME,
          name: `${user.FNAME} ${user.LNAME}`,
          tel: user.TEL,
        },
      });
    }

    return res
      .status(401)
      .json({ success: false, message: "❌ Invalid username or password" });
  } catch (err) {
    console.error("DB Error:", err);
    res
      .status(500)
      .json({ success: false, message: "DB Error", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

//=============================ส่วนของ API เพิ่ม ลบ แก้ไข ข้อมูลสถานี=====================================
app.get("/stations", async (req, res) => {
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `SELECT ID, NAME FROM STATION ORDER BY ID`,
      [],
      EXEC_OPTS
    );
    console.log("Query /stations rows:", result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.error("GET /stations error:", err);
    res
      .status(500)
      .json({ error: "Database query failed", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});
//  Create stations with auto ID
app.post("/stations", async (req, res) => {
  const { NAME } = req.body;
  if (!NAME || NAME.trim() === "")
    return res.status(400).json({ error: "Station name is required" });
  let connection;
  try {
    connection = await getConn();
    // 1. Find max current station ID
    const maxResult = await connection.execute(
      `SELECT NVL(MAX(ID), 0) AS MAX_ID FROM STATION`,
      [],
      EXEC_OPTS
    );
    const newId = (maxResult.rows[0].MAX_ID || 0) + 1;
    await connection.execute(
      `INSERT INTO STATION (ID, NAME) VALUES (:ID, :NAME)`,
      { ID: newId, NAME: NAME.trim() },
      { autoCommit: true }
    );
    res.json({
      message: "Station inserted successfully!",
      ID: newId,
      NAME: NAME.trim(),
    });
  } catch (err) {
    console.error("POST /stations error:", err);
    res
      .status(500)
      .json({ error: "Database insert failed", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.put("/stations/:id", async (req, res) => {
  const { id } = req.params;
  const { NAME } = req.body;
  if (!NAME || NAME.trim() === "")
    return res.status(400).json({ error: "Station name is required" });
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `UPDATE STATION SET NAME = :NAME WHERE ID = :id`,
      { NAME: NAME.trim(), id: parseInt(id) },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: "Station not found" });
    res.json({ message: "Station updated successfully!" });
  } catch (err) {
    console.error("PUT /stations/:id error:", err);
    res
      .status(500)
      .json({ error: "Database update failed", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.delete("/stations/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `DELETE FROM STATION WHERE ID = :id`,
      { id: parseInt(id) },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: "Station not found" });
    res.json({ message: "Station deleted successfully!" });
  } catch (err) {
    console.error("DELETE /stations/:id error:", err);
    res
      .status(500)
      .json({ error: "Database delete failed", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

//================================ส่วนของ API แผนก======================================
app.get("/DEPARTMENT", async (req, res) => {
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `SELECT ID, NAME FROM DEPARTMENT ORDER BY ID`,
      [],
      EXEC_OPTS
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.post("/DEPARTMENT", async (req, res) => {
  const { NAME } = req.body;
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `SELECT MAX(ID) AS MAX_ID FROM DEPARTMENT`,
      [],
      EXEC_OPTS
    );
    let newId = "001";
    if (result.rows[0] && result.rows[0].MAX_ID) {
      newId = (parseInt(result.rows[0].MAX_ID) + 1).toString().padStart(3, "0");
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
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.put("/DEPARTMENT/:id", async (req, res) => {
  const { id } = req.params;
  const { NAME } = req.body;
  let connection;
  try {
    connection = await getConn();
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
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.delete("/DEPARTMENT/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConn();
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
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

//=================================ส่วนของ API พนักงาน========================================
app.get("/Employee", async (req, res) => {
  let connection;
  try {
    connection = await getConn();
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
      ORDER BY emp.ID`,
      [],
      EXEC_OPTS
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

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
    connection = await getConn();
    const result = await connection.execute(
      `SELECT MAX(ID) AS MAX_ID FROM Employee`,
      [],
      EXEC_OPTS
    );
    let newId = "E0001";
    if (result.rows[0] && result.rows[0].MAX_ID) {
      const lastId = result.rows[0].MAX_ID;
      const num = parseInt(String(lastId).replace(/\D/g, "")) + 1;
      newId = "E" + num.toString().padStart(4, "0");
    }
    await connection.execute(
      `INSERT INTO Employee (
        ID, FNAME, LNAME, EMAIL, username, password, id_department, id_position
      ) VALUES (:ID, :FNAME, :LNAME, :EMAIL, :username, :password, :id_department, :id_position)`,
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
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

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
    connection = await getConn();
    await connection.execute(
      `UPDATE Employee SET FNAME = :FNAME , LNAME = :LNAME , EMAIL = :EMAIL , username = :username , password = :password , id_department = :id_department , id_position = :id_position WHERE ID = :ID`,
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
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.delete("/Employee/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConn();
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
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

// ---------------- POSITION (รวม permission) ----------------
app.get("/POSITION", async (req, res) => {
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `SELECT p.ID, p.NAME, p.IDPERMISSION,
              per.MGMT_STATION, per.MGMT_ROUTE, per.MGMT_CAR, per.MGMT_TRIP,
              per.MGMT_PERMISSION, per.MGMT_EMPLOYEE, per.MGMT_DEPARTMENT,
              per.VIEWREPORT, per.PROFILE, per.WORK_SCHEDULE, per.ASSIGNMENT, per.CURRENTJOB
       FROM POSITION p
       LEFT JOIN PERMISSION per ON p.IDPERMISSION = per.ID
       ORDER BY p.ID`,
      [],
      EXEC_OPTS
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /POSITION error:", err);
    res.status(500).send("DB Error");
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.post("/POSITION", async (req, res) => {
  const { NAME, permissions } = req.body;
  let connection;
  try {
    connection = await getConn();
    const permResult = await connection.execute(
      `SELECT MAX(ID) AS MAX_ID FROM PERMISSION`,
      [],
      EXEC_OPTS
    );
    let newPermId = "001";
    if (permResult.rows[0] && permResult.rows[0].MAX_ID)
      newPermId = (parseInt(permResult.rows[0].MAX_ID) + 1)
        .toString()
        .padStart(3, "0");

    await connection.execute(
      `INSERT INTO PERMISSION (ID, MGMT_STATION, MGMT_ROUTE, MGMT_CAR, MGMT_TRIP, MGMT_PERMISSION, MGMT_EMPLOYEE, MGMT_DEPARTMENT, VIEWREPORT, PROFILE, WORK_SCHEDULE, ASSIGNMENT, CURRENTJOB)
       VALUES (:ID, :MGMT_STATION, :MGMT_ROUTE, :MGMT_CAR, :MGMT_TRIP, :MGMT_PERMISSION, :MGMT_EMPLOYEE, :MGMT_DEPARTMENT, :VIEWREPORT, :PROFILE, :WORK_SCHEDULE, :ASSIGNMENT, :CURRENTJOB)`,
      {
        ID: newPermId,
        MGMT_STATION:
          permissions && permissions.MGMT_STATION
            ? permissions.MGMT_STATION
            : 0,
        MGMT_ROUTE:
          permissions && permissions.MGMT_ROUTE ? permissions.MGMT_ROUTE : 0,
        MGMT_CAR:
          permissions && permissions.MGMT_CAR ? permissions.MGMT_CAR : 0,
        MGMT_TRIP:
          permissions && permissions.MGMT_TRIP ? permissions.MGMT_TRIP : 0,
        MGMT_PERMISSION:
          permissions && permissions.MGMT_PERMISSION
            ? permissions.MGMT_PERMISSION
            : 0,
        MGMT_EMPLOYEE:
          permissions && permissions.MGMT_EMPLOYEE
            ? permissions.MGMT_EMPLOYEE
            : 0,
        MGMT_DEPARTMENT:
          permissions && permissions.MGMT_DEPARTMENT
            ? permissions.MGMT_DEPARTMENT
            : 0,
        VIEWREPORT:
          permissions && permissions.VIEWREPORT ? permissions.VIEWREPORT : 0,
        PROFILE: permissions && permissions.PROFILE ? permissions.PROFILE : 0,
        WORK_SCHEDULE:
          permissions && permissions.WORK_SCHEDULE
            ? permissions.WORK_SCHEDULE
            : 0,
        ASSIGNMENT:
          permissions && permissions.ASSIGNMENT ? permissions.ASSIGNMENT : 0,
        CURRENTJOB:
          permissions && permissions.CURRENTJOB ? permissions.CURRENTJOB : 0,
      },
      { autoCommit: false }
    );

    const posResult = await connection.execute(
      `SELECT MAX(ID) AS MAX_ID FROM POSITION`,
      [],
      EXEC_OPTS
    );
    let newPosId = "001";
    if (posResult.rows[0] && posResult.rows[0].MAX_ID)
      newPosId = (parseInt(posResult.rows[0].MAX_ID) + 1)
        .toString()
        .padStart(3, "0");

    await connection.execute(
      `INSERT INTO POSITION (ID, NAME, IDPERMISSION) VALUES (:ID, :NAME, :IDPERMISSION)`,
      { ID: newPosId, NAME, IDPERMISSION: newPermId },
      { autoCommit: false }
    );

    await connection.commit();
    res.json({
      message: "POSITION inserted successfully!",
      ID: newPosId,
      PERMISSION_ID: newPermId,
    });
  } catch (err) {
    console.error("POST /POSITION error:", err);
    if (connection)
      try {
        await connection.rollback();
      } catch (_) {}
    res.status(500).send("DB Insert Error");
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.put("/POSITION/:id", async (req, res) => {
  const { id } = req.params;
  const { NAME, permissions } = req.body;
  let connection;
  try {
    connection = await getConn();
    const posResult = await connection.execute(
      `SELECT IDPERMISSION FROM POSITION WHERE ID = :ID`,
      { ID: id },
      EXEC_OPTS
    );
    if (!posResult.rows || posResult.rows.length === 0)
      return res.status(404).json({ error: "Position not found" });
    const permissionId = posResult.rows[0].IDPERMISSION;

    if (permissions && permissionId) {
      await connection.execute(
        `UPDATE PERMISSION SET MGMT_STATION = :MGMT_STATION, MGMT_ROUTE = :MGMT_ROUTE, MGMT_CAR = :MGMT_CAR, MGMT_TRIP = :MGMT_TRIP, MGMT_PERMISSION = :MGMT_PERMISSION, MGMT_EMPLOYEE = :MGMT_EMPLOYEE, MGMT_DEPARTMENT = :MGMT_DEPARTMENT, VIEWREPORT = :VIEWREPORT, PROFILE = :PROFILE, WORK_SCHEDULE = :WORK_SCHEDULE, ASSIGNMENT = :ASSIGNMENT, CURRENTJOB = :CURRENTJOB WHERE ID = :ID`,
        {
          MGMT_STATION: permissions.MGMT_STATION || 0,
          MGMT_ROUTE: permissions.MGMT_ROUTE || 0,
          MGMT_CAR: permissions.MGMT_CAR || 0,
          MGMT_TRIP: permissions.MGMT_TRIP || 0,
          MGMT_PERMISSION: permissions.MGMT_PERMISSION || 0,
          MGMT_EMPLOYEE: permissions.MGMT_EMPLOYEE || 0,
          MGMT_DEPARTMENT: permissions.MGMT_DEPARTMENT || 0,
          VIEWREPORT: permissions.VIEWREPORT || 0,
          PROFILE: permissions.PROFILE || 0,
          WORK_SCHEDULE: permissions.WORK_SCHEDULE || 0,
          ASSIGNMENT: permissions.ASSIGNMENT || 0,
          CURRENTJOB: permissions.CURRENTJOB || 0,
          ID: permissionId,
        },
        { autoCommit: false }
      );
    }

    await connection.execute(
      `UPDATE POSITION SET NAME = :NAME WHERE ID = :ID`,
      { NAME, ID: id },
      { autoCommit: false }
    );
    await connection.commit();
    res.json({ message: "Updated successfully!" });
  } catch (err) {
    console.error("PUT /POSITION error:", err);
    if (connection)
      try {
        await connection.rollback();
      } catch (_) {}
    res.status(500).send("DB Update Error");
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.delete("/POSITION/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConn();
    const posResult = await connection.execute(
      `SELECT IDPERMISSION FROM POSITION WHERE ID = :ID`,
      { ID: id },
      EXEC_OPTS
    );
    if (!posResult.rows || posResult.rows.length === 0)
      return res.status(404).json({ error: "Position not found" });
    const permissionId = posResult.rows[0].IDPERMISSION;
    await connection.execute(
      `DELETE FROM POSITION WHERE ID = :ID`,
      { ID: id },
      { autoCommit: false }
    );
    if (permissionId)
      await connection.execute(
        `DELETE FROM PERMISSION WHERE ID = :ID`,
        { ID: permissionId },
        { autoCommit: false }
      );
    await connection.commit();
    res.json({ message: "Deleted successfully!" });
  } catch (err) {
    console.error("DELETE /POSITION error:", err);
    if (connection)
      try {
        await connection.rollback();
      } catch (_) {}
    res.status(500).send("DB Delete Error");
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

// ---------------- PERMISSION ----------------
app.get("/PERMISSION", async (req, res) => {
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `SELECT * FROM PERMISSION WHERE ROWNUM = 1`,
      [],
      EXEC_OPTS
    );
    if (result.rows && result.rows.length > 0) return res.json(result.rows);
    res.json([
      {
        ID: "001",
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
      },
    ]);
  } catch (err) {
    console.error("GET /PERMISSION error:", err);
    res.status(500).send("DB Error");
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

// ---------------- Routes / TypeCar / Cars (จากโค้ด) ----------------
app.get("/carroutes", async (req, res) => {
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `SELECT ID, NAME_ROUTE, TOTALSUM_TIME FROM ROUTE ORDER BY ID`,
      [],
      EXEC_OPTS
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET /carroutes error:", err);
    res
      .status(500)
      .json({ error: "Database query failed", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.post("/carroutes", async (req, res) => {
  const { id, nameRoute, stations, totalTime } = req.body;
  if (
    !nameRoute ||
    !stations ||
    !Array.isArray(stations) ||
    stations.length === 0
  )
    return res.status(400).json({ error: "Route name and stations required" });
  let connection;
  try {
    connection = await getConn();
    let routeId = id && id.trim() ? id.trim() : null;
    if (!routeId) {
      const maxResult = await connection.execute(
        `SELECT NVL(MAX(TO_NUMBER(ID)), 0) AS MAX_ID FROM ROUTE`,
        [],
        EXEC_OPTS
      );
      routeId = String(maxResult.rows[0].MAX_ID + 1).padStart(3, "0");
    }
    await connection.execute(
      `INSERT INTO ROUTE (ID, NAME_ROUTE, TOTALSUM_TIME) VALUES (:ID, :NAME_ROUTE, :TOTALSUM_TIME)`,
      {
        ID: routeId,
        NAME_ROUTE: nameRoute.trim(),
        TOTALSUM_TIME: totalTime || 0,
      },
      { autoCommit: true }
    );
    res.json({
      message: "Route created successfully!",
      routeId,
      stationCount: stations.length,
      totalTime: totalTime || 0,
    });
  } catch (err) {
    console.error("POST /carroutes error:", err);
    if (err.message && err.message.includes("ORA-00001"))
      return res
        .status(400)
        .json({ error: "Route ID already exists", details: err.message });
    res
      .status(500)
      .json({ error: "Database insert failed", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.put("/carroutes/:id", async (req, res) => {
  const { id } = req.params;
  const { nameRoute, totalTime } = req.body;
  if (!nameRoute)
    return res.status(400).json({ error: "Route name is required" });
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `UPDATE ROUTE SET NAME_ROUTE = :NAME_ROUTE, TOTALSUM_TIME = :TOTALSUM_TIME WHERE ID = :id`,
      { NAME_ROUTE: nameRoute.trim(), TOTALSUM_TIME: totalTime || 0, id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: "Route not found" });
    res.json({ message: "Route updated successfully!" });
  } catch (err) {
    console.error("PUT /carroutes/:id error:", err);
    res
      .status(500)
      .json({ error: "Database update failed", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.delete("/carroutes/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `DELETE FROM ROUTE WHERE ID = :id`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: "Route not found" });
    res.json({ message: "Route deleted successfully!" });
  } catch (err) {
    console.error("DELETE /carroutes/:id error:", err);
    res
      .status(500)
      .json({ error: "Database delete failed", details: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.get("/TYPE_CAR", async (req, res) => {
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `SELECT * FROM TYPE_CAR ORDER BY ID`,
      [],
      EXEC_OPTS
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.post("/TYPE_CAR", async (req, res) => {
  const { NAME } = req.body;
  let connection;
  try {
    connection = await getConn();
    const maxResult = await connection.execute(
      `SELECT NVL(MAX(ID), 0) AS MAX_ID FROM TYPE_CAR`,
      [],
      EXEC_OPTS
    );
    const newId = Number(maxResult.rows[0].MAX_ID) + 1;
    await connection.execute(
      `INSERT INTO TYPE_CAR (ID, NAME) VALUES (:ID, :NAME)`,
      { ID: newId, NAME },
      { autoCommit: true }
    );
    res.json({ message: "TYPE_CAR inserted successfully!", ID: newId, NAME });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.delete("/TYPE_CAR/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `DELETE FROM TYPE_CAR WHERE ID = :id`,
      { id },
      { autoCommit: true }
    );
    if (result.rowsAffected === 0)
      return res.status(404).json({ error: "TYPE_CAR not found" });
    res.json({ message: "TYPE_CAR deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.get("/CARS", async (req, res) => {
  let connection;
  try {
    connection = await getConn();
    const result = await connection.execute(
      `SELECT C.ID, C.SEAT, T.ID AS TYPE_ID, T.NAME AS TYPE_NAME FROM CAR C JOIN TYPE_CAR T ON C.ID_TYPECAR = T.ID`,
      [],
      EXEC_OPTS
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.post("/CARS", async (req, res) => {
  const { ID, SEAT, ID_TYPECAR } = req.body;
  let connection;
  try {
    connection = await getConn();
    await connection.execute(
      `INSERT INTO CAR (ID, SEAT, ID_TYPECAR) VALUES (:ID, :SEAT, :ID_TYPECAR)`,
      { ID, SEAT, ID_TYPECAR },
      { autoCommit: true }
    );
    res.json({ message: "CAR inserted successfully!", ID, SEAT, ID_TYPECAR });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.put("/CARS/:id", async (req, res) => {
  const { id } = req.params;
  const { SEAT, ID_TYPECAR } = req.body;
  let connection;
  try {
    connection = await getConn();
    await connection.execute(
      `UPDATE CAR SET SEAT = :SEAT, ID_TYPECAR = :ID_TYPECAR WHERE ID = :id`,
      { SEAT, ID_TYPECAR, id },
      { autoCommit: true }
    );
    res.json({ message: "CAR updated successfully!", id, SEAT, ID_TYPECAR });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

app.delete("/CARS/:id", async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await getConn();
    await connection.execute(
      `DELETE FROM CAR WHERE ID = :id`,
      { id },
      { autoCommit: true }
    );
    res.json({ message: "CAR deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection)
      try {
        await connection.close();
      } catch (_) {}
  }
});

// ---------------- Generic error + 404 handlers ----------------
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`);
  res
    .status(404)
    .json({ error: `Endpoint ${req.method} ${req.url} not found` });
});

// Export for tests or external mounting
module.exports = app;
