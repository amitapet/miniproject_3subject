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

//ส่วนของ API เพิ่ม ลบ แก้ไข ข้อมูลสถานี

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
    res.status(500).json({ error: "Database query failed", details: err.message });
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

// 🔹 Create stations with auto ID
app.post("/stations", async (req, res) => {
  const { NAME } = req.body;

  if (!NAME || NAME.trim() === '') {
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
      NAME: NAME.trim()
    });

  } catch (err) {
    console.error("POST /stations error:", err);
    res.status(500).json({
      error: "Database insert failed",
      details: err.message
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

// 🔹 Update station
app.put("/stations/:id", async (req, res) => {
  const { id } = req.params;
  const { NAME } = req.body;

  if (!NAME || NAME.trim() === '') {
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
      details: err.message
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

// 🔹 Delete station
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
      details: err.message
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

//สิ้นสุดส่วนของ API เพิ่ม ลบ แก้ไข ข้อมูลสถานี






//ส่วนของ API แผนก
// ดึงข้อมูล DEPARTMENT
app.get("/DEPARTMENT", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT ID,
       NAME FROM DEPARTMENT
       `);
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

//ส่วนของ API พนักงาน
// ดึงข้อมูลพนักงาน
app.get("/Employee", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT 
      ID, 
      FNAME,
      LNAME,
      EMAIL,
      username,
      password,
      id_department,
      id_position FROM employee
      ORDER BY TO_NUMBER(SUBSTR(ID, 2))`
    );
    const Employee = result.rows.map((row) => ({ 
      ID: row[0], 
      FNAME: row[1], 
      LNAME: row[2], 
      EMAIL: row[3], 
      username: row[4],
      password: row[5], 
      id_department: row[6], 
      id_position: row[7] }));
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
      id_position } = req.body;

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
      { ID: newId, FNAME, LNAME, EMAIL, username, password, id_department, id_position },
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
      id_position } = req.body;
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
      { FNAME,LNAME,EMAIL,username,password,id_department,id_position, ID: id },
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
    await connection.execute(`DELETE FROM Employee WHERE ID = :ID`, { ID: id }, { autoCommit: true });
    res.json({ message: "Employee Deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Delete Error");
  } finally {
    if (connection) await connection.close();
  }
});

// ดึงข้อมูล POSITION
app.get("/POSITION", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(`SELECT ID, NAME,idpermission FROM POSITION`);
    const POSITION = result.rows.map((row) => ({ ID: row[0], NAME: row[1],idpermission: row[2] }));
    res.json(POSITION);
  } catch (err) {
    console.error(err);
    res.status(500).send("DB Error");
  } finally {
    if (connection) await connection.close();
  }
});



//ส่วนของ API การจัดการเส้นทางรถ

// GET stations
app.get("/stations", async (req, res) => {
  let connection;
  try {
    console.log("📝 Fetching stations...");
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT ID, NAME FROM STATION ORDER BY ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`✅ Found ${result.rows.length} stations`);
    console.log("Stations:", result.rows);
    res.json(result.rows);

  } catch (err) {
    console.error("❌ GET /stations error:", err);
    res.status(500).json({
      error: "Database query failed",
      details: err.message
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

// GET all routes
app.get("/carroutes", async (req, res) => {
  let connection;
  try {
    console.log("📝 Fetching routes...");
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT ID, NAME_ROUTE, TOTALSUM_TIME FROM ROUTE ORDER BY ID`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    console.log(`✅ Found ${result.rows.length} routes`);
    res.json(result.rows);

  } catch (err) {
    console.error("❌ GET /carroutes error:", err);
    res.status(500).json({
      error: "Database query failed",
      details: err.message
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

// CREATE new route
app.post("/carroutes", async (req, res) => {
  console.log("📝 POST /carroutes request received");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const { id, nameRoute, stations, totalTime } = req.body;

  // Validation
  if (!nameRoute || nameRoute.trim() === "") {
    console.log("❌ Validation failed: nameRoute is required");
    return res.status(400).json({ error: "Route name is required" });
  }

  if (!stations || !Array.isArray(stations) || stations.length === 0) {
    console.log("❌ Validation failed: stations are required");
    return res.status(400).json({ error: "At least one station is required" });
  }

  let connection;
  try {
    console.log("🔌 Connecting to database...");
    connection = await oracledb.getConnection(dbConfig);
    console.log("✅ Database connected");

    let routeId = id && id.trim() ? id.trim() : null;

    // Generate ID if not provided
    if (!routeId) {
      console.log("🔢 Generating new route ID...");
      const maxResult = await connection.execute(
        `SELECT NVL(MAX(TO_NUMBER(ID)), 0) AS MAX_ID FROM ROUTE`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      routeId = String(maxResult.rows[0].MAX_ID + 1).padStart(3, "0");
      console.log(`✅ Generated ID: ${routeId}`);
    }

    // Insert Route
    console.log("💾 Inserting route...");
    const insertResult = await connection.execute(
      `INSERT INTO ROUTE (ID, NAME_ROUTE, TOTALSUM_TIME) VALUES (:ID, :NAME_ROUTE, :TOTALSUM_TIME)`,
      {
        ID: routeId,
        NAME_ROUTE: nameRoute.trim(),
        TOTALSUM_TIME: totalTime || 0,
      },
      { autoCommit: true }
    );

    console.log(`✅ Route inserted successfully. Rows affected: ${insertResult.rowsAffected}`);

    res.json({
      message: "Route created successfully!",
      routeId: routeId,
      stationCount: stations.length,
      totalTime: totalTime || 0
    });

  } catch (err) {
    console.error("❌ POST /carroutes error:", err);

    // Check if it's a duplicate key error
    if (err.message && err.message.includes('ORA-00001')) {
      return res.status(400).json({
        error: "Route ID already exists",
        details: `Route with ID '${routeId}' already exists. Please use a different ID.`
      });
    }

    res.status(500).json({
      error: "Database insert failed",
      details: err.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
        console.log("🔌 Database connection closed");
      } catch (closeErr) {
        console.error("Connection close error:", closeErr);
      }
    }
  }
});

// UPDATE route
app.put("/carroutes/:id", async (req, res) => {
  const { id } = req.params;
  const { nameRoute, totalTime } = req.body;

  if (!nameRoute || nameRoute.trim() === "") {
    return res.status(400).json({ error: "Route name is required" });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `UPDATE ROUTE SET NAME_ROUTE = :NAME_ROUTE, TOTALSUM_TIME = :TOTALSUM_TIME WHERE ID = :id`,
      {
        NAME_ROUTE: nameRoute.trim(),
        TOTALSUM_TIME: totalTime || 0,
        id
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json({ message: "Route updated successfully!" });
  } catch (err) {
    console.error("❌ PUT /carroutes/:id error:", err);
    res.status(500).json({ error: "Database update failed", details: err.message });
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

// DELETE route
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
    console.error("❌ DELETE /carroutes/:id error:", err);
    res.status(500).json({ error: "Database delete failed", details: err.message });
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

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`);
  res.status(404).json({ error: `Endpoint ${req.method} ${req.url} not found` });
});
//สิ้นสุดส่วนของ API การจัดการเส้นทางรถ