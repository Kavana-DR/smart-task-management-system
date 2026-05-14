import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

/*
 * UserDAO contains simple JDBC operations for the users table.
 *
 * This is intentionally beginner-friendly:
 * 1. Validate input.
 * 2. Check duplicate email.
 * 3. Insert user with PreparedStatement.
 * 4. Reuse the same table for login validation.
 */
public class UserDAO {

    public boolean registerUser(String name, String email, String password, String confirmPassword) {
        if (isBlank(name) || isBlank(email) || isBlank(password) || isBlank(confirmPassword)) {
            System.out.println("Registration failed: all fields are required.");
            return false;
        }

        if (!password.equals(confirmPassword)) {
            System.out.println("Registration failed: passwords do not match.");
            return false;
        }

        if (emailExists(email)) {
            System.out.println("Registration failed: email already registered.");
            return false;
        }

        String sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, name.trim());
            statement.setString(2, email.trim().toLowerCase());
            statement.setString(3, password);

            int rowsInserted = statement.executeUpdate();
            System.out.println(rowsInserted + " user registered successfully.");
            return rowsInserted > 0;
        } catch (SQLException exception) {
            System.out.println("Registration failed: " + exception.getMessage());
            return false;
        }
    }

    public boolean validateLogin(String email, String password) {
        String sql = "SELECT id FROM users WHERE email = ? AND password = ?";

        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, email.trim().toLowerCase());
            statement.setString(2, password);

            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        } catch (SQLException exception) {
            System.out.println("Login validation failed: " + exception.getMessage());
            return false;
        }
    }

    public int getUserIdByEmail(String email) {
        String sql = "SELECT id FROM users WHERE email = ?";

        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, email.trim().toLowerCase());

            try (ResultSet resultSet = statement.executeQuery()) {
                if (resultSet.next()) {
                    return resultSet.getInt("id");
                }
            }
        } catch (SQLException exception) {
            System.out.println("User lookup failed: " + exception.getMessage());
        }

        return -1;
    }

    public boolean emailExists(String email) {
        String sql = "SELECT id FROM users WHERE email = ?";

        try (Connection connection = DatabaseConnection.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {

            statement.setString(1, email.trim().toLowerCase());

            try (ResultSet resultSet = statement.executeQuery()) {
                return resultSet.next();
            }
        } catch (SQLException exception) {
            System.out.println("Duplicate email check failed: " + exception.getMessage());
            return false;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    public static void main(String[] args) {
        UserDAO userDAO = new UserDAO();

        userDAO.registerUser(
                "Demo User",
                "demo.user@example.com",
                "demo123",
                "demo123"
        );

        boolean canLogin = userDAO.validateLogin("demo.user@example.com", "demo123");
        System.out.println("Login allowed: " + canLogin);
    }
}
