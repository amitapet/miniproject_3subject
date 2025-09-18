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
    ? "C:\\oracle\\instantclient_23_9" // <-- เปลี่ยน path ของคุณ
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

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let connection;

  try {
    connection = await oracledb.getConnection();

    const result = await connection.execute(
      `SELECT * FROM CUSTOMER WHERE USERNAME = :username AND USER_PASSWORD = :user_password`,
      [username, password], // bind parameter
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
      res.json({ success: true, message: "✅ Login success" });
    } else {
      res
        .status(401)
        .json({ success: false, message: "❌ Invalid username or password" });
    }
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ success: false, message: "DB Error" });
  } finally {
    if (connection) await connection.close();
  }
});

initOracle().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
