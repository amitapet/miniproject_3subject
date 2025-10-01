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
//สิ้นสุดส่วนของ API login

// GET RESERVE
app.get("/reserve/:cus_id", async (req, res) => {
  let connection;
  try {
    const cusId = req.params.cus_id; // ดึงค่าจาก URL เช่น /reserve/C0001

    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT 
          r.ID,
          r.STARTT,
          r.STOPT,
          r.STATUS,
          r.SEAT,
          r.CUS_ID,
          r.ROUTE_ID,
          r.TRIP_ID,
          e.FNAME AS DRIVER_NAME,    
          tc.NAME AS CAR_TYPE,          
          ss.NAME AS PICKUP_NAME,       
          sstops.NAME AS DROPOFF_NAME,  
          sd.TIME_IN AS PICKUP_TIME,    
          stopd.TIME_IN AS DROPOFF_TIME,
          TO_CHAR(t.DATE_TRIP, 'DD-MON-YY') AS DATE_TRIP  
       FROM RESERVE r
       JOIN TRIP t ON r.TRIP_ID = t.ID
       JOIN EMPLOYEE e ON t.ID_EMPLOYEE = e.ID
       JOIN CAR c ON t.ID_CAR = c.ID
       JOIN TYPE_CAR tc ON c.ID_TYPECAR = tc.ID
       LEFT JOIN STOP_DURATION sd ON r.STARTT = sd.ID
       LEFT JOIN ROUTE_STATIONS rs_pick ON sd.ID_STOPS = rs_pick.ID
       LEFT JOIN STATION ss ON rs_pick.STOPS_ID = ss.ID
       LEFT JOIN STOP_DURATION stopd ON r.STOPT = stopd.ID
       LEFT JOIN ROUTE_STATIONS rs_drop ON stopd.ID_STOPS = rs_drop.ID
       LEFT JOIN STATION sstops ON rs_drop.STOPS_ID = sstops.ID
       WHERE r.CUS_ID = :cusId      -- เงื่อนไขค้นหาตาม cus_id
       ORDER BY r.ID`,
      { cusId }, // bind parameter
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /reserve error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});
//END RESERVE

//CANCEL RESERVE
app.post("/reserve/cancel/:id", async (req, res) => {
  let connection;
  try {
    const reserveId = req.params.id;
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `UPDATE RESERVE
       SET STATUS = 'cancel'
       WHERE ID = :reserveId`,
      { reserveId },
      { autoCommit: true }
    );
    res.json({ success: true, message: "ยกเลิกการจองเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("❌ POST /reserve/cancel error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
}); //CANCEL RESERVE

// GET assignments
app.get("/assignment/get/:empId/:status", async (req, res) => {
  let connection;
  try {
    const empId = req.params.empId;
    const status = req.params.status;
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT r.name_route, 
        t.id, to_char(t.date_trip,'dd/mm/yyyy') as tripDate, 
        t.timeout, t.id_car, 
        t.id_employee, ty.name, 
        w.status
      FROM trip t
      LEFT JOIN work w ON t.id = w.trip_id
      LEFT JOIN route r ON t.id_route = r.id
      LEFT JOIN car ON t.id_car = car.id
      LEFT JOIN type_car ty ON car.id_typecar = ty.id
      WHERE w.status = :status and t.ID_EMPLOYEE = :empId
      ORDER BY t.id`,
      { empId, status }, // bind parameter
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /assignment/get/:empId/:status error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/assignment/:empId", async (req, res) => {
  let connection;
  try {
    const empId = req.params.empId; // ดึงค่าจาก URL เช่น /assignment/E0002

    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT r.name_route, 
        t.id, to_char(t.date_trip,'dd/mm/yyyy') as tripDate, 
        t.timeout, t.id_car, car.SEAT, 
        t.id_employee, ty.name, 
        COUNT(t.id) AS trip_count
      FROM trip t
      LEFT JOIN route r ON t.id_route = r.id
      LEFT JOIN car ON t.id_car = car.id
      LEFT JOIN type_car ty ON car.id_typecar = ty.id
      WHERE t.id_employee = :empId
      GROUP BY r.name_route, t.id, t.date_trip, t.timeout, 
        t.id_car, car.SEAT, t.id_employee, ty.name
      having t.id not in (select Trip_id from work)
      ORDER BY t.id`,
      { empId }, // bind parameter
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /assignment/:empId error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});
// end assignment

// GET assignmentsdetail
app.get("/assignmentdetail/:tripId", async (req, res) => {
  let connection;
  try {
    const tripId = req.params.tripId;

    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT r.id,c.tel,
              c.fname,
              c.lname,
              ss.name AS pickup_name,
              stops.name AS dropoff_name,
              r.seat,
              r.status , count(r.id)
       FROM RESERVE r
       LEFT JOIN CUSTOMER c ON r.CUS_ID = c.id
       LEFT JOIN station ss ON r.startt = ss.id
       LEFT JOIN station stops ON r.stopt = stops.id
       LEFT JOIN Route_stations s ON ss.id = s.STOPS_ID
       LEFT JOIN Route_stations stop ON stops.id = stop.STOPS_ID
       WHERE r.TRIP_ID = :tripId
       group by r.id,c.tel,
              c.fname,
              c.lname,
              ss.name,
              stops.name,
              r.seat,
              r.status`,
      { tripId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /assignmentdetail/:tripId error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// end assignmentdetail

//work
app.get("/workdetail/:tripId", async (req, res) => {
  let connection;
  try {
    const tripId = req.params.tripId;

    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT r.name_route, r.id AS routeId,
        t.id, to_char(t.date_trip,'dd/mm/yyyy') as tripDate, 
        t.timeout, t.id_car, car.SEAT,
        t.id_employee, ty.name, 
        COUNT(t.id) AS trip_count
      FROM trip t
      LEFT JOIN route r ON t.id_route = r.id
      LEFT JOIN car ON t.id_car = car.id
      LEFT JOIN type_car ty ON car.id_typecar = ty.id
      WHERE t.id = :tripId
      GROUP BY r.name_route, r.id, t.id, t.date_trip, t.timeout, 
        t.id_car, car.SEAT, t.id_employee, ty.name
      ORDER BY t.id`,
      { tripId }, // bind parameter
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /assignment/:tripId error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});
app.get("/work/:empId", async (req, res) => {
  let connection;
  try {
    const empId = req.params.empId;

    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT trip_id
       FROM work 
       WHERE emp_id = :empId and status = 'doing'`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /work/:empId error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/work/check/:empId", async (req, res) => {
  let connection;
  try {
    const { empId } = req.params;
    connection = await oracledb.getConnection(dbConfig);

    // สมมุติว่า 1 EMP_ID ทำงานได้แค่ 1 TRIP ในเวลาเดียวกัน
    const result = await connection.execute(
      `SELECT trip_id 
       FROM work 
       WHERE emp_id = :empId and status = 'doing'`,
      { empId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
      return res.json({ hasWork: true, empId: result.rows[0].TRIP_ID });
    }

    res.json({ hasWork: false });
  } catch (err) {
    console.error("❌ GET /work/check/:empId error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/work/checkcus/:tripId/:reserveId", async (req, res) => {
  let connection;
  try {
    const { tripId, reserveId } = req.params;
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT id, trip_id
       FROM RESERVE
       WHERE TRIP_ID = :tripId AND ID = :reserveId`,
      { tripId, reserveId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
      return res.json({ valid: true });
    }

    res.json({ valid: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.post("/work", async (req, res) => {
  let connection;
  try {
    const { emp_id, trip_id } = req.body; // รับค่าจาก frontend
    connection = await oracledb.getConnection(dbConfig);

    // ตรวจสอบก่อนว่ามี record อยู่แล้วหรือยัง
    const check = await connection.execute(
      `SELECT COUNT(*) AS CNT 
       FROM work 
       WHERE emp_id = :emp_id AND trip_id = :trip_id`,
      { emp_id, trip_id },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (check.rows[0].CNT > 0) {
      return res.status(400).json({
        error: "งานนี้ถูกเริ่มแล้ว",
        details: "ไม่สามารถเริ่มงานซ้ำได้",
      });
    }

    // ถ้ายังไม่มี → insert
    await connection.execute(
      `INSERT INTO work (emp_id, trip_id , status) VALUES (:emp_id, :trip_id,'get')`,
      { emp_id, trip_id },
      { autoCommit: true }
    );

    res.json({ message: "✅ เริ่มงานเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("❌ POST /work error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.put("/work/scan", async (req, res) => {
  let connection;
  try {
    const { reserve_id } = req.body;
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `UPDATE RESERVE 
       SET status = 'getin'
       WHERE id = :reserve_id`,
      { reserve_id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "ไม่พบ ID แสกน" });
    }

    res.json({ message: "แสกนเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("❌ PUT /work/scan error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.put("/work/get", async (req, res) => {
  let connection;
  try {
    const { emp_id, trip_id } = req.body;
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `UPDATE work 
       SET status = 'doing'
       WHERE trip_id = :trip_id and emp_id = :emp_id`,
      { emp_id, trip_id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "ไม่พบงานที่ต้องการรับ" });
    }

    res.json({ message: "รับงานเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("❌ PUT /work/get error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.put("/work/end", async (req, res) => {
  let connection;
  try {
    const { emp_id, trip_id } = req.body;
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `UPDATE work 
       SET status = 'finished'
       WHERE emp_id = :emp_id AND trip_id = :trip_id`,
      { emp_id, trip_id },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "ไม่พบงานที่ต้องการจบ" });
    }

    res.json({ message: "จบงานเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("❌ PUT /work/end error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.put("/work/noshow", async (req, res) => {
  let connection;
  try {
    const { reserveId } = req.body;
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `UPDATE RESERVE
       SET STATUS = 'noshow'
       WHERE ID = :reserveId`,
      { reserveId },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "ไม่พบงานที่ต้องการเปลี่ยนสถานะ" });
    }

    res.json({ message: "เปลี่ยนสถานะเป็น Noshow เรียบร้อยแล้ว" });
  } catch (err) {
    console.error("❌ PUT /work/noshow error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

//end work

//Result

app.get("/result/:routeId", async (req, res) => {
  let connection;
  try {
    const routeId = req.params.routeId;

    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT r.id , r.name_route,
        s.name , rs.STATION_TIME
        from ROUTE_STATIONS rs
        left join route r on r.ID = rs.ID_ROUTE
        left join station s on rs.STOPS_ID = s.ID
        where rs.ID_ROUTE = :routeId
        order by rs.id`,
      { routeId }, // bind parameter
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /result/:routeId error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.get("/result/count/:tripId", async (req, res) => {
  let connection;
  try {
    const tripId = req.params.tripId;

    connection = await oracledb.getConnection(dbConfig);

    // ดึงข้อมูลจำนวนขึ้น/ลงต่อสถานี
    const result = await connection.execute(
      `select t.id , s.name , ss.name , re.seat , re.STATUS
        from RESERVE re
        left join trip t on re.TRIP_ID = t.id
        left join station s on re.startt = s.id
        left join station ss on re.stopt = ss.id
        where t.id = :tripId`,
      { tripId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json(result.rows);
  } catch (err) {
    console.error("❌ GET /result/count/:tripId error:", err);
    res.status(500).json({ error: "DB Error", details: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

//end Result

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

// 🔹 Create stations with auto ID
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

// 🔹 Update station
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
       `
    );
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

//สิ้นสุดส่วนของ API แผนก

//ส่วนของ API พนักงาน
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
      DEPARTMENT_NAME: row[8],
      POSITION_NAME: row[9],
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

//สิ้นสุดส่วนของ API พนักงาน

// ดึงข้อมูล POSITION
app.get("/POSITION", async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection();
    const result = await connection.execute(
      `SELECT ID, NAME,idpermission FROM POSITION`
    );
    const POSITION = result.rows.map((row) => ({
      ID: row[0],
      NAME: row[1],
      idpermission: row[2],
    }));
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

    console.log(
      `✅ Route inserted successfully. Rows affected: ${insertResult.rowsAffected}`
    );

    res.json({
      message: "Route created successfully!",
      routeId: routeId,
      stationCount: stations.length,
      totalTime: totalTime || 0,
    });
  } catch (err) {
    console.error("❌ POST /carroutes error:", err);

    // Check if it's a duplicate key error
    if (err.message && err.message.includes("ORA-00001")) {
      return res.status(400).json({
        error: "Route ID already exists",
        details: `Route with ID '${routeId}' already exists. Please use a different ID.`,
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
        id,
      },
      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json({ message: "Route updated successfully!" });
  } catch (err) {
    console.error("❌ PUT /carroutes/:id error:", err);
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

// ================== API ประเภทรถ ==================
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

// Error handler
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`);
  res
    .status(404)
    .json({ error: `Endpoint ${req.method} ${req.url} not found` });
});
//สิ้นสุดส่วนของ API การจัดการเส้นทางรถ

// ================== API การจัดการเส้นทางรถ ==================
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

    console.log(
      `✅ Route inserted successfully. Rows affected: ${insertResult.rowsAffected}`
    );

    res.json({
      message: "Route created successfully!",

      routeId: routeId,

      stationCount: stations.length,

      totalTime: totalTime || 0,
    });
  } catch (err) {
    console.error("❌ POST /carroutes error:", err);

    // Check if it's a duplicate key error

    if (err.message && err.message.includes("ORA-00001")) {
      return res.status(400).json({
        error: "Route ID already exists",

        details: `Route with ID '${routeId}' already exists. Please use a different ID.`,
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

        id,
      },

      { autoCommit: true }
    );

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Route not found" });
    }

    res.json({ message: "Route updated successfully!" });
  } catch (err) {
    console.error("❌ PUT /carroutes/:id error:", err);

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

// Error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res
    .status(500)
    .json({ error: "Internal server error", details: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url} not found`);

  res
    .status(404)
    .json({ error: `Endpoint ${req.method} ${req.url} not found` });
});

//สิ้นสุดส่วนของ API การจัดการเส้นทางรถ
