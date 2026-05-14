package utilities;

import org.testng.ITestListener;
import org.testng.ITestResult;

/*
 * TestNG listener that automatically captures screenshots when a test fails.
 */
public class ScreenshotListener implements ITestListener {
    @Override
    public void onTestFailure(ITestResult result) {
        String screenshotPath = ScreenshotUtil.capture(BaseTest.getDriver(), result.getName());
        System.out.println("[FAILED] " + result.getName());
        System.out.println("[SCREENSHOT] " + screenshotPath);
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        System.out.println("[PASSED] " + result.getName());
    }
}
