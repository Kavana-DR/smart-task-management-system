package utilities;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;

/*
 * ScreenshotUtil captures browser screenshots.
 * Failed tests use this utility through ScreenshotListener.
 */
public class ScreenshotUtil {
    public static String capture(WebDriver driver, String testName) {
        if (driver == null) {
            return "Driver was null. Screenshot not captured.";
        }

        try {
            Files.createDirectories(Path.of("screenshots"));
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = testName + "_" + timestamp + ".png";
            Path destination = Path.of("screenshots", fileName);

            File source = ((TakesScreenshot) driver).getScreenshotAs(OutputType.FILE);
            Files.copy(source.toPath(), destination);

            return destination.toAbsolutePath().toString();
        } catch (IOException exception) {
            return "Screenshot failed: " + exception.getMessage();
        }
    }
}
