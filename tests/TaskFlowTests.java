package tests;

import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.testng.Assert;
import org.testng.annotations.Test;

import utilities.BaseTest;

/*
 * TaskFlowTests automates the main Smart Task Management System flows.
 *
 * Selenium test flow:
 * 1. Open application.
 * 2. Perform user action such as login or task creation.
 * 3. Wait for expected UI result.
 * 4. Assert the result.
 */
public class TaskFlowTests extends BaseTest {
    private static final String VALID_EMAIL = "admin@gmail.com";
    private static final String VALID_PASSWORD = "admin123";
    private static final String USERS_STORAGE_KEY = "registered-users";

    @Test(priority = 1)
    public void validLoginTest() {
        login(VALID_EMAIL, VALID_PASSWORD);

        helper.waitForUrlContains("dashboard.html");
        Assert.assertTrue(helper.isVisible(By.xpath("//h1[contains(normalize-space(),'Dashboard')]")),
                "Dashboard heading should be visible after valid login.");
        Assert.assertTrue(helper.isVisible(By.cssSelector(".profile-avatar")),
                "Profile avatar should be visible after login.");
    }

    @Test(priority = 2)
    public void invalidLoginTest() {
        login("wrong@gmail.com", "wrong123");

        Assert.assertTrue(helper.isVisible(By.cssSelector(".auth-error")),
                "Invalid login should show an error message.");
        Assert.assertTrue(helper.text(By.cssSelector(".auth-error")).contains("Invalid email or password"),
                "Error message should explain invalid credentials.");
    }

    @Test(priority = 3)
    public void successfulRegistrationTest() {
        String email = uniqueEmail();
        String password = "newuser123";

        openRegisterPage();
        registerUser("Selenium User", email, password, password);

        helper.waitForTextInLocalStorage(USERS_STORAGE_KEY, email);
        helper.waitForUrlContains("index.html");
        login(email, password);

        helper.waitForUrlContains("dashboard.html");
        Assert.assertTrue(helper.isVisible(By.xpath("//h1[contains(normalize-space(),'Dashboard')]")),
                "Newly registered user should be able to login.");
    }

    @Test(priority = 4)
    public void duplicateEmailRegistrationTest() {
        String email = uniqueEmail();
        String password = "duplicate123";

        openRegisterPage();
        registerUser("First User", email, password, password);
        helper.waitForUrlContains("index.html");

        openRegisterPage();
        registerUser("Second User", email, password, password);

        Assert.assertTrue(helper.isVisible(By.cssSelector(".auth-error")),
                "Duplicate email should show validation error.");
        Assert.assertTrue(helper.text(By.cssSelector(".auth-error")).contains("Email already registered"),
                "Duplicate email message should be visible.");
    }

    @Test(priority = 5)
    public void userSpecificTasksTest() {
        String firstUserEmail = uniqueEmail();
        String secondUserEmail = uniqueEmail();
        String password = "private123";
        String privateTaskTitle = uniqueTitle("Private Task");

        openRegisterPage();
        registerUser("First Task User", firstUserEmail, password, password);
        helper.waitForUrlContains("index.html");
        login(firstUserEmail, password);
        helper.waitForUrlContains("dashboard.html");
        helper.click(By.cssSelector("[data-page='tasks']"));
        helper.waitForUrlContains("tasks.html");
        createTask(privateTaskTitle, "Only first user should see this", "High", "To Do", "2026-05-25");
        Assert.assertTrue(isTaskVisible(privateTaskTitle), "First user should see their own task.");

        helper.click(By.cssSelector("[data-page='logout']"));
        helper.waitForUrlContains("index.html");

        openRegisterPage();
        registerUser("Second Task User", secondUserEmail, password, password);
        helper.waitForUrlContains("index.html");
        login(secondUserEmail, password);
        helper.waitForUrlContains("dashboard.html");
        helper.click(By.cssSelector("[data-page='tasks']"));
        helper.waitForUrlContains("tasks.html");

        Assert.assertFalse(isTaskVisible(privateTaskTitle), "Second user should not see first user's task.");
    }

    @Test(priority = 6)
    public void addTaskTest() {
        String title = uniqueTitle("Add Task");

        loginAndOpenTasks();
        createTask(title, "Created by Selenium automation", "High", "To Do", "2026-05-20");

        helper.waitForVisible(taskCardByTitle(title));
        Assert.assertTrue(isTaskVisible(title), "Created task should be visible on Kanban board.");
        Assert.assertTrue(helper.isVisible(By.xpath("//p[contains(text(),'Task created successfully')]")),
                "Success toast should appear after task creation.");
    }

    @Test(priority = 7)
    public void editTaskTest() {
        String title = uniqueTitle("Edit Task");
        String updatedTitle = title + " Updated";

        loginAndOpenTasks();
        createTask(title, "Task before edit", "Medium", "To Do", "2026-05-21");
        clickTaskAction(title, "task-edit");

        helper.type(By.id("taskTitle"), updatedTitle);
        helper.type(By.id("taskDesc"), "Task edited by Selenium");
        helper.click(By.cssSelector("#addTaskModal .modal-footer .btn-primary"));

        helper.waitForTextInCurrentUserTasks(updatedTitle);
        helper.waitForVisible(taskCardByTitle(updatedTitle));
        Assert.assertTrue(isTaskVisible(updatedTitle), "Updated task title should be visible.");
        Assert.assertFalse(isTaskVisible(title), "Old task title should not remain visible after edit.");
    }

    @Test(priority = 8)
    public void deleteTaskTest() {
        String title = uniqueTitle("Delete Task");

        loginAndOpenTasks();
        createTask(title, "Task to delete", "Low", "To Do", "2026-05-22");
        clickTaskAction(title, "task-delete");

        Assert.assertTrue(helper.isVisible(By.xpath("//p[contains(text(),'Task deleted')]")),
                "Delete success toast should be visible.");
        helper.waitForInvisible(taskCardByTitle(title));
        Assert.assertFalse(isTaskVisible(title), "Deleted task should not be visible.");
    }

    @Test(priority = 9)
    public void searchTaskTest() {
        String title = uniqueTitle("Search Task");

        loginAndOpenTasks();
        createTask(title, "Task to search", "Medium", "To Do", "2026-05-23");
        helper.type(By.cssSelector(".search-input"), title);

        helper.waitForVisible(taskCardByTitle(title));
        Assert.assertTrue(isTaskVisible(title), "Task should be visible after searching by title.");
    }

    @Test(priority = 10)
    public void markTaskCompletedTest() {
        String title = uniqueTitle("Complete Task");

        loginAndOpenTasks();
        createTask(title, "Task to complete", "High", "To Do", "2026-05-24");
        clickTaskAction(title, "task-complete");

        By completedTask = By.xpath("//*[@data-column='completed']//*[contains(concat(' ',normalize-space(@class),' '),' task-title ') and normalize-space()='" + title + "']");
        Assert.assertTrue(helper.isVisible(completedTask), "Task should move to Completed column.");
    }

    @Test(priority = 11)
    public void logoutTest() {
        login(VALID_EMAIL, VALID_PASSWORD);
        helper.waitForUrlContains("dashboard.html");

        helper.click(By.cssSelector("[data-page='logout']"));
        helper.waitForUrlContains("index.html");

        Assert.assertTrue(helper.isVisible(By.id("email")), "Email input should be visible after logout.");
        Assert.assertTrue(helper.isVisible(By.id("password")), "Password input should be visible after logout.");
    }

    private void login(String email, String password) {
        System.out.println("[INFO] Logging in with email: " + email);
        helper.type(By.id("email"), email);
        helper.type(By.id("password"), password);
        helper.click(By.cssSelector("button[type='submit']"));
    }

    private void openRegisterPage() {
        getDriver().get(baseUrl.replace("index.html", "register.html"));
        helper.waitForVisible(By.id("registerName"));
    }

    private void registerUser(String name, String email, String password, String confirmPassword) {
        System.out.println("[INFO] Registering user with email: " + email);
        helper.type(By.id("registerName"), name);
        helper.type(By.id("registerEmail"), email);
        helper.type(By.id("registerPassword"), password);
        helper.type(By.id("confirmPassword"), confirmPassword);
        helper.click(By.cssSelector("form[data-storage-key='user-register'] button[type='submit']"));
    }

    private void loginAndOpenTasks() {
        login(VALID_EMAIL, VALID_PASSWORD);
        helper.waitForUrlContains("dashboard.html");
        helper.click(By.cssSelector("[data-page='tasks']"));
        helper.waitForUrlContains("tasks.html");
        Assert.assertTrue(helper.isVisible(By.cssSelector(".kanban-container")),
                "Kanban board should be visible.");
    }

    private void createTask(String title, String description, String priority, String status, String dueDate) {
        System.out.println("[INFO] Creating task: " + title);
        helper.click(By.cssSelector(".page-header .btn-primary"));
        helper.waitForVisible(By.cssSelector("#addTaskModal.active"));
        helper.type(By.id("taskTitle"), title);
        helper.type(By.id("taskDesc"), description);
        helper.selectByVisibleText(By.id("taskPriority"), priority);
        helper.setInputValue(By.id("taskDueDate"), dueDate);
        helper.selectByVisibleText(By.id("taskStatus"), status);
        helper.click(By.cssSelector("#addTaskModal .modal-footer .btn-primary"));
        helper.waitForTextInCurrentUserTasks(title);
        helper.waitForInvisible(By.cssSelector("#addTaskModal.active"));
        helper.waitForVisible(taskCardByTitle(title));
    }

    private void clickTaskAction(String title, String actionClass) {
        WebElement card = helper.waitForVisible(taskCardByTitle(title));
        helper.scrollIntoView(card);

        WebElement action = card.findElement(By.cssSelector("." + actionClass));
        helper.javascriptClick(action);
    }

    private boolean isTaskVisible(String title) {
        return helper.isVisible(taskTitleByText(title));
    }

    private By taskTitleByText(String title) {
        return By.xpath("//*[contains(concat(' ',normalize-space(@class),' '),' task-title ') and normalize-space()='" + title + "']");
    }

    private By taskCardByTitle(String title) {
        return By.xpath("//*[contains(concat(' ',normalize-space(@class),' '),' task-card ')][.//*[contains(concat(' ',normalize-space(@class),' '),' task-title ') and normalize-space()='" + title + "']]");
    }

    private String uniqueTitle(String prefix) {
        return prefix + " " + System.currentTimeMillis();
    }

    private String uniqueEmail() {
        return "selenium" + System.nanoTime() + "@example.com";
    }
}
