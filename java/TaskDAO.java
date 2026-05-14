import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/*
 * TaskDAO contains simple JDBC CRUD operations for the tasks table.
 *
 * DAO means Data Access Object. It separates database code from UI code.
 * This project keeps the frontend unchanged and provides JDBC operations
 * that can be demonstrated from Java during internship presentation.
 */
public class TaskDAO {

    public void insertTask(String title, String description, String priority, String status, String dueDate) {
        String sql = "INSERT INTO tasks (title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?)";

        /*
         * JDBC insert flow:
         * 1. Open connection.
         * 2. Create PreparedStatement.
         * 3. Set values for each ? placeholder.
         * 4. Execute update query.
         */
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, title);
            statement.setString(2, description);
            statement.setString(3, priority);
            statement.setString(4, status);
            statement.setDate(5, Date.valueOf(dueDate));

            int rowsInserted = statement.executeUpdate();
            System.out.println(rowsInserted + " task inserted successfully.");
        } catch (SQLException exception) {
            System.out.println("Insert failed: " + exception.getMessage());
        }
    }

    public void fetchTasks() {
        String sql = "SELECT id, title, description, priority, status, due_date FROM tasks ORDER BY id DESC";

        /*
         * JDBC fetch flow:
         * 1. Open connection.
         * 2. Run SELECT query.
         * 3. Loop through ResultSet.
         * 4. Read each column value.
         */
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {

            System.out.println("\n--- Task List ---");
            while (resultSet.next()) {
                System.out.println("ID: " + resultSet.getInt("id"));
                System.out.println("Title: " + resultSet.getString("title"));
                System.out.println("Description: " + resultSet.getString("description"));
                System.out.println("Priority: " + resultSet.getString("priority"));
                System.out.println("Status: " + resultSet.getString("status"));
                System.out.println("Due Date: " + resultSet.getDate("due_date"));
                System.out.println("--------------------");
            }
        } catch (SQLException exception) {
            System.out.println("Fetch failed: " + exception.getMessage());
        }
    }

    public void updateTask(int id, String title, String description, String priority, String status, String dueDate) {
        String sql = "UPDATE tasks SET title = ?, description = ?, priority = ?, status = ?, due_date = ? WHERE id = ?";

        /*
         * JDBC update flow:
         * 1. Open connection.
         * 2. Set updated values.
         * 3. Use task id in WHERE condition.
         * 4. Execute update query.
         */
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, title);
            statement.setString(2, description);
            statement.setString(3, priority);
            statement.setString(4, status);
            statement.setDate(5, Date.valueOf(dueDate));
            statement.setInt(6, id);

            int rowsUpdated = statement.executeUpdate();
            System.out.println(rowsUpdated + " task updated successfully.");
        } catch (SQLException exception) {
            System.out.println("Update failed: " + exception.getMessage());
        }
    }

    public void deleteTask(int id) {
        String sql = "DELETE FROM tasks WHERE id = ?";

        /*
         * JDBC delete flow:
         * 1. Open connection.
         * 2. Set task id.
         * 3. Execute delete query.
         */
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, id);

            int rowsDeleted = statement.executeUpdate();
            System.out.println(rowsDeleted + " task deleted successfully.");
        } catch (SQLException exception) {
            System.out.println("Delete failed: " + exception.getMessage());
        }
    }

    public static void main(String[] args) {
        TaskDAO taskDAO = new TaskDAO();

        taskDAO.insertTask(
                "Prepare JDBC Demo",
                "Create simple MySQL CRUD example for internship presentation",
                "High",
                "To Do",
                "2026-05-20"
        );

        taskDAO.fetchTasks();

        taskDAO.updateTask(
                1,
                "Prepare JDBC Demo Updated",
                "Explain JDBC Connection, PreparedStatement, and ResultSet",
                "Medium",
                "In Progress",
                "2026-05-21"
        );

        taskDAO.fetchTasks();

        // Change this id to delete a real task from your database.
        // taskDAO.deleteTask(1);
    }
}
