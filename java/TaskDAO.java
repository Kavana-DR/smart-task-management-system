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

    public void insertTask(int userId, String title, String description, String priority, String status, String dueDate) {
        String sql = "INSERT INTO tasks (user_id, title, description, priority, status, due_date) VALUES (?, ?, ?, ?, ?, ?)";

        /*
         * JDBC insert flow:
         * 1. Open connection.
         * 2. Create PreparedStatement.
         * 3. Set values for each ? placeholder.
         * 4. Execute update query.
         */
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, userId);
            statement.setString(2, title);
            statement.setString(3, description);
            statement.setString(4, priority);
            statement.setString(5, status);
            statement.setDate(6, Date.valueOf(dueDate));

            int rowsInserted = statement.executeUpdate();
            System.out.println(rowsInserted + " task inserted successfully.");
        } catch (SQLException exception) {
            System.out.println("Insert failed: " + exception.getMessage());
        }
    }

    public void fetchTasks(int userId) {
        String sql = "SELECT id, user_id, title, description, priority, status, due_date FROM tasks WHERE user_id = ? ORDER BY id DESC";

        /*
         * JDBC fetch flow:
         * 1. Open connection.
         * 2. Run SELECT query.
         * 3. Loop through ResultSet.
         * 4. Read each column value.
         */
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, userId);

            try (ResultSet resultSet = statement.executeQuery()) {
                System.out.println("\n--- Task List for User ID " + userId + " ---");
                while (resultSet.next()) {
                    System.out.println("ID: " + resultSet.getInt("id"));
                    System.out.println("User ID: " + resultSet.getInt("user_id"));
                    System.out.println("Title: " + resultSet.getString("title"));
                    System.out.println("Description: " + resultSet.getString("description"));
                    System.out.println("Priority: " + resultSet.getString("priority"));
                    System.out.println("Status: " + resultSet.getString("status"));
                    System.out.println("Due Date: " + resultSet.getDate("due_date"));
                    System.out.println("--------------------");
                }
            }
        } catch (SQLException exception) {
            System.out.println("Fetch failed: " + exception.getMessage());
        }
    }

    public void updateTask(int userId, int taskId, String title, String description, String priority, String status, String dueDate) {
        String sql = "UPDATE tasks SET title = ?, description = ?, priority = ?, status = ?, due_date = ? WHERE id = ? AND user_id = ?";

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
            statement.setInt(6, taskId);
            statement.setInt(7, userId);

            int rowsUpdated = statement.executeUpdate();
            System.out.println(rowsUpdated + " task updated successfully.");
        } catch (SQLException exception) {
            System.out.println("Update failed: " + exception.getMessage());
        }
    }

    public void deleteTask(int userId, int taskId) {
        String sql = "DELETE FROM tasks WHERE id = ? AND user_id = ?";

        /*
         * JDBC delete flow:
         * 1. Open connection.
         * 2. Set task id.
         * 3. Execute delete query.
         */
        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setInt(1, taskId);
            statement.setInt(2, userId);

            int rowsDeleted = statement.executeUpdate();
            System.out.println(rowsDeleted + " task deleted successfully.");
        } catch (SQLException exception) {
            System.out.println("Delete failed: " + exception.getMessage());
        }
    }

    public static void main(String[] args) {
        TaskDAO taskDAO = new TaskDAO();
        UserDAO userDAO = new UserDAO();
        int loggedInUserId = userDAO.getUserIdByEmail("admin@gmail.com");

        if (loggedInUserId == -1) {
            System.out.println("Demo user not found. Run database/schema.sql first.");
            return;
        }

        taskDAO.insertTask(
                loggedInUserId,
                "Prepare JDBC Demo",
                "Create simple MySQL CRUD example for internship presentation",
                "High",
                "To Do",
                "2026-05-20"
        );

        taskDAO.fetchTasks(loggedInUserId);

        taskDAO.updateTask(
                loggedInUserId,
                1,
                "Prepare JDBC Demo Updated",
                "Explain JDBC Connection, PreparedStatement, and ResultSet",
                "Medium",
                "In Progress",
                "2026-05-21"
        );

        taskDAO.fetchTasks(loggedInUserId);

        // Change this task id to delete a real task for the logged-in user.
        // taskDAO.deleteTask(loggedInUserId, 1);
    }
}
