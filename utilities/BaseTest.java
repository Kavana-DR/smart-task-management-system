package utilities;

import java.nio.file.Path;
import java.time.Duration;

import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

/*
 * BaseTest is the parent class for all Selenium tests.
 *
 * Selenium flow:
 * 1. Start Chrome browser before each test.
 * 2. Open the Smart Task Management System login page.
 * 3. Run the test steps.
 * 4. Close browser after each test.
 */
public class BaseTest {
    private static final ThreadLocal<WebDriver> DRIVER = new ThreadLocal<>();

    protected SeleniumHelper helper;
    protected String baseUrl;

    @BeforeMethod
    public void setUp() {
        configureChromeDriver();

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--start-maximized");
        options.addArguments("--disable-notifications");
        options.addArguments("--remote-allow-origins=*");

        WebDriver driver = new ChromeDriver(options);
        driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(20));
        DRIVER.set(driver);

        helper = new SeleniumHelper(driver);
        baseUrl = getBaseUrl();

        System.out.println("[INFO] Opening application: " + baseUrl);
        driver.get(baseUrl);
        clearBrowserStorage();
        driver.get(baseUrl);
    }

    @AfterMethod
    public void tearDown() {
        WebDriver driver = getDriver();
        if (driver != null) {
            System.out.println("[INFO] Closing browser");
            driver.quit();
            DRIVER.remove();
        }
    }

    public static WebDriver getDriver() {
        return DRIVER.get();
    }

    private void configureChromeDriver() {
        String driverPath = System.getProperty("chromedriver.path");
        if (driverPath != null && !driverPath.trim().isEmpty()) {
            System.setProperty("webdriver.chrome.driver", driverPath);
            return;
        }

        Path defaultDriver = Path.of("drivers", isWindows() ? "chromedriver.exe" : "chromedriver").toAbsolutePath();
        if (defaultDriver.toFile().exists()) {
            System.setProperty("webdriver.chrome.driver", defaultDriver.toString());
        }
    }

    private String getBaseUrl() {
        String configuredUrl = System.getProperty("app.url");
        if (configuredUrl != null && !configuredUrl.trim().isEmpty()) {
            return configuredUrl;
        }

        return Path.of("index.html").toAbsolutePath().toUri().toString();
    }

    private void clearBrowserStorage() {
        try {
            JavascriptExecutor js = (JavascriptExecutor) getDriver();
            js.executeScript("localStorage.clear(); sessionStorage.clear();");
        } catch (Exception exception) {
            System.out.println("[WARN] Could not clear browser storage: " + exception.getMessage());
        }
    }

    private boolean isWindows() {
        return System.getProperty("os.name").toLowerCase().contains("win");
    }
}
