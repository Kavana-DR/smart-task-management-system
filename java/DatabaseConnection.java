import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

/*
 * DatabaseConnection keeps the MySQL connection logic in one place.
 *
 * JDBC flow:
 * 1. Load MySQL JDBC driver.
 * 2. Use DriverManager to open a database connection.
 * 3. Return the Connection object to DAO classes.
 */
public class DatabaseConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/task_manager";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "root";

    public static Connection getConnection() throws SQLException {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException exception) {
            System.out.println("MySQL JDBC Driver not found. Add mysql-connector-j.jar to the classpath.");
        }

        return DriverManager.getConnection(URL, USERNAME, PASSWORD);
    }
}
